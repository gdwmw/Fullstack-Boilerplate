import type { Context } from "elysia";

import { EXAMPLE_WEBSOCKET_CHANNEL } from "@repo/constants";
import { IWebsocketMessage } from "@repo/types";
import { exampleWebsocketMessage } from "@repo/utils";

let ws: Context["server"] = null;

export const setWebsocketContext = (server: Context["server"]) => {
  ws = server;
};

// ------------------------------------------------------------------

export const dndWebsocketPublisher = <T>(props: IWebsocketMessage<T>) => {
  ws?.publish(EXAMPLE_WEBSOCKET_CHANNEL, exampleWebsocketMessage(props));
};
