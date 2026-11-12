import { ISuccessResponse } from "@repo/types";

import { postApi } from "../base";
import { IAuthResponse } from "./type";

export interface IRegisterPayload {
  email: string;
  name: string;
  password: string;
  phone: string;
  username: string;
}

const label = "register";

export const POSTRegister = async ({ payload }: { payload: IRegisterPayload }): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<IAuthResponse>({
    auth: false,
    endpoint: "/auth/register",
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
