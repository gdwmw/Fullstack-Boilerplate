import { ISuccessResponse, postApi } from "../base";

const label = "Logout";

export const POSTLogout = async (): Promise<ISuccessResponse<null>> =>
  postApi<null>({
    endpoint: "/auth/logout",
    label,
  });
