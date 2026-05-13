import { IAuthResponse } from ".";
import { ISuccessResponse, postApi } from "../base";

export interface ILoginPayload {
  identifier: string;
  method: "email" | "username";
  password: string;
}

const label = "login";

export const POSTLogin = async (payload: ILoginPayload): Promise<ISuccessResponse<IAuthResponse>> => {
  const res = await postApi<IAuthResponse>({
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
