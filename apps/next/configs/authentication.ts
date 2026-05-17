import { IErrorResponse } from "@repo/types";
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
          id: user.id,
          accessToken: u.accessToken,
          accessTokenExpiresAt: sessionStartedAt + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN),
          createdAt: u.createdAt,
          email: u.email,
          image: u.image ?? null,
          imageId: u.imageId ?? null,
          name: u.name,
          phone: u.phone,
          refreshToken: u.refreshToken,
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
      async authorize(credentials: Record<string, string> | undefined): Promise<null | User> {
        if (!credentials) {
          return null;
        }

        const { identifier, method, password } = credentials as unknown as ILoginPayload;

        try {
          const res = await POSTLogin({ identifier, method: method === "email" ? "email" : "username", password });

          return res.data as IAuthResponse & User;
        } catch (error) {
          if (axios.isAxiosError<IErrorResponse>(error)) {
            const message = error.response?.data?.message;
            throw new Error(message ?? "authentication failed. please try again.");
          }

          throw new Error("authentication failed. please try again.");
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
