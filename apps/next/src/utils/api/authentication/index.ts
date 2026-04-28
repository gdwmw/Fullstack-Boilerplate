import { IUploadResponse } from "../upload";

export interface IAuthResponse {
  accessToken: string;
  email: string;
  id: number;
  image?: IUploadResponse | null;
  imageId?: null | number;
  name: string;
  phone: string;
  role: "admin" | "user";
  status: string;
  username: string;
}

export interface INextAuthResponse {
  accessToken?: null | string;
  accessTokenExpiresAt?: number;
  email?: null | string;
  id?: number;
  image?: IUploadResponse | null;
  imageId?: null | number;
  name?: null | string;
  phone?: string;
  role?: "admin" | "user";
  sessionExpiresAt?: number;
  sessionStartedAt?: number;
  status?: string;
  username?: string;
}

export * from "./login";
export * from "./logout";
export * from "./me";
export * from "./password";
export * from "./refresh";
export * from "./register";
