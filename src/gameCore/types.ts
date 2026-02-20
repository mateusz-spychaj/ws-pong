// ---------------------------------------------------------------------------
// Game Type Definitions
// ---------------------------------------------------------------------------

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Score {
  player1: number;
  player2: number;
}

export interface GameState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  score: Score;
  running: boolean;
  ballStarted: boolean;
  aiEnabled: boolean;
  aiMissCounter: number;
  aiMissThreshold: number;
  winner: "player1" | "player2" | null;
}
