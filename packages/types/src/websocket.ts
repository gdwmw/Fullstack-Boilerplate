export type TExampleWebsocketResource = "W" | "X" | "Y" | "Z";
export type TExampleWebsocketType = "create" | "delete" | "update";
export interface IWebsocketMessage<T> {
  id: string;
  options?: {
    data?: T;
    senderClientId?: string;
  };
  resource: TExampleWebsocketResource;
  type: TExampleWebsocketType;
}
