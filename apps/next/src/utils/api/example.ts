import { ISuccessResponse } from "@repo/types";

import { deleteApi, getApi, patchApi, postApi, putApi, TQueryParams } from "./base";

export interface IExampleCreatePayload {
  email: string;
  name: string;
  phoneNumber: string;
  username: string;
}

export interface IExampleUpdatePayload {
  name: string;
  username: string;
}

export interface IExamplePatchPayload extends Partial<IExampleCreatePayload> {}

export interface IExampleResponse extends IExampleCreatePayload {}

const label = "example";

export const GETExample = async (params?: TQueryParams): Promise<ISuccessResponse<IExampleResponse[]>> =>
  getApi<IExampleResponse[]>({
    endpoint: "/example",
    label,
    params,
  });

export const GETExampleById = async (id: string): Promise<ISuccessResponse<IExampleResponse>> =>
  getApi<IExampleResponse>({
    endpoint: `/example/${id}`,
    label,
  });

export const POSTExample = async (payload: IExampleCreatePayload): Promise<ISuccessResponse<IExampleResponse>> =>
  postApi<IExampleResponse>({
    data: payload,
    endpoint: "/example",
    label,
  });

export const PUTExample = async (id: string, payload: IExampleUpdatePayload): Promise<ISuccessResponse<IExampleResponse>> =>
  putApi<IExampleResponse>({
    data: payload,
    endpoint: `/example/${id}`,
    label,
  });

export const PATCHExample = async (id: string, payload: IExamplePatchPayload): Promise<ISuccessResponse<IExampleResponse>> =>
  patchApi<IExampleResponse>({
    data: payload,
    endpoint: `/example/${id}`,
    label,
  });

export const DELETEExample = async (id: string): Promise<ISuccessResponse<IExampleResponse>> =>
  deleteApi<IExampleResponse>({
    endpoint: `/example/${id}`,
    label,
  });
