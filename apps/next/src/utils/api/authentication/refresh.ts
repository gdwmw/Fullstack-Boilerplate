import { IAuthResponse } from ".";
import { ISuccessResponse, postApi } from "../base";

const label = "refresh";

export const POSTRefresh = async (): Promise<ISuccessResponse<IAuthResponse>> =>
  postApi<IAuthResponse>({
    auth: false,
    endpoint: "/auth/refresh",
    label,
  });
