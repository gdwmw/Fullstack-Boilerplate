import { EXAMPLE_WEBSOCKET_CHANNELS } from "@repo/constants";
import { IWebsocketMessage, IWebsocketMessageMeta } from "@repo/types";
import { exampleWebsocketMessage } from "@repo/utils";
import { Context } from "elysia";

let ws: Context["server"] = null;

export const setWebsocketContext = (server: Context["server"]) => {
  ws = server;
};

// ------------------------------------------------------------------

export const websocketPublisher = {
  example: {
    A: <T>(props: { resource: "W" } & Omit<IWebsocketMessage<T>, "resource">) => {
      const channel = EXAMPLE_WEBSOCKET_CHANNELS.A(props.targetId);
      ws?.publish(channel, exampleWebsocketMessage(props));
    },
    B: <T>(props: { resource: "X" } & Omit<IWebsocketMessage<T>, "resource">) => {
      const channel = EXAMPLE_WEBSOCKET_CHANNELS.B(props.targetId);
      ws?.publish(channel, exampleWebsocketMessage(props));
    },
    C: <T>(props: { resource: "Y" | "Z" } & Omit<IWebsocketMessage<T>, "resource">) => {
      const channel = EXAMPLE_WEBSOCKET_CHANNELS.C(props.targetId);
      ws?.publish(channel, exampleWebsocketMessage(props));
    },
    receiver: <T>(
      props: { meta: { isReceiver: true; senderClientId: string | undefined } & Pick<IWebsocketMessageMeta, "optimisticId"> } & Omit<
        IWebsocketMessage<T>,
        "meta" | "targetId"
      >,
      channel: string,
    ) => {
      ws?.publish(channel, exampleWebsocketMessage(props as IWebsocketMessage<T>));
    },
  },
};
