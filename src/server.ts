import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import QRCode from "qrcode";
import { networkInterfaces } from "os";
import "dotenv/config";

interface ExtendedWebSocket extends WebSocket {
  playerId?: "player1" | "player2";
}

interface MessageData {
  type: string;
  player?: string;
  direction?: string;
  origin?: string;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const isProduction = process.env.NODE_ENV === "production";
const publicDir = "public";

// CSP headers for production
if (isProduction) {
  app.use((_req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: http: https:; img-src 'self' data:;",
    );
    next();
  });
}

app.use(express.static(publicDir));

const players = {
  player1: null as ExtendedWebSocket | null,
  player2: null as ExtendedWebSocket | null,
};
let gameScreen: ExtendedWebSocket | null = null;
let aiMode = false;

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
      const addr = server.address();
      const port = addr && typeof addr !== "string" ? addr.port : 3000;
      const ip = getLocalIP();

      // In development, Vite serves the frontend on port 5174 (configured in vite.config.ts)
      // In production, the server serves from dist/public
      const controllerPort = isProduction ? port : 5174;
      const domain =
        isProduction && process.env.BACKEND_URL
          ? process.env.BACKEND_URL
          : `http://${ip}:${controllerPort}`;
      const url = `${domain}/controller.html`;

      QRCode.toDataURL(url, { width: 300 }, (_err, qrCode) => {
        ws.send(JSON.stringify({ type: "qr_code", qrCode, url }));
      });
    }

    if (data.type === "game_ended") {
      // Notify all players that game ended
      if (players.player1) {
        players.player1.send(JSON.stringify({ type: "game_ended" }));
      }
      if (players.player2) {
        players.player2.send(JSON.stringify({ type: "game_ended" }));
      }
    }

    if (data.type === "register_player") {
      const playerId = !players.player1
        ? "player1"
        : !players.player2 && !aiMode
          ? "player2"
          : null;

      if (!playerId) {
        ws.send(JSON.stringify({ type: "error", message: "Game is full" }));
        return;
      }

      players[playerId] = ws;
      ws.playerId = playerId;
      ws.send(JSON.stringify({ type: "assigned", player: playerId }));

      if (playerId === "player1" && gameScreen) {
        gameScreen.send(JSON.stringify({ type: "player1_connected" }));
      } else if (playerId === "player2" && gameScreen) {
        gameScreen.send(JSON.stringify({ type: "start_game" }));
        // Notify player 1 that game is starting
        if (players.player1) {
          players.player1.send(JSON.stringify({ type: "game_start" }));
        }
      }
    }

    if (data.type === "start_vs_ai") {
      aiMode = true;
      if (gameScreen) {
        gameScreen.send(JSON.stringify({ type: "enable_ai" }));
        gameScreen.send(JSON.stringify({ type: "start_game" }));
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

    if (data.type === "restart_game") {
      // Notify game screen to restart (preserve aiMode for AI games)
      if (gameScreen) {
        gameScreen.send(JSON.stringify({ type: "restart_game", aiMode }));
      }

      // Notify all players
      if (players.player1) {
        players.player1.send(JSON.stringify({ type: "game_restarted" }));
      }
      if (players.player2) {
        players.player2.send(JSON.stringify({ type: "game_restarted" }));
      }
    }

    if (data.type === "wait_for_players") {
      // Reset game state and show QR code
      aiMode = false;

      // Notify game screen to show QR code
      if (gameScreen) {
        gameScreen.send(JSON.stringify({ type: "show_qr" }));
      }

      // Notify all players
      if (players.player1) {
        players.player1.send(JSON.stringify({ type: "game_restarted" }));
      }
      if (players.player2) {
        players.player2.send(JSON.stringify({ type: "game_restarted" }));
      }
    }
  });

  ws.on("close", () => {
    const playerId = ws.playerId;

    if (playerId && players[playerId] === ws) {
      players[playerId] = null;
      gameScreen?.send(
        JSON.stringify({ type: "player_disconnected", player: playerId }),
      );
    }

    if (ws === gameScreen) {
      gameScreen = null;
      aiMode = false;
    }

    if (!players.player1 && !players.player2 && gameScreen) {
      gameScreen.send(JSON.stringify({ type: "all_players_disconnected" }));
      aiMode = false;
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  const ip = getLocalIP();
  const env = isProduction ? "production" : "development";
  console.log(`🎮 Server running at http://${ip}:${PORT}`);

  if (!isProduction) {
    console.log(
      `📱 Open http://${ip}:5173 on your computer (Vite dev server with hot reload)`,
    );
  } else {
    console.log(`📱 Open https://${process.env.BACKEND_URL} on your computer`);
  }

  console.log(`🔧 Environment: ${env}`);
});
