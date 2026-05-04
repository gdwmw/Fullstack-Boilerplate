import { getApi, ISuccessResponse } from "../base";
import { IUserResponse } from "../users";

const label = "Get Current User";

export const GETMe = async (): Promise<ISuccessResponse<IUserResponse>> =>
  getApi<IUserResponse>({
    endpoint: "/auth/me",
    label,
  });
