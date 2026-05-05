import { ISuccessResponse, postApi } from "../base";

export interface IRefreshResponse {
  accessToken: string;
}

const label = "refresh token";

export const POSTRefresh = async (): Promise<ISuccessResponse<IRefreshResponse>> =>
  postApi<IRefreshResponse>({
    auth: false,
    endpoint: "/auth/refresh",
    label,
  });
