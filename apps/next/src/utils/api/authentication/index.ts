import { IUploadResponse } from "../upload";
import { IUserResponse } from "../users";

export interface IAuthResponse extends IUserResponse {
  accessToken: string;
  status: string;
}

export interface INextAuthResponse extends Partial<Omit<IUserResponse, "email" | "image" | "name">> {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  email?: null | string;
  exp?: number;
  iat?: number;
  image?: IUploadResponse | null;
  name?: null | string;
  status?: string;
}

export * from "./login";
export * from "./logout";
export * from "./me";
export * from "./password";
export * from "./refresh";
export * from "./register";
