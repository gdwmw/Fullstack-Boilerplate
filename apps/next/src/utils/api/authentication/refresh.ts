import { ISuccessResponse, postApi } from "../base";

export interface IRefreshPayload {
  refreshToken: string;
}

export interface IRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const label = "Refresh Token";

export const POSTRefresh = async (payload: IRefreshPayload): Promise<ISuccessResponse<IRefreshResponse>> =>
  postApi<IRefreshResponse>({
    auth: false,
    data: payload,
    endpoint: "/auth/refresh",
    label,
  });
