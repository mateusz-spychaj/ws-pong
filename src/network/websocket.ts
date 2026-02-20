// ---------------------------------------------------------------------------
// WebSocket Connection Management
// ---------------------------------------------------------------------------

export const WS_RECONNECT_DELAY_MS = 2000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

export function buildWsUrl(): string {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const wsHost = import.meta.env.DEV
    ? backendUrl.replace(/^https?:\/\//, "")
    : window.location.hostname;
  return `${wsProtocol}//${wsHost}`;
}

export interface WebSocketOptions {
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (data: string) => void;
  onClose?: () => void;
  onError?: () => void;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export function createWebSocket(options: WebSocketOptions): {
  ws: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  send: (data: string) => void;
} {
  let ws: WebSocket | null = null;
  let disposed = false;
  let reconnectAttempts = 0;
  const maxAttempts = options.maxReconnectAttempts ?? WS_MAX_RECONNECT_ATTEMPTS;
  const delay = options.reconnectDelay ?? WS_RECONNECT_DELAY_MS;

  const connect = () => {
    if (disposed) return;

    ws = new WebSocket(buildWsUrl());

    ws.onopen = () => {
      reconnectAttempts = 0;
      options.onOpen?.(ws!);
    };

    ws.onmessage = (event) => {
      options.onMessage?.(event.data);
    };

    ws.onclose = () => {
      if (disposed) return;
      options.onClose?.();

      if (reconnectAttempts < maxAttempts) {
        reconnectAttempts++;
        console.log(
          `WebSocket closed. Reconnecting (${reconnectAttempts}/${maxAttempts})…`,
        );
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      options.onError?.();
      ws?.close();
    };
  };

  const disconnect = () => {
    disposed = true;
    ws?.close();
  };

  const send = (data: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  };

  return { ws, connect, disconnect, send };
}
