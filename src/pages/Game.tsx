// ---------------------------------------------------------------------------
// Game Page - Main game display with WebSocket integration
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameState, useGameLoop, useWebSocket } from "../hooks";
import { ServerMessage } from "../network";
import {
  resetBall,
  randomDirection,
  PADDLE_PLAYER_SPEED,
  initAI,
  CANVAS_WIDTH,
  PADDLE_WIDTH,
  GameState,
} from "../gameCore";
import GameCanvas from "../components/GameCanvas";
import QRCode from "../components/QRCode";
import ScoreBoard from "../components/ScoreBoard";
import VictoryModal from "../components/VictoryModal";

export default function Game() {
  const { gameRef, score, winner, setScore, setWinner } = useGameState();
  const { canvasRef, startGameLoop, stopGameLoop, resetCtx } = useGameLoop({
    onScore: setScore,
    onWinner: setWinner,
  });

  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState("Waiting for players...");
  const [showQr, setShowQr] = useState(true);
  const [showScore, setShowScore] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetGameState = useCallback((game: GameState) => {
    game.score.player1 = 0;
    game.score.player2 = 0;
    game.winner = null;
    game.ballStarted = false;
    game.aiMissCounter = 0;
    game.paddle1.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    game.paddle1.speed = 0;
    game.paddle2.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    game.paddle2.speed = 0;
    resetBall(game);
  }, []);

  const startGame = useCallback((game: GameState) => {
    setStatus("");
    setShowQr(false);
    setShowScore(true);
    setShowCanvas(true);
    setScore({ player1: 0, player2: 0 });
    setWinner(null);
    stopGameLoop();
    resetCtx();
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = setTimeout(() => startGameLoop(game), 100);
  }, [setScore, setWinner, stopGameLoop, resetCtx, startGameLoop]);

  const resetToWaiting = useCallback(() => {
    const game = gameRef.current;
    game.running = false;
    game.ballStarted = false;
    game.aiEnabled = false;
    game.winner = null;
    game.score.player1 = 0;
    game.score.player2 = 0;

    stopGameLoop();
    setShowCanvas(false);
    setShowScore(false);
    setShowQr(true);
    setWinner(null);
    setStatus("Waiting for players...");
    setScore({ player1: 0, player2: 0 });
    resetBall(game);
  }, [gameRef, stopGameLoop, setScore, setWinner]);

  const handleMessage = useCallback(
    (data: ServerMessage) => {
      const game = gameRef.current;

      switch (data.type) {
        case "qr_code":
          setQrCode(data.qrCode);
          break;

        case "hide_qr":
          setShowQr(false);
          break;

        case "player1_connected":
          setStatus("Player 1 connected. Waiting for player 2...");
          break;

        case "start_game": {
          const wasAiEnabled = game.aiEnabled;
          resetGameState(game);
          game.running = true;
          game.aiEnabled = wasAiEnabled;
          if (wasAiEnabled) initAI(game);
          startGame(game);
          break;
        }

        case "enable_ai":
          game.aiEnabled = true;
          initAI(game);
          break;

        case "player_move": {
          const paddle =
            data.player === "player1" ? game.paddle1 : game.paddle2;
          paddle.speed =
            data.direction === "left"
              ? -PADDLE_PLAYER_SPEED
              : data.direction === "right"
                ? PADDLE_PLAYER_SPEED
                : 0;

          if (!game.ballStarted && data.direction !== "stop") {
            const shouldStart =
              (data.player === "player2" && game.ball.dy < 0) ||
              (data.player === "player1" && game.ball.dy > 0) ||
              (game.ball.dx === 0 && game.ball.dy === 0);

            if (shouldStart) {
              if (game.ball.dx === 0 && game.ball.dy === 0) {
                game.ball.dx = randomDirection();
                game.ball.dy = randomDirection();
              }
              game.ballStarted = true;
            }
          }
          break;
        }

        case "player_disconnected":
        case "all_players_disconnected":
          resetToWaiting();
          break;

        case "restart_game": {
          resetGameState(game);
          game.running = true;
          game.aiEnabled = data.aiMode ?? false;
          if (game.aiEnabled) initAI(game);
          setScore({ player1: 0, player2: 0 });
          setWinner(null);
          stopGameLoop();
          resetCtx();
          setShowCanvas(true);
          setShowScore(true);
          startGameLoop(game);
          break;
        }

        case "show_qr":
          resetToWaiting();
          break;
      }
    },
    [
      gameRef,
      resetGameState,
      startGame,
      resetToWaiting,
      setScore,
      setWinner,
      stopGameLoop,
      resetCtx,
      startGameLoop,
    ],
  );

  const { send } = useWebSocket({
    type: "screen",
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (winner) {
      send({ type: "game_ended", winner });
    }
  }, [winner, send]);

  useEffect(() => {
    return () => {
      stopGameLoop();
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    };
  }, [stopGameLoop]);

  return (
    <div className="p-4 flex min-h-screen flex-col items-center justify-center bg-[#1a1a2e] font-['Courier_New',monospace] text-white">
      <div className="flex flex-col items-center text-center">
        {!showCanvas && (
          <h1 className="mb-[20px] text-fieldline" style={{ fontSize: "48px" }}>
            🏓 WS Pong
          </h1>
        )}

        {showQr && <QRCode qrCode={qrCode} />}

        {status && (
          <div className="my-[20px] text-2xl text-fieldline">{status}</div>
        )}

        {showScore && (
          <ScoreBoard
            player1Score={score.player1}
            player2Score={0}
            showPlayer2={false}
          />
        )}

        {showCanvas && <GameCanvas ref={canvasRef} />}

        {showScore && (
          <ScoreBoard
            player1Score={0}
            player2Score={score.player2}
            showPlayer1={false}
          />
        )}

        {winner && (
          <VictoryModal
            winner={winner}
            player1Score={score.player1}
            player2Score={score.player2}
          />
        )}
      </div>
    </div>
  );
}
