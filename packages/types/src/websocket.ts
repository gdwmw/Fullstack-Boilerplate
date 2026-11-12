export type TExampleWebsocketResource = "W" | "X" | "Y" | "Z";
export type TExampleWebsocketType = "create" | "delete" | "update";

export interface IWebsocketMessageMeta {
  optimisticId?: string;
  senderClientId?: string;
}

export interface IWebsocketMessage<T> {
  data?: T;
  meta?: IWebsocketMessageMeta;
  resource: TExampleWebsocketResource;
  targetId: string;
  type: TExampleWebsocketType;
}
