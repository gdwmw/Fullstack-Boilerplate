import type { NextAuthOptions, Session, User } from "next-auth";

import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

import { ILoginPayload, IUploadResponse, POSTLogin, POSTRefresh } from "@/src/utils";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "30m";
const SESSION_EXPIRES_IN = process.env.NEXTAUTH_SESSION_EXPIRES_IN || "7d";
const REFRESH_ACCESS_TOKEN_ERROR = "refresh-access-token-error";
const SESSION_EXPIRED_ERROR = "session-expired-error";

const parseDurationToMs = (value: string) => {
  const parsed = /^([0-9]+)(ms|s|m|h|d)$/i.exec(value.trim());

  if (!parsed) {
    throw new Error("Invalid duration format. Use: 15m, 7d, 3600s");
  }

  const amount = Number(parsed[1]);
  const unit = parsed[2].toLowerCase();

  const multiplierByUnit: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000,
  };

  return amount * multiplierByUnit[unit];
};

const parseDurationToSeconds = (value: string) => Math.floor(parseDurationToMs(value) / 1000);

const getAccessTokenExpiresAt = (accessToken?: string) => {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { exp?: number };
    if (!decoded.exp) {
      return null;
    }

    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

const getFallbackAccessTokenExpiry = () => Date.now() + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);
const getSessionExpiry = (startedAt: number) => startedAt + parseDurationToMs(SESSION_EXPIRES_IN);

const expireSession = (token: JWT): JWT => ({
  ...token,
  accessToken: undefined,
  accessTokenExpiresAt: undefined,
  error: SESSION_EXPIRED_ERROR,
  refreshToken: undefined,
});

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  if (!token.refreshToken) {
    return {
      ...token,
      error: REFRESH_ACCESS_TOKEN_ERROR,
    };
  }

  try {
    const parsed = await POSTRefresh({ refreshToken: token.refreshToken as string });

    if (!parsed?.data?.accessToken || !parsed?.data?.refreshToken) {
      throw new Error("Invalid refresh response payload");
    }

    const accessTokenExpiresAt = getAccessTokenExpiresAt(parsed.data.accessToken) || getFallbackAccessTokenExpiry();

    return {
      ...token,
      accessToken: parsed.data.accessToken,
      accessTokenExpiresAt,
      error: undefined,
      refreshToken: parsed.data.refreshToken,
    };
  } catch {
    return {
      ...token,
      error: REFRESH_ACCESS_TOKEN_ERROR,
    };
  }
};

export const options: NextAuthOptions = {
  callbacks: {
    async jwt({ session, token, trigger, user }: { session?: Session; token: JWT; trigger?: "signIn" | "signUp" | "update"; user?: User }) {
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          ...session.user,
          accessTokenExpiresAt: getAccessTokenExpiresAt(session.user.accessToken) || token.accessTokenExpiresAt,
          sessionExpiresAt: token.sessionExpiresAt,
          sessionStartedAt: token.sessionStartedAt,
        };
      }

      if (user) {
        const sessionStartedAt = Date.now();

        token.id = parseInt(user.id);
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.phone = user.phone;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = getAccessTokenExpiresAt(user.accessToken) || getFallbackAccessTokenExpiry();
        token.refreshToken = user.refreshToken;
        token.image = user.image as IUploadResponse | null;
        token.imageId = user.imageId;
        token.sessionExpiresAt = getSessionExpiry(sessionStartedAt);
        token.sessionStartedAt = sessionStartedAt;
        token.status = user.status;

        return token;
      }

      if (!token.sessionStartedAt || !token.sessionExpiresAt) {
        const sessionStartedAt = Date.now();
        token.sessionStartedAt = sessionStartedAt;
        token.sessionExpiresAt = getSessionExpiry(sessionStartedAt);
      }

      if (Date.now() >= (token.sessionExpiresAt as number)) {
        return expireSession(token);
      }

      const expiresAt = token.accessTokenExpiresAt as number | undefined;
      if (token.accessToken && expiresAt && Date.now() < expiresAt - 5_000) {
        return {
          ...token,
          error: undefined,
        };
      }

      return await refreshAccessToken(token);
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = {
        accessToken: token.accessToken as string | undefined,
        accessTokenExpiresAt: token.accessTokenExpiresAt as number | undefined,
        email: token.email as null | string | undefined,
        error: token.error as string | undefined,
        id: token.id as number | undefined,
        image: token.image as IUploadResponse | null | undefined,
        imageId: token.imageId as null | number | undefined,
        name: token.name as null | string | undefined,
        phone: token.phone as string | undefined,
        refreshToken: token.refreshToken as string | undefined,
        role: token.role as "admin" | "user" | undefined,
        sessionExpiresAt: token.sessionExpiresAt as number | undefined,
        sessionStartedAt: token.sessionStartedAt as number | undefined,
        status: token.status as string | undefined,
        username: token.username as string | undefined,
      };
      return session;
    },
  },

  pages: {
    signIn: "/authentication/login",
  },

  providers: [
    CredentialsProvider({
      async authorize(credentials: Record<never, string> | undefined): Promise<null | User> {
        if (!credentials) {
          return null;
        }

        const { identifier, method, password } = credentials as ILoginPayload;

        try {
          const res = await POSTLogin({ identifier, method: method === "email" ? "email" : "username", password });
          // eslint-disable-next-line
          return res.data as any;
        } catch {
          return null;
        }
      },
      credentials: {},
      name: "Credentials",
    }),
  ],

  session: {
    maxAge: parseDurationToSeconds(SESSION_EXPIRES_IN),
    strategy: "jwt",
  },
};
