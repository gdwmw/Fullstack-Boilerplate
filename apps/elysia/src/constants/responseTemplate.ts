import { Prisma } from "../generated/prisma/client";

export const SUCCESS_RESPONSE = ({
  data,
  message = null,
  meta = null,
}: {
  data: unknown;
  message: null | string;
  meta?: { page: number; pageSize: number; total: number; totalPages?: number } | null;
}) => ({
  data: data || null,
  message: message,
  meta: meta || null,
  success: true,
});

export const ERROR_RESPONSE = ({ error, message }: { error?: unknown; message: null | string }) => ({
  code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null,
  message: message,
  success: false,
});
