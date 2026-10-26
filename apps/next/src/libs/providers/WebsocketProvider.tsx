"use client";

import { createContext, FC, PropsWithChildren, ReactElement, useContext, useEffect, useState } from "react";

import { clientEnv } from "@/src/environments/env.client";
import { websocket } from "@/src/utils/server/websocket";

interface IWebsocketContext {
  clientId: string;
  ws: null | WebSocket;
}

const WebsocketContext = createContext<IWebsocketContext>({ clientId: "", ws: null });

interface I extends PropsWithChildren {
  channel: string;
}

export const WebsocketProvider: FC<I> = (props): ReactElement => {
  const [ws, setWs] = useState<null | WebSocket>(null);
  const [clientId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const connection = websocket(clientEnv.NEXT_PUBLIC_BASE_API_URL, props.channel);
    const handleOpen = () => setWs(connection);
    const handleClose = () => setWs(null);

    connection.addEventListener("open", handleOpen);
    connection.addEventListener("close", handleClose);

    return () => {
      connection.removeEventListener("open", handleOpen);
      connection.removeEventListener("close", handleClose);
      connection.close();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <WebsocketContext.Provider value={{ clientId, ws }}>{props.children}</WebsocketContext.Provider>;
};

export const useWebsocket = (): IWebsocketContext => useContext(WebsocketContext);
