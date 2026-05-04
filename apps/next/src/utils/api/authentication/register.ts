import { IAuthResponse } from "..";
import { ISuccessResponse, postApi } from "../base";

export interface IRegisterPayload {
  email: string;
  name: string;
  password: string;
  phone: string;
  username: string;
}

const label = "Register";

export const POSTRegister = async (payload: IRegisterPayload): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<IAuthResponse>({
    auth: false,
    data: payload,
    endpoint: "/auth/register",
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
