export const websocket = (apiUrl: string): WebSocket => {
  const websocketUrl = new URL(`${apiUrl.replace(/\/$/, "")}/websocket`);
  websocketUrl.protocol = websocketUrl.protocol === "https:" ? "wss:" : "ws:";

  return new WebSocket(websocketUrl);
};
