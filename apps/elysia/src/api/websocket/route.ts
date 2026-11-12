import { Elysia } from "elysia";

import { logger } from "@/src/libs/pino";

export const websocketRoutes = new Elysia().ws("/websocket", {
  close() {
    logger.info("websocket disconnected");
  },

  message(ws, message) {
    const { action, channel } = message as { action: "subscribe" | "unsubscribe"; channel: string };

    if (action === "subscribe") {
      ws.subscribe(channel);
      logger.info({ channel }, "websocket subscribe");
    } else if (action === "unsubscribe") {
      ws.unsubscribe(channel);
      logger.info({ channel }, "websocket unsubscribe");
    }
  },

  open() {
    logger.info("websocket connected");
  },
});
