import type { Context } from "elysia";

import { EXAMPLE_WEBSOCKET_CHANNEL } from "@repo/constants";
import { TExampleWebsocketResource, TExampleWebsocketType } from "@repo/types";
import { exampleWebsocketMessage } from "@repo/utils";

let ws: Context["server"] = null;

export const setWebsocketContext = (server: Context["server"]) => {
  ws = server;
};

// ------------------------------------------------------------------

export const exampleWebsocketPublisher = (resource: TExampleWebsocketResource, type: TExampleWebsocketType, id: string) => {
  ws?.publish(EXAMPLE_WEBSOCKET_CHANNEL, exampleWebsocketMessage(resource, type, id));
};
