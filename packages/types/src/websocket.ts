export type TExampleWebsocketResource = "boards" | "cards" | "columns" | "workspaces";
export type TExampleWebsocketType = "create" | "delete" | "move" | "rebalance" | "update";
export interface IWebsocketMessage<T> {
  id: string;
  options?: {
    data?: T;
    senderClientId?: string;
  };
  resource: TExampleWebsocketResource;
  type: TExampleWebsocketType;
}
