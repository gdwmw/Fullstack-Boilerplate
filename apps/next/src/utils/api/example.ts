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

export const GETExample = async ({ query }: { query?: TQueryParams }): Promise<ISuccessResponse<IExampleResponse[]>> =>
  getApi<IExampleResponse[]>({
    endpoint: "/examples",
    label,
    query,
  });

export const GETExampleById = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IExampleResponse>> =>
  getApi<IExampleResponse>({
    endpoint: `/examples/${param.id}`,
    label,
  });

export const POSTExample = async ({ payload }: { payload: IExampleCreatePayload }): Promise<ISuccessResponse<IExampleResponse>> =>
  postApi<IExampleResponse>({
    endpoint: "/examples",
    label,
    payload,
  });

export const PUTExample = async ({
  param,
  payload,
}: {
  param: { id: string };
  payload: IExampleUpdatePayload;
}): Promise<ISuccessResponse<IExampleResponse>> =>
  putApi<IExampleResponse>({
    endpoint: `/examples/${param.id}`,
    label,
    payload,
  });

export const PATCHExample = async ({
  param,
  payload,
}: {
  param: { id: string };
  payload: IExamplePatchPayload;
}): Promise<ISuccessResponse<IExampleResponse>> =>
  patchApi<IExampleResponse>({
    endpoint: `/examples/${param.id}`,
    label,
    payload,
  });

export const DELETEExample = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IExampleResponse>> =>
  deleteApi<IExampleResponse>({
    endpoint: `/examples/${param.id}`,
    label,
  });
