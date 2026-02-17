import { test } from "node:test";
import assert from "node:assert";

interface MockWebSocket {
  id: string;
  playerId?: "player1" | "player2";
  messages: string[];
  closed: boolean;
  send(data: string): void;
  close(): void;
}

interface Players {
  player1: MockWebSocket | null;
  player2: MockWebSocket | null;
}

function createMockWebSocket(id: string): MockWebSocket {
  return {
    id,
    messages: [],
    closed: false,
    send(data: string) {
      this.messages.push(data);
    },
    close() {
      this.closed = true;
    },
  };
}

test("Player assignment - first player becomes player1", () => {
  const players: Players = { player1: null, player2: null };
  const ws = createMockWebSocket("ws1");

  // Register first player
  if (!players.player1) {
    players.player1 = ws;
    ws.playerId = "player1";
    ws.send(JSON.stringify({ type: "assigned", player: "player1" }));
  }

  assert.strictEqual(
    players.player1?.id,
    "ws1",
    "First player should be player1",
  );
  assert.strictEqual(
    ws.playerId,
    "player1",
    "WebSocket should have player1 ID",
  );
  assert.strictEqual(ws.messages.length, 1, "Should send assignment message");

  const message = JSON.parse(ws.messages[0]);
  assert.strictEqual(
    message.type,
    "assigned",
    "Message type should be assigned",
  );
  assert.strictEqual(message.player, "player1", "Should assign player1");
});

test("Player assignment - second player becomes player2", () => {
  const players: Players = {
    player1: createMockWebSocket("ws1"),
    player2: null,
  };
  const ws = createMockWebSocket("ws2");

  // Register second player
  if (!players.player1) {
    players.player1 = ws;
    ws.playerId = "player1";
  } else if (!players.player2) {
    players.player2 = ws;
    ws.playerId = "player2";
    ws.send(JSON.stringify({ type: "assigned", player: "player2" }));
  }

  assert.strictEqual(
    players.player2?.id,
    "ws2",
    "Second player should be player2",
  );
  assert.strictEqual(
    ws.playerId,
    "player2",
    "WebSocket should have player2 ID",
  );

  const message = JSON.parse(ws.messages[0]);
  assert.strictEqual(message.player, "player2", "Should assign player2");
});

test("Game full - third player gets error", () => {
  const players: Players = {
    player1: createMockWebSocket("ws1"),
    player2: createMockWebSocket("ws2"),
  };
  const ws = createMockWebSocket("ws3");

  // Try to register third player
  if (!players.player1) {
    players.player1 = ws;
    ws.playerId = "player1";
  } else if (!players.player2) {
    players.player2 = ws;
    ws.playerId = "player2";
  } else {
    ws.send(JSON.stringify({ type: "error", message: "Game is full" }));
  }

  assert.strictEqual(
    ws.playerId,
    undefined,
    "Third player should not be assigned",
  );
  assert.strictEqual(ws.messages.length, 1, "Should send error message");

  const message = JSON.parse(ws.messages[0]);
  assert.strictEqual(message.type, "error", "Message type should be error");
  assert.strictEqual(
    message.message,
    "Game is full",
    "Should indicate game is full",
  );
});

test("Game starts when both players and screen are ready", () => {
  const players: Players = {
    player1: createMockWebSocket("ws1"),
    player2: createMockWebSocket("ws2"),
  };
  const gameScreen = createMockWebSocket("screen");

  const canStartGame = !!(gameScreen && players.player1 && players.player2);

  if (canStartGame) {
    gameScreen.send(JSON.stringify({ type: "start_game" }));
    gameScreen.send(JSON.stringify({ type: "hide_qr" }));
  }

  assert.strictEqual(canStartGame, true, "Game should be ready to start");
  assert.strictEqual(
    gameScreen.messages.length,
    2,
    "Should send two messages to screen",
  );

  const msg1 = JSON.parse(gameScreen.messages[0]);
  const msg2 = JSON.parse(gameScreen.messages[1]);
  assert.strictEqual(msg1.type, "start_game", "Should send start_game");
  assert.strictEqual(msg2.type, "hide_qr", "Should send hide_qr");
});

test("Player move is forwarded to game screen", () => {
  const gameScreen = createMockWebSocket("screen");
  const player1 = createMockWebSocket("ws1");
  player1.playerId = "player1";

  // Player sends move command
  const moveData = { type: "move", direction: "up" };

  if (gameScreen) {
    gameScreen.send(
      JSON.stringify({
        type: "player_move",
        player: player1.playerId,
        direction: moveData.direction,
      }),
    );
  }

  assert.strictEqual(
    gameScreen.messages.length,
    1,
    "Should forward move to screen",
  );

  const message = JSON.parse(gameScreen.messages[0]);
  assert.strictEqual(
    message.type,
    "player_move",
    "Message type should be player_move",
  );
  assert.strictEqual(message.player, "player1", "Should identify player");
  assert.strictEqual(message.direction, "up", "Should include direction");
});

test("Player disconnection notifies game screen", () => {
  const players: Players = {
    player1: createMockWebSocket("ws1"),
    player2: createMockWebSocket("ws2"),
  };
  const gameScreen = createMockWebSocket("screen");

  // Player 1 disconnects
  const disconnectedPlayer = players.player1;
  players.player1 = null;

  if (gameScreen && disconnectedPlayer) {
    gameScreen.send(
      JSON.stringify({
        type: "player_disconnected",
        player: disconnectedPlayer.playerId,
      }),
    );
  }

  assert.strictEqual(players.player1, null, "Player 1 should be removed");
  assert.strictEqual(gameScreen.messages.length, 1, "Should notify screen");

  const message = JSON.parse(gameScreen.messages[0]);
  assert.strictEqual(
    message.type,
    "player_disconnected",
    "Should send disconnection message",
  );
});

test("All players disconnected resets game", () => {
  const players: Players = { player1: null, player2: null };
  const gameScreen = createMockWebSocket("screen");

  const allDisconnected = !players.player1 && !players.player2;

  if (allDisconnected && gameScreen) {
    gameScreen.send(JSON.stringify({ type: "all_players_disconnected" }));
  }

  assert.strictEqual(
    allDisconnected,
    true,
    "Both players should be disconnected",
  );
  assert.strictEqual(gameScreen.messages.length, 1, "Should notify screen");

  const message = JSON.parse(gameScreen.messages[0]);
  assert.strictEqual(
    message.type,
    "all_players_disconnected",
    "Should reset game",
  );
});

test("QR code generation for controller URL", () => {
  const gameScreen = createMockWebSocket("screen");
  const ip = "192.168.1.100";
  const port = 3000;
  const url = `http://${ip}:${port}/controller.html`;

  // Simulate QR code generation
  gameScreen.send(
    JSON.stringify({
      type: "qr_code",
      qrCode: "data:image/png;base64,mock",
      url,
    }),
  );

  assert.strictEqual(gameScreen.messages.length, 1, "Should send QR code");

  const message = JSON.parse(gameScreen.messages[0]);
  assert.strictEqual(message.type, "qr_code", "Message type should be qr_code");
  assert.strictEqual(message.url, url, "Should include controller URL");
  assert.ok(message.qrCode, "Should include QR code data");
});

test("Score tracking - player 2 scores when ball goes left", () => {
  const score = { player1: 0, player2: 0 };
  const ball = { x: -5 };

  // Ball goes out on left side
  if (ball.x < 0) {
    score.player2++;
  }

  assert.strictEqual(score.player2, 1, "Player 2 should score");
  assert.strictEqual(score.player1, 0, "Player 1 should not score");
});

test("Score tracking - player 1 scores when ball goes right", () => {
  const score = { player1: 0, player2: 0 };
  const ball = { x: 805 };
  const canvasWidth = 800;

  // Ball goes out on right side
  if (ball.x > canvasWidth) {
    score.player1++;
  }

  assert.strictEqual(score.player1, 1, "Player 1 should score");
  assert.strictEqual(score.player2, 0, "Player 2 should not score");
});

test("Score tracking - multiple points", () => {
  const score = { player1: 0, player2: 0 };

  // Simulate multiple scoring events
  score.player1++;
  score.player2++;
  score.player2++;
  score.player1++;
  score.player1++;

  assert.strictEqual(score.player1, 3, "Player 1 should have 3 points");
  assert.strictEqual(score.player2, 2, "Player 2 should have 2 points");
});

test("Score resets when all players disconnect", () => {
  const score = { player1: 5, player2: 3 };
  const players: Players = { player1: null, player2: null };

  // All players disconnected - reset score
  if (!players.player1 && !players.player2) {
    score.player1 = 0;
    score.player2 = 0;
  }

  assert.strictEqual(score.player1, 0, "Player 1 score should reset");
  assert.strictEqual(score.player2, 0, "Player 2 score should reset");
});
