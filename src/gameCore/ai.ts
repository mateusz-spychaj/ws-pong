// ---------------------------------------------------------------------------
// AI Logic - Computer opponent behavior
// ---------------------------------------------------------------------------

import { GameState } from "./types";
import {
  CANVAS_HEIGHT,
  PADDLE_AI_SPEED,
  PADDLE_AI_DEAD_ZONE,
  AI_MISS_MIN,
  AI_MISS_RANGE,
} from "./constants";

export function initAI(game: GameState): void {
  game.aiMissCounter = 0;
  game.aiMissThreshold =
    Math.floor(Math.random() * AI_MISS_RANGE) + AI_MISS_MIN;
}

export function updateAI(game: GameState): void {
  game.aiMissCounter++;

  if (game.aiMissCounter >= game.aiMissThreshold) {
    game.paddle2.speed = 0;
    if (game.ball.y > CANVAS_HEIGHT / 2) {
      game.aiMissCounter = 0;
      game.aiMissThreshold =
        Math.floor(Math.random() * AI_MISS_RANGE) + AI_MISS_MIN;
    }
  } else {
    const diff = game.ball.x - (game.paddle2.x + game.paddle2.width / 2);
    game.paddle2.speed =
      Math.abs(diff) > PADDLE_AI_DEAD_ZONE
        ? diff > 0
          ? PADDLE_AI_SPEED
          : -PADDLE_AI_SPEED
        : 0;
  }

  if (!game.ballStarted && game.ball.dy > 0 && game.ball.dx !== 0) {
    game.ballStarted = true;
  }
}
