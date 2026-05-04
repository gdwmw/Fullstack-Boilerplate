import { IUploadResponse } from "../upload";
import { IUserResponse } from "../users";

export interface IAuthResponse extends IUserResponse {
  status: string;
}

export interface INextAuthResponse extends Partial<Omit<IUserResponse, "email" | "image" | "name">> {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  email?: null | string;
  image?: IUploadResponse | null;
  name?: null | string;
  sessionExpiresAt?: number;
  sessionStartedAt?: number;
  status?: string;
}

export * from "./login";
export * from "./logout";
export * from "./me";
export * from "./password";
export * from "./refresh";
export * from "./register";
