// ---------------------------------------------------------------------------
// Controller Page - Mobile controller with WebSocket integration
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../hooks";
import { ControllerMessage } from "../network";
import Button from "../components/Button";

const PLAYER_CONFIG = {
  player1: { name: "Red", color: "#ff4444" },
  player2: { name: "Blue", color: "#4444ff" },
};

export default function Controller() {
  const [status, setStatus] = useState("Connecting...");
  const [showControls, setShowControls] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [playerColor, setPlayerColor] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [gameEnded, setGameEnded] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight,
  );

  useEffect(() => {
    const checkOrientation = () =>
      setIsLandscape(window.innerWidth > window.innerHeight);

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const handleMessage = useCallback((data: ControllerMessage) => {
    switch (data.type) {
      case "assigned": {
        const config = PLAYER_CONFIG[data.player];
        setStatus("You are ");
        setPlayerName(config.name);
        setPlayerColor(config.color);
        if (data.player === "player1") {
          setShowModeSelection(true);
        } else {
          setShowControls(true);
        }
        break;
      }
      case "error":
        setStatus(data.message || "Error occurred ");
        break;
      case "game_ended":
        setGameEnded(true);
        break;
      case "game_restarted":
        setGameEnded(false);
        break;
      case "game_start":
        setShowControls(true);
        setStatus("You are ");
        break;
    }
  }, []);

  const { send, disconnect } = useWebSocket({
    type: "player",
    onMessage: handleMessage,
  });

  const sendMove = (direction: "left" | "right" | "stop") => {
    send({ type: "move", direction });
  };

  const handleExit = () => {
    disconnect();
    setStatus("Disconnected ");
    setShowControls(false);
    setIsDisconnected(true);
  };

  const handlePlayVsPC = () => {
    send({ type: "start_vs_ai" });
    setShowModeSelection(false);
    setShowControls(true);
  };

  const handleWaitForPlayer = () => {
    setShowModeSelection(false);
    setStatus("Waiting for second player... ");
  };

  const handlePlayAgain = () => {
    send({ type: "restart_game" });
  };

  const handleWaitForPlayers = () => {
    send({ type: "wait_for_players" });
    setGameEnded(false);
    setShowControls(false);
    setShowModeSelection(true);
  };

  const renderActionButton = (
    text: string,
    onClick: () => void,
    variant: "default" | "secondary" = "default",
    landscape = true,
  ) => (
    <Button
      onClick={onClick}
      variant={variant}
      size="lg"
      className={`${landscape ? "h-full" : "py-8"} flex-1 ${variant === "default" ? "bg-fieldline text-[#1a1a2e] hover:bg-[#00dd77]" : "bg-[#4a4a6e] text-white hover:bg-[#5a5a7e]"} ${landscape ? "active:scale-95" : ""} text-${landscape ? "4xl" : "2xl"} font-bold`}
    >
      {text}
    </Button>
  );

  return (
    <div
      className="p-4 flex h-[100dvh] select-none flex-col items-center justify-center bg-[#1a1a2e] text-fieldline"
      style={{ touchAction: "none" }}
    >
      {!isLandscape && (
        <div className="left-0 top-0 z-10 flex h-2/3 w-2/3 flex-col items-center justify-center p-4">
          <svg
            className="animate-gentle-rotate mb-4 h-16 w-16 text-fieldline"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <p className="text-center text-xl text-fieldline">
            Please rotate your device to landscape mode
          </p>
        </div>
      )}

      <div className="mb-4 text-center text-2xl text-indigo-400">
        {status}
        {playerName && <span style={{ color: playerColor }}>{playerName}</span>}
        {playerName && " Player"}
      </div>

      {showModeSelection && isLandscape && (
        <div className="flex h-1/2 w-full flex-col items-center gap-6">
          <div className="mb-2 text-center text-2xl text-white">
            Choose game mode:
          </div>
          <div className="flex h-full w-full gap-4">
            <Button
              onClick={handlePlayVsPC}
              variant="default"
              size="lg"
              className="h-full flex-1 bg-fieldline text-3xl font-bold text-[#1a1a2e] hover:bg-[#00dd77]"
            >
              Play vs PC
            </Button>
            <Button
              onClick={handleWaitForPlayer}
              variant="secondary"
              size="lg"
              className="h-full flex-1 bg-[#4a4a6e] text-3xl font-bold text-white hover:bg-[#5a5a7e]"
            >
              Wait for Player
            </Button>
          </div>
        </div>
      )}

      {showControls && isLandscape && !gameEnded && (
        <div className="flex w-full flex-grow flex-col gap-4 px-8">
          <div className="flex flex-grow gap-4">
            {["left", "right"].map((dir) => (
              <Button
                key={dir}
                onTouchStart={(e) => {
                  e.preventDefault();
                  sendMove(dir as "left" | "right");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  sendMove("stop");
                }}
                onMouseDown={() => sendMove(dir as "left" | "right")}
                onMouseUp={() => sendMove("stop")}
                variant="outline"
                size="lg"
                className="h-full flex-1 text-8xl active:scale-95"
                style={{ backgroundColor: playerColor, borderColor: playerColor }}
              >
                {dir === "left" ? "◀" : "▶"}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleExit}
            variant="destructive"
            size="lg"
            className="h-[10vh] w-full bg-[#FF0000] text-lg font-bold hover:bg-[#dd0000] active:scale-95"
          >
            EXIT
          </Button>
        </div>
      )}

      {gameEnded && (
        <div className={`${isLandscape ? "flex h-1/2 w-full flex-grow items-center justify-center" : "mt-8 flex w-full"} gap-4 px-8`}>
          {renderActionButton("Play Again", handlePlayAgain, "default", isLandscape)}
          {renderActionButton("Wait for Players", handleWaitForPlayers, "secondary", isLandscape)}
        </div>
      )}

      {isDisconnected && (
        <div className={`${isLandscape ? "flex h-1/2 w-full flex-grow items-center justify-center" : "mt-8 flex w-full"} gap-4 px-8`}>
          {renderActionButton("Play Again", () => window.location.reload(), "default", isLandscape)}
        </div>
      )}
    </div>
  );
}
