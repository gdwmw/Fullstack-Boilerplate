import { AxiosRequestHeaders } from "axios";

import { IAuthResponse } from "..";
import { ISuccessResponse, postApi } from "../base";

export interface ILoginPayload {
  identifier: string;
  method: "email" | "username";
  password: string;
}

const label = "login";

export const POSTLogin = async (payload: ILoginPayload, headers?: Record<string, string>): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<IAuthResponse>({
    auth: false,
    data: payload,
    endpoint: "/auth/login",
    headers: headers as AxiosRequestHeaders | undefined,
    label,
  });

  return {
    data: {
      ...res.data,
      status: "authenticated",
    },
    message: res.message,
    success: true,
  };
};
