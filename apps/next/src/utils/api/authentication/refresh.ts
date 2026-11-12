import { ISuccessResponse } from "@repo/types";
import axios from "axios";

import { postApi } from "../base";
import { IAuthResponse } from "./type";

const label = "refresh";

export const POSTRefresh = async ({ payload }: { payload: { encryptedRefreshToken: string } }): Promise<ISuccessResponse<IAuthResponse>> => {
  const decryptRes = await axios.post<{ data: { refreshToken: string }; success: boolean }>("/api/auth/decrypt", {
    refreshToken: payload.encryptedRefreshToken,
  });

  const plainRefreshToken = decryptRes.data.data.refreshToken;

  return postApi<IAuthResponse>({
    auth: false,
    endpoint: "/auth/refresh",
    label,
    payload: { refreshToken: plainRefreshToken },
  });
};
