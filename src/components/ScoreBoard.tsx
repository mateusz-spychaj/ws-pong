// ---------------------------------------------------------------------------
// ScoreBoard Component - Displays player scores
// ---------------------------------------------------------------------------

interface ScoreBoardProps {
  player1Score: number;
  player2Score: number;
  showPlayer1?: boolean;
  showPlayer2?: boolean;
  className?: string;
}

export default function ScoreBoard({
  player1Score,
  player2Score,
  showPlayer1 = true,
  showPlayer2 = true,
  className,
}: ScoreBoardProps) {
  return (
    <div className={className || "my-[10px] text-[32px]"}>
      {showPlayer1 && (
        <span className="font-bold text-[#ff4444]">{player1Score}</span>
      )}
      {showPlayer1 && showPlayer2 && <span className="mx-4 text-white">-</span>}
      {showPlayer2 && (
        <span className="font-bold text-[#4444ff]">{player2Score}</span>
      )}
    </div>
  );
}
