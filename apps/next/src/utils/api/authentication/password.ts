import { ISuccessResponse, postApi } from "../base";
import { IUserResponse } from "../users";

export interface IPasswordPayload {
  newPassword: string;
  oldPassword: string;
}

const label = "Change Password";

export const POSTChangePassword = async (payload: IPasswordPayload): Promise<ISuccessResponse<IUserResponse>> =>
  postApi<IUserResponse>({
    data: payload,
    endpoint: "/auth/change-password",
    label: label,
  });
