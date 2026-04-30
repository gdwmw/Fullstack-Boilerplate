import { Prisma } from "../generated/prisma/client";

export const SUCCESS_RESPONSE = ({ data, message = null }: { data: unknown; message: null | string }) => ({
  data: data || null,
  message: message,
  success: true,
});

export const ERROR_RESPONSE = ({ error, message }: { error?: unknown; message: null | string }) => ({
  code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null,
  message: message,
  success: false,
});
