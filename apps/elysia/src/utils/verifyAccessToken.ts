import { HTTPHeaders, StatusMap } from "elysia";

import { ERROR_RESPONSE, responseMessage } from "@/src/constants";
import { redis } from "@/src/libs";

export const getBearerToken = (authorization?: string) => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

const accessTokenInvalidOrExpiredMessage = `${responseMessage("access token").invalid} or ${responseMessage("access token").expired}`;

export const verifyResponse = async ({
  accessJwt,
  authorization,
}: {
  accessJwt: { verify(token: string): Promise<unknown> };
  authorization?: string;
}) => {
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

  const jti = (decoded as { jti?: unknown }).jti;
  if (typeof jti === "string" && (await redis.exists(`blocklist:${jti}`)) === 1) {
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
  accessJwt: { verify(token: string): Promise<unknown> };
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

  if (!res) return null;

  set.status = 401;
  return res;
};
