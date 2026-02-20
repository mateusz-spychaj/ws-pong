// ---------------------------------------------------------------------------
// VictoryModal Component - Displays winner overlay
// ---------------------------------------------------------------------------

import ScoreBoard from "./ScoreBoard";

interface VictoryModalProps {
  winner: "player1" | "player2";
  player1Score: number;
  player2Score: number;
  onPlayAgain?: () => void;
}

export default function VictoryModal({
  winner,
  player1Score,
  player2Score,
  onPlayAgain,
}: VictoryModalProps) {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-80">
      <div
        className="rounded-[20px] border-4 border-fieldline bg-[#2a2a3e] text-center shadow-2xl"
        style={{ padding: "64px" }}
      >
        <h1 className="mb-8 text-6xl font-bold text-fieldline">Victory!</h1>
        <p className="mb-4 text-4xl text-[#eeeeee]">
          Player{" "}
          <span
            className={
              winner === "player1" ? "text-[#ff4444]" : "text-[#4444ff]"
            }
          >
            {winner === "player1" ? "Red" : "Blue"}
          </span>{" "}
          wins!
        </p>
        <div className="mt-8 text-6xl font-bold">
          <ScoreBoard player1Score={player1Score} player2Score={player2Score} />
        </div>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="mt-8 rounded-lg bg-fieldline px-8 py-4 text-2xl font-bold text-[#1a1a2e] transition-colors hover:bg-[#00dd77]"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
