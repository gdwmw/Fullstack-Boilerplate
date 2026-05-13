import { IUsersModel } from "@repo/types";

import { deleteApi, getApi, ISuccessResponse, putApi } from "./base";

export interface IUserPayload extends Omit<IUsersModel, "createdAt" | "id" | "image" | "imageId" | "role" | "updatedAt"> {
  imageId?: IUsersModel["imageId"];
  role?: IUsersModel["role"];
}

type TQueryParams = Record<string, unknown>;

const label = "users";

export const GETUsers = async (params?: TQueryParams): Promise<ISuccessResponse<IUsersModel[]>> =>
  getApi<IUsersModel[]>({
    endpoint: "/users",
    label: label,
    params: params,
  });

export const GETUsersById = async (id: string, params?: TQueryParams): Promise<ISuccessResponse<IUsersModel>> =>
  getApi<IUsersModel>({
    endpoint: `/users/${id}`,
    label: label,
    params: params,
  });

export const PUTUsers = async (id: string, payload: IUserPayload): Promise<ISuccessResponse<IUsersModel>> =>
  putApi<IUsersModel>({
    data: payload,
    endpoint: `/users/${id}`,
    label: label,
  });

export const DELETEUsers = async (id: string): Promise<ISuccessResponse<IUsersModel>> =>
  deleteApi<IUsersModel>({
    endpoint: `/users/${id}`,
    label: label,
  });
