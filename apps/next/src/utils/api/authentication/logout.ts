import { ISuccessResponse } from "@repo/types";

import { postApi } from "../base";

const label = "logout";

export const POSTLogout = async (): Promise<ISuccessResponse<null>> =>
  postApi<null>({
    endpoint: "/auth/logout",
    label,
  });
