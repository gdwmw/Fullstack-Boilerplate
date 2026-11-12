"use client";

import { createContext, FC, PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/src/environments/env.client";
import { websocket } from "@/src/utils/server/websocket";

interface IWebsocketContext {
  clientId: string;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  ws: null | WebSocket;
}

const WebsocketContext = createContext<IWebsocketContext | null>(null);

type T = Readonly<PropsWithChildren>;

export const WebsocketProvider: FC<T> = (props): ReactElement => {
  const [ws, setWs] = useState<null | WebSocket>(null);
  const [clientId] = useState(() => crypto.randomUUID());
  const connectionRef = useRef<null | WebSocket>(null);
  const subscriptionsRef = useRef(new Set<string>());

  const subscribe = useCallback((channel: string) => {
    if (subscriptionsRef.current.has(channel)) {
      return;
    }

    subscriptionsRef.current.add(channel);

    if (connectionRef.current && connectionRef.current.readyState === WebSocket.OPEN) {
      connectionRef.current.send(JSON.stringify({ action: "subscribe", channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    if (!subscriptionsRef.current.has(channel)) {
      return;
    }

    subscriptionsRef.current.delete(channel);

    if (connectionRef.current && connectionRef.current.readyState === WebSocket.OPEN) {
      connectionRef.current.send(JSON.stringify({ action: "unsubscribe", channel }));
    }
  }, []);

  useEffect(() => {
    let connection: null | WebSocket = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) {
        return;
      }

      connection = websocket(clientEnv.NEXT_PUBLIC_BASE_API_URL);

      const handleOpen = () => {
        connectionRef.current = connection;
        setWs(connection);

        if (subscriptionsRef.current.size > 0 && connection?.readyState === WebSocket.OPEN) {
          subscriptionsRef.current.forEach((channel) => {
            connection?.send(JSON.stringify({ action: "subscribe", channel }));
          });
        }
      };

      const handleClose = () => {
        connectionRef.current = null;

        if (isDisposed) {
          return;
        }

        setWs(null);

        reconnectTimeout = setTimeout(connect, 3000);
      };

      connection.addEventListener("open", handleOpen);
      connection.addEventListener("close", handleClose);
    };

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      connection?.close();

      connection = null;
      connectionRef.current = null;
    };
  }, []);

  return <WebsocketContext.Provider value={{ clientId, subscribe, unsubscribe, ws }}>{props.children}</WebsocketContext.Provider>;
};

export const useWebsocket = (): IWebsocketContext => {
  const context = useContext(WebsocketContext);

  if (!context) {
    throw new Error("useWebsocket must be used within WebsocketProvider");
  }

  return context;
};
