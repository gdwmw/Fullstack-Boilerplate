"use client";

import { createContext, FC, PropsWithChildren, ReactElement, useContext, useEffect, useState } from "react";

import { clientEnv } from "@/src/environments/env.client";
import { websocket } from "@/src/utils/server/websocket";

const WebsocketContext = createContext<null | WebSocket>(null);

interface I extends PropsWithChildren {
  channel: string;
}

export const WebsocketProvider: FC<I> = (props): ReactElement => {
  const [ws, setWs] = useState<null | WebSocket>(null);

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

  return <WebsocketContext.Provider value={ws}>{props.children}</WebsocketContext.Provider>;
};

export const useWebsocket = (): null | WebSocket => useContext(WebsocketContext);
