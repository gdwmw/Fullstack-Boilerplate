import { ISuccessResponse, postApi } from "../base";
import { IUserResponse } from "../users";

export interface IPasswordPayload {
  newPassword: string;
  oldPassword: string;
}

const label = "change password";

export const POSTChangePassword = async (payload: IPasswordPayload): Promise<ISuccessResponse<IUserResponse>> =>
  postApi<IUserResponse>({
    data: payload,
    endpoint: "/auth/change-password",
    label: label,
  });
