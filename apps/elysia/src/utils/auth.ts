import { IErrorResponse } from "@repo/types";
import { ironEncrypt } from "@repo/utils";
import { HTTPHeaders, StatusMap } from "elysia";

import { env } from "@/src/environment";
import { redis } from "@/src/libs/redis";

import { responseMessage } from "../constants/responseMessage";
import { ERROR_RESPONSE } from "../constants/responseTemplate";
import { accessJWTPlugin, refreshJWTPlugin } from "./plugins/jwtPlugin";

// ------------------------------------------------------------------

const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

// ------------------------------------------------------------------

export interface IJWTPayload {
  jti: string;
  sub: string;
}

export interface IAuthenticatedJWT extends IJWTPayload {
  exp: number;
}

// ------------------------------------------------------------------

interface IGenerateAccessAndRefreshTokens {
  accessJWT: typeof accessJWTPlugin.decorator.accessJWT;
  refreshJWT: typeof refreshJWTPlugin.decorator.refreshJWT;
  userId: string;
}

export const generateAccessAndRefreshTokens = async (
  props: IGenerateAccessAndRefreshTokens,
): Promise<{
  accessToken: string;
  encryptedRefreshToken: string;
}> => {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();
  const userId = String(props.userId);

  const accessToken = await props.accessJWT.sign({
    jti: accessJti,
    sub: userId,
  });

  const refreshToken = await props.refreshJWT.sign({
    jti: refreshJti,
    sub: userId,
  });

  const encryptedRefreshToken = await ironEncrypt(refreshToken, REFRESH_TOKEN_SECRET);

  return {
    accessToken,
    encryptedRefreshToken,
  };
};

// ------------------------------------------------------------------

export const errorResponseMessage = `${responseMessage("access token").invalid} or ${responseMessage("access token").expired}`;

export const parseBearerToken = (authorization?: string): null | string => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
};

// ------------------------------------------------------------------

interface IGetAuthenticatedJWT {
  accessJWT: typeof accessJWTPlugin.decorator.accessJWT;
  headers: { authorization?: string };
  set: {
    cookie?: Record<string, unknown>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  };
}

type TGetAuthenticatedJWTResponse = { error: IErrorResponse; jwt: null } | { error: null; jwt: IAuthenticatedJWT };

export const getAuthenticatedJWT = async (props: IGetAuthenticatedJWT): Promise<TGetAuthenticatedJWTResponse> => {
  const token = parseBearerToken(props.headers.authorization);

  if (!token) {
    props.set.status = 401;
    return { error: ERROR_RESPONSE({ message: responseMessage("access token").required }), jwt: null };
  }

  const decoded = await props.accessJWT.verify(token);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.jti !== "string" ||
    typeof decoded.exp !== "number" ||
    !Number.isFinite(decoded.exp)
  ) {
    props.set.status = 401;
    return { error: ERROR_RESPONSE({ message: errorResponseMessage }), jwt: null };
  }

  const revoked = (await redis.exists(`blocklist:${decoded.jti}`)) === 1;

  if (revoked) {
    props.set.status = 401;
    return { error: ERROR_RESPONSE({ message: errorResponseMessage }), jwt: null };
  }

  return {
    error: null,
    jwt: {
      exp: decoded.exp,
      jti: decoded.jti,
      sub: decoded.sub,
    },
  };
};
