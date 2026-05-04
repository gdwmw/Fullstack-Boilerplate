import { deleteApi, getApi, ISuccessResponse, putApi } from "./base";
import { IUploadResponse } from "./upload";

export interface IUserPayload {
  email: string;
  imageId?: null | number;
  name: string;
  phone: string;
  role?: "admin" | "user";
  username: string;
}

export interface IUserResponse {
  createdAt: Date;
  email: string;
  id: number;
  image?: IUploadResponse | null;
  imageId?: null | number;
  name: string;
  phone: string;
  role: "admin" | "user";
  updatedAt: Date;
  username: string;
}

type TQueryParams = Record<string, unknown>;

const label = "Users";

export const GETUsers = async (params?: TQueryParams): Promise<ISuccessResponse<IUserResponse[]>> =>
  getApi<IUserResponse[]>({
    endpoint: "/users",
    label: label,
    params: params,
  });

export const GETUsersById = async (id: number, params?: TQueryParams): Promise<ISuccessResponse<IUserResponse>> =>
  getApi<IUserResponse>({
    endpoint: `/users/${id}`,
    label: label,
    params: params,
  });

export const PUTUsers = async (id: number, payload: IUserPayload): Promise<ISuccessResponse<IUserResponse>> =>
  putApi<IUserResponse>({
    data: payload,
    endpoint: `/users/${id}`,
    label: label,
  });

export const DELETEUsers = async (id: number): Promise<ISuccessResponse<IUserResponse>> =>
  deleteApi<IUserResponse>({
    endpoint: `/users/${id}`,
    label: label,
  });
