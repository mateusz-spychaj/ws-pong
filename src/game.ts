export {};

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
}

interface Score {
  player1: number;
  player2: number;
}

interface Game {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  score: Score;
  running: boolean;
}

interface MessageData {
  type: string;
  qrCode?: string;
  player?: string;
  direction?: string;
}

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsHost = import.meta.env.DEV ? "localhost:3000" : window.location.host;
const gameWs = new WebSocket(`${wsProtocol}//${wsHost}`);

const game: Game = {
  ball: { x: 400, y: 300, dx: 4, dy: 4, radius: 8 },
  paddle1: { x: 20, y: 250, width: 15, height: 100, dy: 0 },
  paddle2: { x: 765, y: 250, width: 15, height: 100, dy: 0 },
  score: { player1: 0, player2: 0 },
  running: false,
};

gameWs.onopen = () => {
  gameWs.send(JSON.stringify({ type: "register_screen" }));
};

gameWs.onmessage = (event: MessageEvent) => {
  const data: MessageData = JSON.parse(event.data);

  if (data.type === "qr_code") {
    const qrCodeEl = document.getElementById("qrCode");
    if (qrCodeEl) {
      qrCodeEl.innerHTML = `<img src="${data.qrCode}" alt="QR Code"><p style="color: #333; margin-top: 10px;">Scan to join</p>`;
    }
  }

  if (data.type === "hide_qr") {
    document.getElementById("qrCode")?.classList.add("hidden");
  }

  if (data.type === "start_game") {
    document.getElementById("status")?.classList.add("hidden");
    document.getElementById("qrCode")?.classList.add("hidden");
    document.getElementById("score")?.classList.remove("hidden");
    canvas.classList.remove("hidden");
    game.running = true;
    gameLoop();
  }

  if (data.type === "player_move") {
    const paddle = data.player === "player1" ? game.paddle1 : game.paddle2;
    paddle.dy =
      data.direction === "up" ? -8 : data.direction === "down" ? 8 : 0;
  }

  if (data.type === "player_disconnected") {
    game.running = false;
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = "Player disconnected. Game paused.";
  }

  if (data.type === "all_players_disconnected") {
    game.running = false;
    canvas.classList.add("hidden");
    document.getElementById("score")?.classList.add("hidden");
    document.getElementById("qrCode")?.classList.remove("hidden");
    document.getElementById("status")?.classList.remove("hidden");
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = "Waiting for players...";
    game.score.player1 = 0;
    game.score.player2 = 0;
    resetBall();
  }
};

function gameLoop(): void {
  if (!game.running) return;

  // Paddle movement
  game.paddle1.y += game.paddle1.dy;
  game.paddle2.y += game.paddle2.dy;

  // Paddle boundaries
  game.paddle1.y = Math.max(
    0,
    Math.min(canvas.height - game.paddle1.height, game.paddle1.y),
  );
  game.paddle2.y = Math.max(
    0,
    Math.min(canvas.height - game.paddle2.height, game.paddle2.y),
  );

  // Ball movement
  game.ball.x += game.ball.dx;
  game.ball.y += game.ball.dy;

  // Bounce off top/bottom
  if (
    game.ball.y - game.ball.radius < 0 ||
    game.ball.y + game.ball.radius > canvas.height
  ) {
    game.ball.dy *= -1;
  }

  // Paddle collision
  if (
    game.ball.x - game.ball.radius < game.paddle1.x + game.paddle1.width &&
    game.ball.y > game.paddle1.y &&
    game.ball.y < game.paddle1.y + game.paddle1.height
  ) {
    game.ball.dx = Math.abs(game.ball.dx);
    game.ball.dx *= 1.05;
  }

  if (
    game.ball.x + game.ball.radius > game.paddle2.x &&
    game.ball.y > game.paddle2.y &&
    game.ball.y < game.paddle2.y + game.paddle2.height
  ) {
    game.ball.dx = -Math.abs(game.ball.dx);
    game.ball.dx *= 1.05;
  }

  // Scoring
  if (game.ball.x < 0) {
    game.score.player2++;
    resetBall();
  }
  if (game.ball.x > canvas.width) {
    game.score.player1++;
    resetBall();
  }

  updateScore();
  draw();
  requestAnimationFrame(gameLoop);
}

function resetBall(): void {
  game.ball.x = 400;
  game.ball.y = 300;
  game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
  game.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 4;
}

function updateScore(): void {
  const score1El = document.getElementById("score1");
  const score2El = document.getElementById("score2");
  if (score1El) score1El.textContent = String(game.score.player1);
  if (score2El) score2El.textContent = String(game.score.player2);
}

function draw(): void {
  ctx.fillStyle = "#0f0f1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Center line
  ctx.strokeStyle = "#00ff88";
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Paddles
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(
    game.paddle1.x,
    game.paddle1.y,
    game.paddle1.width,
    game.paddle1.height,
  );
  ctx.fillRect(
    game.paddle2.x,
    game.paddle2.y,
    game.paddle2.width,
    game.paddle2.height,
  );

  // Ball
  ctx.beginPath();
  ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
  ctx.fill();
}
