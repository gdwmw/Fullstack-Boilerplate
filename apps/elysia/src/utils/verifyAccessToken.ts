import { HTTPHeaders, StatusMap } from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { ERROR_RESPONSE } from "@/src/constants/responseTemplate";
import { redis } from "@/src/libs/redis";

type TJwtVerifier = {
  verify(token: string): Promise<unknown>;
};

export const getBearerToken = (authorization?: string) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
};

const accessTokenInvalidOrExpiredMessage = `${responseMessage("access token").invalid} or ${responseMessage("access token").expired}`;

const isRevokedToken = async (decoded: unknown) => {
  if (!decoded || typeof decoded !== "object") {
    return false;
  }

  const { jti } = decoded as { jti?: unknown };

  if (typeof jti !== "string") {
    return false;
  }

  return (await redis.exists(`blocklist:${jti}`)) === 1;
};

export const verifyResponse = async ({ accessJwt, authorization }: { accessJwt: TJwtVerifier; authorization?: string }) => {
  const token = getBearerToken(authorization);

  if (!token) {
    return ERROR_RESPONSE({
      message: responseMessage("access token").required,
    });
  }

  const decoded = await accessJwt.verify(token);

  if (!decoded || typeof decoded !== "object") {
    return ERROR_RESPONSE({
      message: accessTokenInvalidOrExpiredMessage,
    });
  }

  const revoked = await isRevokedToken(decoded);

  if (revoked) {
    return ERROR_RESPONSE({
      message: accessTokenInvalidOrExpiredMessage,
    });
  }

  return null;
};

export const verifyAccessToken = async ({
  accessJwt,
  headers,
  set,
}: {
  accessJwt: TJwtVerifier;
  headers: { authorization?: string };
  set: {
    cookie?: Record<string, unknown>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  };
}) => {
  const res = await verifyResponse({
    accessJwt,
    authorization: headers.authorization,
  });

  if (!res) {
    return null;
  }

  set.status = 401;
  return res;
};
