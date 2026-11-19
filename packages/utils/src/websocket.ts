import { IWebsocketMessage } from "../../types/src";

export const exampleWebsocketMessage = <T>(props: IWebsocketMessage<T>) => JSON.stringify(props);
