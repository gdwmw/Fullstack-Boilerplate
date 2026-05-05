import { getApi, ISuccessResponse } from "../base";
import { IUserResponse } from "../users";

const label = "me";

export const GETMe = async (): Promise<ISuccessResponse<IUserResponse>> =>
  getApi<IUserResponse>({
    endpoint: "/auth/me",
    label,
  });
