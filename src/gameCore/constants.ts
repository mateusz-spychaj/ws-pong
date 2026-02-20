// ---------------------------------------------------------------------------
// Game Constants
// ---------------------------------------------------------------------------

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const WINNING_SCORE = 11;

export const BALL_RADIUS = 8;
export const BALL_INITIAL_SPEED = 3;
export const BALL_ACCELERATION = 1.01;

export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 15;
export const PADDLE_Y_TOP = 20;
export const PADDLE_Y_BOTTOM = CANVAS_HEIGHT - 20 - PADDLE_HEIGHT;
export const PADDLE_PLAYER_SPEED = 8;
export const PADDLE_AI_SPEED = 6;
export const PADDLE_AI_DEAD_ZONE = 10;

export const AI_MISS_MIN = 3;
export const AI_MISS_RANGE = 3;

export const COLORS = {
  background: "#0f0f1e",
  fieldLine: "#00ff88",
  player1: "#ff4444",
  player2: "#4444ff",
  ball: "#ffffff",
} as const;
