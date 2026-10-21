import { TExampleWebsocketResource, TExampleWebsocketType } from "../../types/src";

export const exampleWebsocketMessage = (resource: TExampleWebsocketResource, type: TExampleWebsocketType) => JSON.stringify({ resource, type });
