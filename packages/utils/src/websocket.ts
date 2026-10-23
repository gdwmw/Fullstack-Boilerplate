import { TExampleWebsocketResource, TExampleWebsocketType } from "../../types/src";

export const exampleWebsocketMessage = (resource: TExampleWebsocketResource, type: TExampleWebsocketType, id: string) =>
  JSON.stringify({ id, resource, type });
