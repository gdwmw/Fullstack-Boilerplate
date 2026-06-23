import { ISuccessResponse } from "@repo/types";
import axios from "axios";

import { postApi } from "../base";
import { IAuthResponse } from "./type";

const label = "refresh";

export const POSTRefresh = async (encryptedRefreshToken: string): Promise<ISuccessResponse<IAuthResponse>> => {
  const decryptRes = await axios.post<{ data: { refreshToken: string }; success: boolean }>("/api/auth/decrypt", {
    refreshToken: encryptedRefreshToken,
  });

  const plainRefreshToken = decryptRes.data.data.refreshToken;

  return postApi<IAuthResponse>({
    auth: false,
    data: { refreshToken: plainRefreshToken },
    endpoint: "/auth/refresh",
    label,
  });
};
