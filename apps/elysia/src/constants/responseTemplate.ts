import { Prisma } from "../generated/prisma/client";

export const SUCCESS_RESPONSE = ({ data, message = null }: { data: unknown; message: null | string }) => ({
  data: data || null,
  message: message,
  success: true,
});

export const ERROR_RESPONSE = ({
  error,
  message,
  token,
}: {
  error?: unknown;
  message: null | string;
  token?: { access?: boolean; refresh?: boolean } | null;
}) => ({
  code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null,
  error: null,
  message: message,
  success: false,
  token: token
    ? {
        access: (token.refresh ?? true) ? (token.access ?? true) : false,
        refresh: token.refresh ?? true,
      }
    : null,
});
