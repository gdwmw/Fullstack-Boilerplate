import { IAuthResponse, IUserResponse } from "..";
import { ISuccessResponse, postApi } from "../base";

export interface ILoginPayload {
  identifier: string;
  method: "email" | "username";
  password: string;
}

const label = "Login";

export const POSTLogin = async (payload: ILoginPayload): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<{ status: string } & IUserResponse>({
    auth: false,
    data: payload,
    endpoint: "/auth/login",
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
