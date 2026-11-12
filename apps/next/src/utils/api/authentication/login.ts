import { ISuccessResponse } from "@repo/types";

import { postApi } from "../base";
import { IAuthResponse } from "./type";

export interface ILoginPayload {
  identifier: string;
  method: "email" | "username";
  password: string;
}

const label = "login";

export const POSTLogin = async ({ payload }: { payload: ILoginPayload }): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<IAuthResponse>({
    auth: false,
    endpoint: "/auth/login",
    label,
    payload,
  });

  return {
    data: {
      ...res.data,
      status: "authenticated",
    } as IAuthResponse,
    message: res.message,
    success: true,
  };
};
