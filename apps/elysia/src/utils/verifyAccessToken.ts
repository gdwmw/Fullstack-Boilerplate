import { HTTPHeaders, StatusMap } from "elysia";
import { ElysiaCookie } from "elysia/dist/cookies";

import { responseMessage } from "@/src/constants";

export const getBearerToken = (authorization?: string) => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

export const verifyResponse = async ({ authorization, jwt }: { authorization?: string; jwt: { verify(token: string): Promise<unknown> } }) => {
  const res = getBearerToken(authorization);

  if (!res) {
    return {
      message: responseMessage("Access token").required,
      success: false,
    };
  }

  const decoded = await jwt.verify(res);

  if (!decoded) {
    return {
      message: responseMessage("Access token").invalid,
      success: false,
    };
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
