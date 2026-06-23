import { IErrorResponse, ISuccessResponse } from "@repo/types";

import { Prisma } from "../generated/prisma/client";

interface ISuccessOmited<T> extends Omit<ISuccessResponse<T>, "success"> {}

interface IErrorOmited extends Omit<IErrorResponse, "success"> {
  error?: null | unknown;
}

export const SUCCESS_RESPONSE = <T>(props: ISuccessOmited<T>): ISuccessResponse<T> => ({
  data: props.data || null,
  message: props.message || null,
  success: true,
  ...(props.meta ? { meta: props.meta || null } : {}),
});

export const ERROR_RESPONSE = (props: IErrorOmited): IErrorResponse => ({
  message: props.message || null,
  success: false,
  ...(props.error instanceof Prisma.PrismaClientKnownRequestError ? { code: props.error.code || null } : {}),
});
