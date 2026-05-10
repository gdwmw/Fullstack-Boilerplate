import { parseDurationToMs } from "@repo/utils";
import axios from "axios";
import { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

import { clientEnv } from "@/src/environments/env.client";
import { serverEnv } from "@/src/environments/env.server";
import { IAuthResponse, ILoginPayload, POSTLogin } from "@/src/utils";

const SESSION_EXPIRES_IN = serverEnv.NEXTAUTH_SESSION_EXPIRES_IN;
const ACCESS_TOKEN_EXPIRES_IN = clientEnv.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN;

const parseDurationToSeconds = (value: string) => Math.floor(parseDurationToMs(value) / 1000);

export const options: NextAuthOptions = {
  callbacks: {
    async jwt({ session, token, trigger, user }) {
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          ...session.user,
        };
      }

      if (user) {
        const sessionStartedAt = Date.now();
        const sessionExpiresAt = sessionStartedAt + parseDurationToMs(SESSION_EXPIRES_IN);
        const u = user as unknown as IAuthResponse;

        return {
          id: Number.parseInt(user.id),
          accessToken: u.accessToken,
          accessTokenExpiresAt: sessionStartedAt + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN),
          createdAt: u.createdAt,
          email: u.email,
          image: u.image ?? null,
          imageId: u.imageId ?? null,
          name: u.name,
          phone: u.phone,
          role: u.role,
          sessionExpiresAt,
          sessionStartedAt,
          status: u.status,
          updatedAt: u.updatedAt,
          username: u.username,
        } as JWT;
      }

      return token;
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = { ...token };
      return session;
    },
  },

  pages: {
    signIn: "/authentication/login",
  },

  providers: [
    CredentialsProvider({
      async authorize(credentials: Record<string, string> | undefined, req): Promise<null | User> {
        if (!credentials) {
          return null;
        }

        const { identifier, method, password } = credentials as unknown as ILoginPayload;

        const reqHeaders = (req?.headers ?? {}) as Record<string, string | string[] | undefined>;
        const pickHeader = (key: string): string | undefined => {
          const value = reqHeaders[key];
          if (Array.isArray(value)) {
            return value[0];
          }
          return value;
        };

        const forwardedHeaders: Record<string, string> = {};
        const userAgent = pickHeader("user-agent");
        if (userAgent) {
          forwardedHeaders["user-agent"] = userAgent;
        }

        const forwardedFor = pickHeader("x-forwarded-for");
        if (forwardedFor) {
          forwardedHeaders["x-forwarded-for"] = forwardedFor;
        }

        const realIp = pickHeader("x-real-ip");
        if (realIp) {
          forwardedHeaders["x-real-ip"] = realIp;
        }

        try {
          const res = await POSTLogin({ identifier, method: method === "email" ? "email" : "username", password }, forwardedHeaders);

          return res.data as IAuthResponse & User;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message ?? error.message ?? "login failed";
            throw new Error(message);
          }
          throw error instanceof Error ? error : new Error("login failed");
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
