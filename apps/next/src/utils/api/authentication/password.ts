import { ISuccessResponse, IUsersModel } from "@repo/types";

import { postApi } from "../base";

export interface IPasswordPayload {
  newPassword: string;
  oldPassword: string;
}

const label = "password";

export const POSTChangePassword = async (payload: IPasswordPayload): Promise<ISuccessResponse<IUsersModel>> =>
  postApi<IUsersModel>({
    data: payload,
    endpoint: "/auth/change-password",
    label,
  });
