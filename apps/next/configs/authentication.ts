import { parseDurationToMs } from "@repo/utils";
import { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

import { ILoginPayload, IUploadResponse, POSTLogin } from "@/src/utils";

const SESSION_EXPIRES_IN = process.env.NEXTAUTH_SESSION_EXPIRES_IN || "7d";
const ACCESS_TOKEN_EXPIRES_IN = process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN || "15m";

const parseDurationToSeconds = (value: string) => Math.floor(parseDurationToMs(value) / 1000);
const getSessionExpiry = (startedAt: number) => startedAt + parseDurationToMs(SESSION_EXPIRES_IN);

export const options: NextAuthOptions = {
  callbacks: {
    async jwt({ session, token, trigger, user }: { session?: Session; token: JWT; trigger?: "signIn" | "signUp" | "update"; user?: User }) {
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

        token.id = Number.parseInt(user.id);
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.phone = user.phone;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = sessionStartedAt + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);
        token.image = user.image as IUploadResponse | null;
        token.imageId = user.imageId;
        token.sessionExpiresAt = getSessionExpiry(sessionStartedAt);
        token.sessionStartedAt = sessionStartedAt;
        token.status = user.status;

        return token;
      }

      return token;
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = {
        id: token.id,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        email: token.email,
        image: token.image,
        imageId: token.imageId,
        name: token.name,
        phone: token.phone,
        role: token.role,
        sessionExpiresAt: token.sessionExpiresAt,
        sessionStartedAt: token.sessionStartedAt,
        status: token.status,
        username: token.username,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
