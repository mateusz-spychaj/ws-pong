interface MessageData {
  type: string;
  player?: string;
  message?: string;
}

export {};

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsHost = import.meta.env.DEV ? "localhost:3000" : window.location.host;
const gameWs = new WebSocket(`${wsProtocol}//${wsHost}`);
const statusEl = document.getElementById("status")!;
const controls = document.getElementById("controls")!;
const upBtn = document.getElementById("upBtn")!;
const downBtn = document.getElementById("downBtn")!;
const exitBtn = document.getElementById("exitBtn")!;

let playerId: string | null = null;

gameWs.onopen = () => {
  gameWs.send(JSON.stringify({ type: "register_player" }));
};

gameWs.onmessage = (event: MessageEvent) => {
  const data: MessageData = JSON.parse(event.data);

  if (data.type === "assigned") {
    playerId = data.player || null;
    statusEl.textContent = `You are ${data.player === "player1" ? "Player 1 (Left)" : "Player 2 (Right)"}`;
    controls.classList.remove("hidden");
  }

  if (data.type === "error") {
    statusEl.textContent = data.message || "Error occurred";
  }
};

function sendMove(direction: string): void {
  if (gameWs.readyState === WebSocket.OPEN) {
    gameWs.send(JSON.stringify({ type: "move", direction }));
  }
}

// Touch events
upBtn.addEventListener("touchstart", (e: TouchEvent) => {
  e.preventDefault();
  sendMove("up");
});
upBtn.addEventListener("touchend", (e: TouchEvent) => {
  e.preventDefault();
  sendMove("stop");
});

downBtn.addEventListener("touchstart", (e: TouchEvent) => {
  e.preventDefault();
  sendMove("down");
});
downBtn.addEventListener("touchend", (e: TouchEvent) => {
  e.preventDefault();
  sendMove("stop");
});

// Mouse events (for testing on desktop)
upBtn.addEventListener("mousedown", () => sendMove("up"));
upBtn.addEventListener("mouseup", () => sendMove("stop"));
downBtn.addEventListener("mousedown", () => sendMove("down"));
downBtn.addEventListener("mouseup", () => sendMove("stop"));

// Exit button
exitBtn.addEventListener("click", () => {
  gameWs.close();
  statusEl.textContent = "Disconnected";
  controls.classList.add("hidden");
});
