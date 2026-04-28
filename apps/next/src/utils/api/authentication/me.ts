import { getApi, ISuccessResponse } from "../base";
import { IUploadResponse } from "../upload";

export interface IMeResponse {
  email: string;
  id: number;
  image?: IUploadResponse | null;
  imageId?: null | number;
  name: string;
  phone: string;
  role: "admin" | "user";
  username: string;
}

const label = "Get Current User";

export const GETMe = async (): Promise<ISuccessResponse<IMeResponse>> =>
  getApi<IMeResponse>({
    endpoint: "/auth/me",
    label,
  });
