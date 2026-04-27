import { Prisma } from "../generated/prisma/client";

export const SUCCESS_RESPONSE = (data: unknown, message: null | string = null) => ({
  data: data || null,
  message: message,
  success: true,
});

export const ERROR_RESPONSE = (error: unknown, message: null | string = null) => ({
  code: !(error instanceof Prisma.PrismaClientKnownRequestError) ? null : error.code,
  message: message,
  success: false,
});
