// ---------------------------------------------------------------------------
// Game Logic - Pure functions for state management
// ---------------------------------------------------------------------------

import { Ball, GameState, Paddle } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  BALL_INITIAL_SPEED,
  BALL_ACCELERATION,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_TOP,
  PADDLE_Y_BOTTOM,
  WINNING_SCORE,
} from "./constants";

// ---------------------------------------------------------------------------
// State Creation
// ---------------------------------------------------------------------------

export function createInitialState(): GameState {
  return {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: BALL_INITIAL_SPEED,
      dy: BALL_INITIAL_SPEED,
      radius: BALL_RADIUS,
    },
    paddle1: {
      x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      y: PADDLE_Y_TOP,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    paddle2: {
      x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      y: PADDLE_Y_BOTTOM,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    score: { player1: 0, player2: 0 },
    running: false,
    ballStarted: false,
    aiEnabled: false,
    aiMissCounter: 0,
    aiMissThreshold: 0,
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Ball Management
// ---------------------------------------------------------------------------

/** Stop the ball and center it. Does NOT set dx/dy to a launch direction. */
export function resetBall(game: GameState): void {
  game.ball.x = CANVAS_WIDTH / 2;
  game.ball.y = CANVAS_HEIGHT / 2;
  game.ball.dx = 0;
  game.ball.dy = 0;
  game.ballStarted = false;
}

export function randomDirection(): number {
  return (Math.random() > 0.5 ? 1 : -1) * BALL_INITIAL_SPEED;
}

// ---------------------------------------------------------------------------
// Paddle Management
// ---------------------------------------------------------------------------

export function clampPaddle(paddle: Paddle): void {
  paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));
}

// ---------------------------------------------------------------------------
// Collision Detection
// ---------------------------------------------------------------------------

export function handleWallBounce(ball: Ball): void {
  const leftEdge = ball.x - ball.radius;
  const rightEdge = ball.x + ball.radius;

  if (leftEdge < 0) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
  } else if (rightEdge > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius;
    ball.dx = -Math.abs(ball.dx);
  }
}

export function handlePaddleCollision(
  ball: Ball,
  paddle: Paddle,
  deflectDown: boolean,
): void {
  const withinPaddleX = ball.x > paddle.x && ball.x < paddle.x + paddle.width;
  if (!withinPaddleX) return;

  const hitTopPaddle =
    !deflectDown &&
    ball.y + ball.radius > paddle.y &&
    ball.y < paddle.y + paddle.height &&
    ball.dy > 0;

  const hitBottomPaddle =
    deflectDown &&
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.y > paddle.y &&
    ball.dy < 0;

  if (hitTopPaddle) {
    ball.y = paddle.y - ball.radius;
    ball.dy = -Math.abs(ball.dy) * BALL_ACCELERATION;
    ball.dx *= BALL_ACCELERATION;
  } else if (hitBottomPaddle) {
    ball.y = paddle.y + paddle.height + ball.radius;
    ball.dy = Math.abs(ball.dy) * BALL_ACCELERATION;
    ball.dx *= BALL_ACCELERATION;
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function handleScore(
  game: GameState,
  scorer: "player1" | "player2",
): void {
  game.score[scorer]++;

  if (game.score[scorer] >= WINNING_SCORE) {
    game.winner = scorer;
    game.running = false;
  } else {
    resetBall(game);
    game.ball.dx = randomDirection();
    game.ball.dy =
      scorer === "player1" ? -BALL_INITIAL_SPEED : BALL_INITIAL_SPEED;
  }
}

// ---------------------------------------------------------------------------
// Ball Bounds Check
// ---------------------------------------------------------------------------

export function isBallOutOfBounds(ball: Ball): {
  out: boolean;
  scorer: "player1" | "player2" | null;
} {
  if (ball.y < 0) {
    return { out: true, scorer: "player2" };
  }
  if (ball.y > CANVAS_HEIGHT) {
    return { out: true, scorer: "player1" };
  }
  return { out: false, scorer: null };
}
