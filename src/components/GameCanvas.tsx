// ---------------------------------------------------------------------------
// GameCanvas Component - Canvas wrapper with proper sizing
// ---------------------------------------------------------------------------

import { forwardRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../gameCore";

interface GameCanvasProps {
  className?: string;
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ className }, ref) => {
    return (
      <canvas
        ref={ref}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={
          className ||
          "mx-auto my-[20px] border-[3px] border-fieldline bg-[#0f0f1e] w-full max-w-[800px] h-auto"
        }
      />
    );
  },
);

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
