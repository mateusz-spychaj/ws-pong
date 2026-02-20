// ---------------------------------------------------------------------------
// Network Message Parsing
// ---------------------------------------------------------------------------

import { ServerMessage, ControllerMessage } from "./types";

/** Safely parse a JSON WebSocket message, returning null on failure. */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    return JSON.parse(raw) as ServerMessage;
  } catch {
    console.warn("Failed to parse WebSocket message:", raw);
    return null;
  }
}

/** Safely parse a JSON WebSocket message for controller, returning null on failure. */
export function parseControllerMessage(raw: string): ControllerMessage | null {
  try {
    return JSON.parse(raw) as ControllerMessage;
  } catch {
    console.warn("Failed to parse controller WebSocket message:", raw);
    return null;
  }
}

/** Create a JSON string from a message object */
export function createMessage<T>(message: T): string {
  return JSON.stringify(message);
}
