import { IErrorResponse, ISuccessResponse } from "@repo/types";

export const SUCCESS_RESPONSE = <T>(props: Omit<ISuccessResponse<T>, "success">): ISuccessResponse<T> => ({
  data: props.data || null,
  message: props.message || null,
  success: true,
  ...(props.meta ? { meta: props.meta || null } : {}),
});

export const ERROR_RESPONSE = (props: Omit<IErrorResponse, "success">): IErrorResponse => ({
  message: props.message || null,
  success: false,
});
