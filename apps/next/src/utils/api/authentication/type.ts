import { IFilesModel, IUsersModel } from "@repo/types";

export interface IAuthResponse extends IUsersModel {
  accessToken: string;
  refreshToken: string;
  status: string;
}

export interface INextAuthResponse extends Partial<Omit<IUsersModel, "email" | "image" | "name">> {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  email?: null | string;
  exp?: number;
  iat?: number;
  image?: IFilesModel | null;
  name?: null | string;
  refreshToken?: string;
  sessionExpiresAt?: number;
  sessionStartedAt?: number;
  status?: string;
}
