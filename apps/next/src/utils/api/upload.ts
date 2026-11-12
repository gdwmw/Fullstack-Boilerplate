import { IFilesModel, ISuccessResponse } from "@repo/types";

import { deleteApi, getApi, postApi, TQueryParams } from "./base";

export interface IUploadPayload {
  file: File;
}

const label = "upload";

export const GETUpload = async ({ query }: { query?: TQueryParams }): Promise<ISuccessResponse<IFilesModel[]>> =>
  getApi<IFilesModel[]>({
    endpoint: "/upload",
    label,
    query,
  });

export const GETUploadById = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IFilesModel>> =>
  getApi<IFilesModel>({
    endpoint: `/upload/${param.id}`,
    label,
  });

export const POSTUpload = async ({ payload }: { payload: IUploadPayload }): Promise<ISuccessResponse<IFilesModel>> => {
  const formData = new FormData();
  formData.append("file", payload.file);

  return postApi<IFilesModel>({
    endpoint: "/upload",
    label,
    payload: formData,
  });
};

export const DELETEUpload = async ({ param }: { param: { id: string } }): Promise<ISuccessResponse<IFilesModel>> =>
  deleteApi<IFilesModel>({
    endpoint: `/upload/${param.id}`,
    label,
  });
