import { Elysia, t } from "elysia";

import { logger } from "@/src/libs/pino";

export const websocketRoutes = new Elysia().ws("/websocket", {
  close(ws) {
    const { channel } = ws.data.query;
    logger.info({ channel: channel }, "websocket disconnected");
  },

  message(ws, message) {
    const { channel } = ws.data.query;
    ws.publish(channel, message);
  },

  open(ws) {
    const { channel } = ws.data.query;
    logger.info({ channel: channel }, "websocket connected");
    ws.subscribe(channel);
  },

  query: t.Object({ channel: t.String() }),
});
