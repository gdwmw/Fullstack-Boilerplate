export const websocket = (apiUrl: string, channel: string): WebSocket => {
  const websocketUrl = new URL(`${apiUrl.replace(/\/$/, "")}/websocket`);
  websocketUrl.protocol = websocketUrl.protocol === "https:" ? "wss:" : "ws:";
  websocketUrl.searchParams.set("channel", channel);

  return new WebSocket(websocketUrl);
};
