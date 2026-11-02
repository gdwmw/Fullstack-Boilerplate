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
  let channel: string;

  switch (props.resource) {
    case "W":
      channel = EXAMPLE_WEBSOCKET_CHANNEL.A(props.id);
      break;
    case "X":
      channel = EXAMPLE_WEBSOCKET_CHANNEL.B(props.id);
      break;
    case "Y":
    case "Z":
      channel = EXAMPLE_WEBSOCKET_CHANNEL.C(props.id);
      break;
  }

  ws?.publish(channel, exampleWebsocketMessage(props));
};
