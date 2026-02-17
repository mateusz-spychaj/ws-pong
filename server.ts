import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import QRCode from "qrcode";
import { networkInterfaces } from "os";

interface ExtendedWebSocket extends WebSocket {
  playerId?: "player1" | "player2";
}

interface Players {
  player1: ExtendedWebSocket | null;
  player2: ExtendedWebSocket | null;
}

interface MessageData {
  type: string;
  player?: string;
  direction?: string;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("public"));

const players: Players = { player1: null, player2: null };
let gameScreen: ExtendedWebSocket | null = null;

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;

    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

wss.on("connection", (ws: ExtendedWebSocket) => {
  ws.on("message", (message: Buffer) => {
    const data: MessageData = JSON.parse(message.toString());

    if (data.type === "register_screen") {
      gameScreen = ws;
      const ip = getLocalIP();
      const address = server.address();
      if (!address || typeof address === "string") return;
      const port = address.port;
      const url = `http://${ip}:${port}/controller.html`;

      QRCode.toDataURL(url, { width: 300 }, (_err, qrCode) => {
        ws.send(JSON.stringify({ type: "qr_code", qrCode, url }));
      });
    }

    if (data.type === "register_player") {
      if (!players.player1) {
        players.player1 = ws;
        ws.playerId = "player1";
        ws.send(JSON.stringify({ type: "assigned", player: "player1" }));
      } else if (!players.player2) {
        players.player2 = ws;
        ws.playerId = "player2";
        ws.send(JSON.stringify({ type: "assigned", player: "player2" }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Game is full" }));
        return;
      }

      if (gameScreen && players.player1 && players.player2) {
        gameScreen.send(JSON.stringify({ type: "start_game" }));
        gameScreen.send(JSON.stringify({ type: "hide_qr" }));
      }
    }

    if (data.type === "move" && gameScreen) {
      gameScreen.send(
        JSON.stringify({
          type: "player_move",
          player: ws.playerId,
          direction: data.direction,
        }),
      );
    }
  });

  ws.on("close", () => {
    if (ws === players.player1) {
      players.player1 = null;
      if (gameScreen)
        gameScreen.send(
          JSON.stringify({ type: "player_disconnected", player: "player1" }),
        );
    }
    if (ws === players.player2) {
      players.player2 = null;
      if (gameScreen)
        gameScreen.send(
          JSON.stringify({ type: "player_disconnected", player: "player2" }),
        );
    }
    if (ws === gameScreen) gameScreen = null;

    // Check if both players disconnected
    if (!players.player1 && !players.player2 && gameScreen) {
      gameScreen.send(JSON.stringify({ type: "all_players_disconnected" }));
    }
  });
});

const PORT = process.env.PORT || 3000;
const VITE_PORT = 5173;
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;

server.listen(PORT, () => {
  const ip = getLocalIP();
  console.log(`🎮 Server running at http://${ip}:${PORT}`);
  if (isDevelopment) {
    console.log(
      `📱 Open http://${ip}:${VITE_PORT} on your computer (Vite dev server with hot reload)`,
    );
  } else {
    console.log(`📱 Open http://${ip}:${PORT} on your computer`);
  }
  console.log(`🔧 Environment: ${isProduction ? "production" : "development"}`);
});
