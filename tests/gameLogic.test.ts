// ---------------------------------------------------------------------------
// Game Logic Tests
// ---------------------------------------------------------------------------

import { test } from "node:test";
import assert from "node:assert";
import {
  createInitialState,
  resetBall,
  randomDirection,
  clampPaddle,
  handleWallBounce,
  handlePaddleCollision,
  handleScore,
  isBallOutOfBounds,
} from "../src/gameCore/logic";
import { GameState, Ball, Paddle } from "../src/gameCore/types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  BALL_INITIAL_SPEED,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_TOP,
  PADDLE_Y_BOTTOM,
  WINNING_SCORE,
} from "../src/gameCore/constants";

test("createInitialState returns correct initial game state", () => {
  const game = createInitialState();

  // Ball should be centered
  assert.strictEqual(
    game.ball.x,
    CANVAS_WIDTH / 2,
    "Ball x should be centered",
  );
  assert.strictEqual(
    game.ball.y,
    CANVAS_HEIGHT / 2,
    "Ball y should be centered",
  );
  assert.strictEqual(
    game.ball.dx,
    BALL_INITIAL_SPEED,
    "Ball dx should be initial speed",
  );
  assert.strictEqual(
    game.ball.dy,
    BALL_INITIAL_SPEED,
    "Ball dy should be initial speed",
  );
  assert.strictEqual(
    game.ball.radius,
    BALL_RADIUS,
    "Ball radius should be correct",
  );

  // Paddle1 should be at top
  assert.strictEqual(
    game.paddle1.x,
    (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    "Paddle1 x should be centered",
  );
  assert.strictEqual(
    game.paddle1.y,
    PADDLE_Y_TOP,
    "Paddle1 y should be at top",
  );
  assert.strictEqual(
    game.paddle1.width,
    PADDLE_WIDTH,
    "Paddle1 width should be correct",
  );
  assert.strictEqual(
    game.paddle1.height,
    PADDLE_HEIGHT,
    "Paddle1 height should be correct",
  );
  assert.strictEqual(game.paddle1.speed, 0, "Paddle1 speed should be 0");

  // Paddle2 should be at bottom
  assert.strictEqual(
    game.paddle2.x,
    (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    "Paddle2 x should be centered",
  );
  assert.strictEqual(
    game.paddle2.y,
    PADDLE_Y_BOTTOM,
    "Paddle2 y should be at bottom",
  );
  assert.strictEqual(
    game.paddle2.width,
    PADDLE_WIDTH,
    "Paddle2 width should be correct",
  );
  assert.strictEqual(
    game.paddle2.height,
    PADDLE_HEIGHT,
    "Paddle2 height should be correct",
  );
  assert.strictEqual(game.paddle2.speed, 0, "Paddle2 speed should be 0");

  // Game state
  assert.deepStrictEqual(
    game.score,
    { player1: 0, player2: 0 },
    "Initial score should be 0-0",
  );
  assert.strictEqual(
    game.running,
    false,
    "Game should not be running initially",
  );
  assert.strictEqual(game.ballStarted, false, "Ball should not be started");
  assert.strictEqual(game.aiEnabled, false, "AI should not be enabled");
  assert.strictEqual(game.winner, null, "No winner initially");
});

test("resetBall centers ball and stops it", () => {
  const game = createInitialState();

  // Move ball away from center
  game.ball.x = 100;
  game.ball.y = 200;
  game.ball.dx = 5;
  game.ball.dy = -5;
  game.ballStarted = true;

  resetBall(game);

  assert.strictEqual(
    game.ball.x,
    CANVAS_WIDTH / 2,
    "Ball x should be centered",
  );
  assert.strictEqual(
    game.ball.y,
    CANVAS_HEIGHT / 2,
    "Ball y should be centered",
  );
  assert.strictEqual(game.ball.dx, 0, "Ball dx should be 0");
  assert.strictEqual(game.ball.dy, 0, "Ball dy should be 0");
  assert.strictEqual(game.ballStarted, false, "Ball should not be started");
});

test("randomDirection returns valid direction", () => {
  // Run multiple times to check randomness
  const directions: number[] = [];
  for (let i = 0; i < 100; i++) {
    directions.push(randomDirection());
  }

  // All directions should be either +BALL_INITIAL_SPEED or -BALL_INITIAL_SPEED
  directions.forEach((dir) => {
    assert.ok(
      dir === BALL_INITIAL_SPEED || dir === -BALL_INITIAL_SPEED,
      `Direction ${dir} should be either ${BALL_INITIAL_SPEED} or ${-BALL_INITIAL_SPEED}`,
    );
  });

  // Should have both positive and negative directions (with high probability)
  const hasPositive = directions.some((d) => d > 0);
  const hasNegative = directions.some((d) => d < 0);
  assert.ok(hasPositive, "Should have at least one positive direction");
  assert.ok(hasNegative, "Should have at least one negative direction");
});

test("clampPaddle keeps paddle within bounds", () => {
  const paddle: Paddle = {
    x: 0,
    y: PADDLE_Y_TOP,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0,
  };

  // Test left boundary
  paddle.x = -50;
  clampPaddle(paddle);
  assert.strictEqual(paddle.x, 0, "Paddle should not go below 0");

  // Test right boundary
  paddle.x = CANVAS_WIDTH + 50;
  clampPaddle(paddle);
  assert.strictEqual(
    paddle.x,
    CANVAS_WIDTH - PADDLE_WIDTH,
    "Paddle should not go beyond canvas width",
  );

  // Test valid position
  paddle.x = 100;
  clampPaddle(paddle);
  assert.strictEqual(paddle.x, 100, "Valid position should be unchanged");
});

test("handleWallBounce bounces off left wall", () => {
  const ball: Ball = {
    x: BALL_RADIUS / 2, // At left edge
    y: CANVAS_HEIGHT / 2,
    dx: -3,
    dy: 2,
    radius: BALL_RADIUS,
  };

  handleWallBounce(ball);

  assert.strictEqual(ball.x, BALL_RADIUS, "Ball should be at left edge");
  assert.strictEqual(ball.dx, 3, "Ball dx should be positive (bounce right)");
});

test("handleWallBounce bounces off right wall", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH - BALL_RADIUS / 2, // At right edge
    y: CANVAS_HEIGHT / 2,
    dx: 3,
    dy: 2,
    radius: BALL_RADIUS,
  };

  handleWallBounce(ball);

  assert.strictEqual(
    ball.x,
    CANVAS_WIDTH - BALL_RADIUS,
    "Ball should be at right edge",
  );
  assert.strictEqual(ball.dx, -3, "Ball dx should be negative (bounce left)");
});

test("handleWallBounce does not affect vertical movement", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 3,
    dy: 2,
    radius: BALL_RADIUS,
  };

  handleWallBounce(ball);

  assert.strictEqual(ball.dy, 2, "Ball dy should be unchanged");
});

test("handlePaddleCollision deflects ball down from top paddle", () => {
  const paddle: Paddle = {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: PADDLE_Y_TOP,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0,
  };

  // For deflectDown=true: ball needs to be moving UP (dy < 0) and within paddle Y range
  // Paddle spans y=20 to y=35 (20 + 15)
  // Condition: ball.y + radius > 20 AND ball.y < 35 AND dy < 0
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: 25, // Between 20 and 35, moving UP
    dx: 3,
    dy: -3, // Moving up
    radius: BALL_RADIUS,
  };

  // In game, paddle1 (top) uses deflectDown = true
  // Ball must be moving UP (dy < 0) to hit it, then bounces DOWN
  handlePaddleCollision(ball, paddle, true);

  assert.ok(ball.dy > 0, "Ball should be moving down after collision");
});

test("handlePaddleCollision deflects ball up from bottom paddle", () => {
  const paddle: Paddle = {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: PADDLE_Y_BOTTOM,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0,
  };

  // For deflectDown=false: ball needs to be moving DOWN (dy > 0) and within paddle Y range
  // Paddle spans y=565 to y=580 (565 + 15)
  // Condition: ball.y - radius < 580 AND ball.y > 565 AND dy > 0
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: 570, // Between 565 and 580, moving DOWN
    dx: 3,
    dy: 3, // Moving down
    radius: BALL_RADIUS,
  };

  // In game, paddle2 (bottom) uses deflectDown = false
  // Ball must be moving DOWN (dy > 0) to hit it, then bounces UP
  handlePaddleCollision(ball, paddle, false);

  assert.ok(ball.dy < 0, "Ball should be moving up after collision");
});

test("handlePaddleCollision does not affect ball not touching paddle", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2, // Far from paddle
    dx: 3,
    dy: -3,
    radius: BALL_RADIUS,
  };

  const paddle: Paddle = {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: PADDLE_Y_TOP,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0,
  };

  const originalDx = ball.dx;
  const originalDy = ball.dy;

  handlePaddleCollision(ball, paddle, false);

  assert.strictEqual(ball.dx, originalDx, "Ball dx should be unchanged");
  assert.strictEqual(ball.dy, originalDy, "Ball dy should be unchanged");
});

test("isBallOutOfBounds returns true when ball goes above canvas", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: -10, // Above canvas
    dx: 3,
    dy: -3,
    radius: BALL_RADIUS,
  };

  const result = isBallOutOfBounds(ball);

  assert.strictEqual(result.out, true, "Ball should be out of bounds");
  assert.strictEqual(result.scorer, "player2", "Player 2 should score");
});

test("isBallOutOfBounds returns true when ball goes below canvas", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT + 10, // Below canvas
    dx: 3,
    dy: 3,
    radius: BALL_RADIUS,
  };

  const result = isBallOutOfBounds(ball);

  assert.strictEqual(result.out, true, "Ball should be out of bounds");
  assert.strictEqual(result.scorer, "player1", "Player 1 should score");
});

test("isBallOutOfBounds returns false when ball is in bounds", () => {
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2, // In bounds
    dx: 3,
    dy: 3,
    radius: BALL_RADIUS,
  };

  const result = isBallOutOfBounds(ball);

  assert.strictEqual(result.out, false, "Ball should be in bounds");
  assert.strictEqual(result.scorer, null, "No scorer");
});

test("handleScore increments player1 score and sets winner when reaching winning score", () => {
  // WINNING_SCORE is 11, so we need score of 10 to test winning
  const game: GameState = {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT + 10,
      dx: 3,
      dy: 3,
      radius: BALL_RADIUS,
    },
    paddle1: {
      x: 0,
      y: PADDLE_Y_TOP,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    paddle2: {
      x: 0,
      y: PADDLE_Y_BOTTOM,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    score: { player1: WINNING_SCORE - 1, player2: 0 }, // Player 1 has 10 points
    running: true,
    ballStarted: true,
    aiEnabled: false,
    aiMissCounter: 0,
    aiMissThreshold: 0,
    winner: null,
  };

  handleScore(game, "player1");

  assert.strictEqual(
    game.score.player1,
    WINNING_SCORE,
    "Player 1 score should be winning score",
  );
  assert.strictEqual(game.winner, "player1", "Player 1 should win");
  assert.strictEqual(game.running, false, "Game should stop running");
});

test("handleScore sets winner when winning score is reached", () => {
  const game: GameState = {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT + 10,
      dx: 3,
      dy: 3,
      radius: BALL_RADIUS,
    },
    paddle1: {
      x: 0,
      y: PADDLE_Y_TOP,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    paddle2: {
      x: 0,
      y: PADDLE_Y_BOTTOM,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    score: { player1: WINNING_SCORE - 1, player2: 0 },
    running: true,
    ballStarted: true,
    aiEnabled: false,
    aiMissCounter: 0,
    aiMissThreshold: 0,
    winner: null,
  };

  handleScore(game, "player1");

  assert.strictEqual(
    game.score.player1,
    WINNING_SCORE,
    "Player 1 score should be winning score",
  );
  assert.strictEqual(game.winner, "player1", "Player 1 should be winner");
  assert.strictEqual(game.running, false, "Game should stop running");
});

test("handleScore sets winner and stops game for player2", () => {
  const game: GameState = {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT + 10,
      dx: 3,
      dy: 3,
      radius: BALL_RADIUS,
    },
    paddle1: {
      x: 0,
      y: PADDLE_Y_TOP,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    paddle2: {
      x: 0,
      y: PADDLE_Y_BOTTOM,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0,
    },
    score: { player1: 0, player2: WINNING_SCORE - 1 }, // Player 2 has 10 points
    running: true,
    ballStarted: true,
    aiEnabled: false,
    aiMissCounter: 0,
    aiMissThreshold: 0,
    winner: null,
  };

  handleScore(game, "player2");

  assert.strictEqual(
    game.score.player2,
    WINNING_SCORE,
    "Player 2 score should be winning score",
  );
  assert.strictEqual(game.winner, "player2", "Player 2 should win");
  assert.strictEqual(game.running, false, "Game should stop running");
});
