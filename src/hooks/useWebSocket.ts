// ---------------------------------------------------------------------------
// WebSocket Hook - React integration for WebSocket connections
// ---------------------------------------------------------------------------

import { useEffect, useRef, useCallback } from "react";
import {
  parseServerMessage,
  parseControllerMessage,
  ServerMessage,
  ControllerMessage,
  ClientMessage,
  createMessage,
} from "../network";

export interface UseScreenWebSocketOptions {
  type: "screen";
  onMessage?: (data: ServerMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: () => void;
}

export interface UsePlayerWebSocketOptions {
  type: "player";
  onMessage?: (data: ControllerMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: () => void;
}

export type UseWebSocketOptions =
  | UseScreenWebSocketOptions
  | UsePlayerWebSocketOptions;

export interface UseWebSocketReturn {
  send: (message: ClientMessage) => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  // Store callbacks in refs to avoid reconnection on callback changes
  const onMessageRef = useRef(options.onMessage);
  const onConnectRef = useRef(options.onConnect);
  const onDisconnectRef = useRef(options.onDisconnect);
  const onErrorRef = useRef(options.onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = options.onMessage;
    onConnectRef.current = options.onConnect;
    onDisconnectRef.current = options.onDisconnect;
    onErrorRef.current = options.onError;
  });

  const parseMessage =
    options.type === "screen" ? parseServerMessage : parseControllerMessage;

  useEffect(() => {
    let disposed = false;

    const buildWsUrl = () => {
      // In development, use VITE_BACKEND_URL from .env if available
      if (import.meta.env.DEV && import.meta.env.VITE_BACKEND_URL) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
        // Convert http/https to ws/wss
        return backendUrl.replace(/^http/, "ws");
      }

      // Fallback: use current host (production or when VITE_BACKEND_URL not set)
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${window.location.host}`;
    };

    const connect = () => {
      if (disposed) return;

      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (options.type === "screen") {
          ws.send(
            createMessage({
              type: "register_screen",
              origin: window.location.origin,
            }),
          );
        } else {
          ws.send(createMessage({ type: "register_player" }));
        }
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        const data = parseMessage(event.data);
        if (data) {
          (
            onMessageRef.current as
              | ((data: ServerMessage | ControllerMessage) => void)
              | undefined
          )?.(data);
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        onDisconnectRef.current?.();
      };

      ws.onerror = () => {
        onErrorRef.current?.();
        ws.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      wsRef.current?.close();
    };
  }, [options.type, parseMessage]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(createMessage(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  return { send, disconnect, isConnected };
}
