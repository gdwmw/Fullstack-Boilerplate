import { ISuccessResponse, IUsersModel } from "@repo/types";

import { deleteApi, getApi, putApi, TQueryParams } from "./base";

export interface IUserUpdatePayload extends Omit<IUsersModel, "createdAt" | "id" | "image" | "imageId" | "role" | "updatedAt"> {
  imageId?: IUsersModel["imageId"];
  role?: IUsersModel["role"];
}

const label = "users";

export const GETUsers = async ({ query }: { query?: TQueryParams }): Promise<ISuccessResponse<IUsersModel[]>> =>
  getApi<IUsersModel[]>({
    endpoint: "/users",
    label,
    query,
  });

export const GETUsersById = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IUsersModel>> =>
  getApi<IUsersModel>({
    endpoint: `/users/${param.id}`,
    label,
  });

export const PUTUsers = async ({ param, payload }: { param: { id: string }; payload: IUserUpdatePayload }): Promise<ISuccessResponse<IUsersModel>> =>
  putApi<IUsersModel>({
    endpoint: `/users/${param.id}`,
    label,
    payload,
  });

export const DELETEUsers = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IUsersModel>> =>
  deleteApi<IUsersModel>({
    endpoint: `/users/${param.id}`,
    label,
  });
