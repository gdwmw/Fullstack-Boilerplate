import { parseDurationToMs } from "@repo/utils";
import { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

import { IAuthResponse, ILoginPayload, POSTLogin } from "@/src/utils";

const SESSION_EXPIRES_IN = process.env.NEXTAUTH_SESSION_EXPIRES_IN || "7d";
const ACCESS_TOKEN_EXPIRES_IN = process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN || "15m";

const parseDurationToSeconds = (value: string) => Math.floor(parseDurationToMs(value) / 1000);
const getSessionExpiry = (startedAt: number) => startedAt + parseDurationToMs(SESSION_EXPIRES_IN);

export const options: NextAuthOptions = {
  callbacks: {
    async jwt({ session, token, trigger, user }) {
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          ...session.user,
          sessionExpiresAt: token.sessionExpiresAt,
          sessionStartedAt: token.sessionStartedAt,
        };
      }

      if (user) {
        const sessionStartedAt = Date.now();
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
          sessionExpiresAt: getSessionExpiry(sessionStartedAt),
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
