import { ISuccessResponse } from "@repo/types";

import { deleteApi, getApi, patchApi, postApi, putApi, TQueryParams } from "./base";

interface IExampleCommon {
  email: string;
  name: string;
  phoneNumber: string;
  username: string;
}

export interface IExamplePayload extends IExampleCommon {}

export interface IExampleResponse extends IExampleCommon {}

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

export const POSTExample = async (payload: IExamplePayload): Promise<ISuccessResponse<IExampleResponse>> =>
  postApi<IExampleResponse>({
    data: payload,
    endpoint: "/example",
    label,
  });

export const PUTExample = async (id: string, payload: IExamplePayload): Promise<ISuccessResponse<IExampleResponse>> =>
  putApi<IExampleResponse>({
    data: payload,
    endpoint: `/example/${id}`,
    label,
  });

export const PATCHExample = async (id: string, payload: IExamplePayload): Promise<ISuccessResponse<IExampleResponse>> =>
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
