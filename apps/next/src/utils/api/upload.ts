import { IFilesModel, ISuccessResponse } from "@repo/types";

import { deleteApi, getApi, postApi, TQueryParams } from "./base";

export interface IUploadPayload {
  file: File;
}

const label = "upload";

export const GETUpload = async (params?: TQueryParams): Promise<ISuccessResponse<IFilesModel[]>> =>
  getApi<IFilesModel[]>({
    endpoint: "/upload",
    label: label,
    params: params,
  });

export const GETUploadById = async (id: string): Promise<ISuccessResponse<IFilesModel>> =>
  getApi<IFilesModel>({
    endpoint: `/upload/${id}`,
    label: label,
  });

export const POSTUpload = async (payload: IUploadPayload): Promise<ISuccessResponse<IFilesModel>> => {
  const formData = new FormData();
  formData.append("file", payload.file);

  return postApi<IFilesModel>({
    data: formData,
    endpoint: "/upload",
    label: label,
  });
};

export const DELETEUpload = async (id: string): Promise<ISuccessResponse<IFilesModel>> =>
  deleteApi<IFilesModel>({
    endpoint: `/upload/${id}`,
    label: label,
  });
