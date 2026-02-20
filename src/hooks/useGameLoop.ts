// ---------------------------------------------------------------------------
// Game Loop Hook - Manages the game animation loop
// ---------------------------------------------------------------------------

import { useRef, useCallback } from "react";
import {
  GameState,
  draw,
  updateAI,
  clampPaddle,
  handleWallBounce,
  handlePaddleCollision,
  handleScore,
  isBallOutOfBounds,
} from "../gameCore";

export interface UseGameLoopOptions {
  onScore?: (score: { player1: number; player2: number }) => void;
  onWinner?: (winner: "player1" | "player2") => void;
  onGameEnd?: (winner: "player1" | "player2") => void;
}

export interface UseGameLoopReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ctxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  animationRef: React.MutableRefObject<number>;
  startGameLoop: (game: GameState) => void;
  stopGameLoop: () => void;
  getCtx: () => CanvasRenderingContext2D | null;
  resetCtx: () => void;
}

export function useGameLoop(
  options: UseGameLoopOptions = {},
): UseGameLoopReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>(0);

  const getCtx = useCallback((): CanvasRenderingContext2D | null => {
    if (ctxRef.current) return ctxRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    ctxRef.current = canvas.getContext("2d");
    return ctxRef.current;
  }, []);

  const startGameLoop = useCallback(
    (game: GameState) => {
      const loop = () => {
        if (!game.running) return;

        // AI
        if (game.aiEnabled) {
          updateAI(game);
        }

        // Paddle movement
        game.paddle1.x += game.paddle1.speed;
        game.paddle2.x += game.paddle2.speed;
        clampPaddle(game.paddle1);
        clampPaddle(game.paddle2);

        // Ball physics
        if (game.ballStarted) {
          game.ball.x += game.ball.dx;
          game.ball.y += game.ball.dy;

          handleWallBounce(game.ball);
          handlePaddleCollision(game.ball, game.paddle1, true);
          handlePaddleCollision(game.ball, game.paddle2, false);

          // Scoring
          const { out, scorer } = isBallOutOfBounds(game.ball);
          if (out && scorer) {
            handleScore(game, scorer);
            options.onScore?.({ ...game.score });
          }
        }

        const ctx = getCtx();
        if (ctx && canvasRef.current) {
          draw(canvasRef.current, ctx, game);
        }

        // Check for winner
        if (game.winner) {
          options.onWinner?.(game.winner);
          options.onGameEnd?.(game.winner);
          return;
        }

        animationRef.current = requestAnimationFrame(loop);
      };

      animationRef.current = requestAnimationFrame(loop);
    },
    [options, getCtx],
  );

  const stopGameLoop = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
  }, []);

  const resetCtx = useCallback(() => {
    ctxRef.current = null;
  }, []);

  return {
    canvasRef,
    ctxRef,
    animationRef,
    startGameLoop,
    stopGameLoop,
    getCtx,
    resetCtx,
  };
}
