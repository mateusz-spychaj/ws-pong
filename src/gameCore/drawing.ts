// ---------------------------------------------------------------------------
// Game Drawing - Canvas rendering functions
// ---------------------------------------------------------------------------

import { GameState } from "./types";
import { COLORS } from "./constants";

export function draw(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  game: GameState,
): void {
  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Center line
  ctx.strokeStyle = COLORS.fieldLine;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Paddles
  ctx.fillStyle = COLORS.player1;
  ctx.fillRect(
    game.paddle1.x,
    game.paddle1.y,
    game.paddle1.width,
    game.paddle1.height,
  );

  ctx.fillStyle = COLORS.player2;
  ctx.fillRect(
    game.paddle2.x,
    game.paddle2.y,
    game.paddle2.width,
    game.paddle2.height,
  );

  // Ball
  ctx.fillStyle = COLORS.ball;
  ctx.beginPath();
  ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
  ctx.fill();
}
