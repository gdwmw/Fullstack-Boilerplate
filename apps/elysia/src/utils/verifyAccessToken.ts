import { HTTPHeaders, StatusMap } from "elysia";
import { ElysiaCookie } from "elysia/dist/cookies";

import { ERROR_RESPONSE, responseMessage } from "@/src/constants";
import { redis } from "@/src/libs";

export const getBearerToken = (authorization?: string) => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

export const verifyResponse = async ({
  accessJwt,
  authorization,
}: {
  accessJwt: { verify(token: string): Promise<unknown> };
  authorization?: string;
}) => {
  const res = getBearerToken(authorization);

  if (!res) {
    return ERROR_RESPONSE({
      message: responseMessage("Access token").required,
      token: { access: false },
    });
  }

  const decoded = await accessJwt.verify(res);

  if (!decoded || typeof decoded !== "object") {
    return ERROR_RESPONSE({
      message: responseMessage("Access token").invalid,
      token: { access: false },
    });
  }

  const jti = (decoded as Record<string, unknown>).jti;
  if (typeof jti === "string") {
    const blocked = await redis.exists(`blocklist:${jti}`);
    if (blocked === 1) {
      return ERROR_RESPONSE({
        message: responseMessage("Access token").invalid,
        token: { access: false },
      });
    }
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
    cookie?: Record<string, ElysiaCookie>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  };
}) => {
  const res = await verifyResponse({
    accessJwt,
    authorization: headers.authorization,
  });

  if (res) {
    set.status = 401;
    return res;
  }
};
