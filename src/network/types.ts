// ---------------------------------------------------------------------------
// Network Type Definitions
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: "qr_code"; qrCode: string }
  | { type: "hide_qr" }
  | { type: "start_game" }
  | { type: "enable_ai" }
  | {
      type: "player_move";
      player: "player1" | "player2";
      direction: "left" | "right" | "stop";
    }
  | { type: "player_disconnected" }
  | { type: "all_players_disconnected" }
  | { type: "restart_game"; aiMode?: boolean }
  | { type: "game_ended"; winner: "player1" | "player2" }
  | { type: "show_qr" }
  | { type: "player1_connected" };

export type ClientMessage =
  | { type: "register_screen"; origin: string }
  | { type: "register_player" }
  | { type: "move"; direction: "left" | "right" | "stop" }
  | { type: "start_vs_ai" }
  | { type: "restart_game" }
  | { type: "game_ended"; winner: "player1" | "player2" }
  | { type: "wait_for_players" };

export type PlayerAssignment = {
  player: "player1" | "player2";
};

export type ControllerMessage =
  | { type: "assigned"; player: "player1" | "player2" }
  | { type: "error"; message: string }
  | { type: "game_ended"; winner: "player1" | "player2" }
  | { type: "game_restarted" }
  | { type: "game_start" };
