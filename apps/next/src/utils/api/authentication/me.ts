import { IUsersModel } from "@repo/types";

import { getApi, ISuccessResponse } from "../base";

const label = "me";

export const GETMe = async (): Promise<ISuccessResponse<IUsersModel>> =>
  getApi<IUsersModel>({
    endpoint: "/auth/me",
    label,
  });
