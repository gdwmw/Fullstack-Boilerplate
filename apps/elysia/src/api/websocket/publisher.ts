import type { Context } from "elysia";

let ws: Context["server"] = null;

export const setWebsocketContext = (server: Context["server"]) => {
  ws = server;
};

// ------------------------------------------------------------------

export const exampleWebsocketPublisher = (message: string) => {
  ws?.publish("example", JSON.stringify(message));
};
