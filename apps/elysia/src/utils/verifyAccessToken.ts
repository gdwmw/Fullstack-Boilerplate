import { HTTPHeaders, StatusMap } from "elysia";
import { ElysiaCookie } from "elysia/dist/cookies";

import { ERROR_RESPONSE, responseMessage } from "@/src/constants";
import { redis } from "@/src/libs";

export const getBearerToken = (authorization?: string) => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

export const verifyResponse = async ({ authorization, jwt }: { authorization?: string; jwt: { verify(token: string): Promise<unknown> } }) => {
  const res = getBearerToken(authorization);

  if (!res) {
    return ERROR_RESPONSE(null, responseMessage("Access token").required);
  }

  const decoded = await jwt.verify(res);

  if (!decoded || typeof decoded !== "object") {
    return ERROR_RESPONSE(null, responseMessage("Access token").invalid);
  }

  const jti = (decoded as Record<string, unknown>).jti;
  if (typeof jti === "string") {
    const blocked = await redis.exists(`blocklist:${jti}`);
    if (blocked === 1) {
      return ERROR_RESPONSE(null, responseMessage("Access token").invalid);
    }
  }

  return null;
};

export const verifyAccessToken = async ({
  headers,
  jwt,
  set,
}: {
  headers: { authorization?: string };
  jwt: { verify(token: string): Promise<unknown> };
  set: {
    cookie?: Record<string, ElysiaCookie>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  };
}) => {
  const res = await verifyResponse({
    authorization: headers.authorization,
    jwt,
  });

  if (res) {
    set.status = 401;
    return res;
  }
};
