// ---------------------------------------------------------------------------
// Game State Hook - Manages game state with React integration
// ---------------------------------------------------------------------------

import { useRef, useState, useCallback } from "react";
import {
  GameState,
  createInitialState,
  resetBall,
  randomDirection,
  BALL_INITIAL_SPEED,
} from "../gameCore";

export interface UseGameStateReturn {
  gameRef: React.MutableRefObject<GameState>;
  score: { player1: number; player2: number };
  winner: "player1" | "player2" | null;
  setScore: React.Dispatch<
    React.SetStateAction<{ player1: number; player2: number }>
  >;
  setWinner: React.Dispatch<React.SetStateAction<"player1" | "player2" | null>>;
  resetGame: () => void;
  startBall: (player?: "player1" | "player2") => void;
}

export function useGameState(): UseGameStateReturn {
  const gameRef = useRef<GameState>(createInitialState());
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [winner, setWinner] = useState<"player1" | "player2" | null>(null);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.score.player1 = 0;
    game.score.player2 = 0;
    game.winner = null;
    game.running = true;
    game.ballStarted = false;
    game.aiEnabled = false;
    setScore({ player1: 0, player2: 0 });
    setWinner(null);
    resetBall(game);
  }, []);

  const startBall = useCallback((player?: "player1" | "player2") => {
    const game = gameRef.current;
    if (game.ball.dx === 0 && game.ball.dy === 0) {
      game.ball.dx = randomDirection();
      game.ball.dy =
        player === "player1" ? -BALL_INITIAL_SPEED : BALL_INITIAL_SPEED;
    }
    game.ballStarted = true;
  }, []);

  return {
    gameRef,
    score,
    winner,
    setScore,
    setWinner,
    resetGame,
    startBall,
  };
}
