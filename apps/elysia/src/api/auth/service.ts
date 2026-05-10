import { parseDurationToMs } from "@repo/utils";

import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { env } from "@/src/environment";
import { prisma, redis } from "@/src/libs";

import { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

const ACCESS_TOKEN_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;

interface IRefreshSessionBasePayload {
  expiresAt: Date;
  familyId: string;
  ipAddress?: string;
  token: string;
  userAgent?: string;
  userId: number;
}

interface ICreateRefreshSessionPayload extends IRefreshSessionBasePayload {
  jti: string;
  rotatedFromJti?: string;
}

interface IRotateRefreshSessionPayload extends IRefreshSessionBasePayload {
  currentJti: string;
  newJti: string;
  rotatedFromJti?: string;
}

const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const service = {
  ACCESS_TOKEN_EXPIRES_IN,

  async addToBlocklist(jti: string, expiresAt: Date) {
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await redis.set(`blocklist:${jti}`, "1", "EX", ttlSeconds);
    }
  },

  async changePassword(id: number, data: TChangePasswordSchema) {
    const res = await prisma.users.findUnique({
      where: { id },
    });

    if (!res?.password) return null;

    const isValidPassword = await Bun.password.verify(data.oldPassword, res.password);
    if (!isValidPassword) return null;

    const hashedNewPassword = await Bun.password.hash(data.newPassword);

    return await prisma.users.update({
      data: {
        password: hashedNewPassword,
      },
      omit: { ...AUTH_OMIT_FIELDS, imageId: true },
      where: { id },
    });
  },

  async createRefreshSession(data: ICreateRefreshSessionPayload) {
    const tokenHash = await hashToken(data.token);

    return await prisma.sessions.create({
      data: {
        expiresAt: data.expiresAt,
        familyId: data.familyId,
        ipAddress: data.ipAddress,
        jti: data.jti,
        rotatedFromJti: data.rotatedFromJti,
        tokenHash,
        userAgent: data.userAgent,
        userId: data.userId,
      },
    });
  },

  async getRefreshSessionByJti(jti: string) {
    return await prisma.sessions.findUnique({ where: { jti } });
  },

  getRefreshTokenMaxAgeSeconds() {
    return Math.floor(parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN) / 1000);
  },

  async getUserById(id: number) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: { ...AUTH_OMIT_FIELDS },
      where: { id },
    });
  },

  async isBlocklisted(jti: string) {
    const exists = await redis.exists(`blocklist:${jti}`);
    return exists === 1;
  },

  async isRefreshTokenHashMatch(token: string, expectedHash: string) {
    const tokenHash = await hashToken(token);
    return tokenHash === expectedHash;
  },

  async login(data: TLoginSchema) {
    const res = await prisma.users.findUnique({
      include: { image: true },
      where: data.method === "email" ? { email: data.identifier } : { username: data.identifier },
    });

    if (!res?.password) return null;

    const isValidPassword = await Bun.password.verify(data.password, res.password);
    if (!isValidPassword) return null;

    const { password: _password, ...user } = res;

    return user;
  },

  REFRESH_TOKEN_EXPIRES_IN,

  async register(data: TRegisterSchema) {
    const hashedPassword = await Bun.password.hash(data.password);

    return await prisma.users.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        phone: data.phone,
        role: data.role ?? "user",
        username: data.username,
      },
      omit: { ...AUTH_OMIT_FIELDS, imageId: true },
    });
  },

  async removeExpiredRefreshSessions() {
    return await prisma.sessions.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  async revokeRefreshFamily(userId: number, familyId: string) {
    return await prisma.sessions.updateMany({
      data: { revokedAt: new Date() },
      where: {
        familyId,
        revokedAt: null,
        userId,
      },
    });
  },

  async revokeRefreshSessionByJti(jti: string) {
    return await prisma.sessions.updateMany({
      data: { revokedAt: new Date() },
      where: {
        jti,
        revokedAt: null,
      },
    });
  },

  async rotateRefreshSession(data: IRotateRefreshSessionPayload) {
    const tokenHash = await hashToken(data.token);

    return await prisma.$transaction(async (tx) => {
      await tx.sessions.updateMany({
        data: {
          replacedByJti: data.newJti,
          revokedAt: new Date(),
        },
        where: {
          jti: data.currentJti,
          revokedAt: null,
        },
      });

      return await tx.sessions.create({
        data: {
          expiresAt: data.expiresAt,
          familyId: data.familyId,
          ipAddress: data.ipAddress,
          jti: data.newJti,
          rotatedFromJti: data.rotatedFromJti,
          tokenHash,
          userAgent: data.userAgent,
          userId: data.userId,
        },
      });
    });
  },

  /**
   * Atomically validate and rotate a refresh session.
   *
   * Performs the entire validation + rotation flow inside a single Postgres
   * transaction, including reuse-detection. If the same refresh jti is
   * presented twice (because it was already rotated), the entire family is
   * revoked and `REUSE_DETECTED` is returned.
   *
   * The conditional updateMany (`revokedAt: null`) makes the rotation step
   * itself atomic: only one concurrent caller can win, the other(s) get
   * `count === 0` and trigger family revocation.
   *
   * Caller is responsible for adding the old jti to the Redis blocklist
   * AFTER this transaction has committed successfully.
   */
  async rotateRefreshSessionAtomic(input: {
    incomingToken: string;
    newSession: {
      expiresAt: Date;
      ipAddress?: string;
      jti: string;
      token: string;
      userAgent?: string;
    };
    presentedJti: string;
  }): Promise<
    | {
        kind: "EXPIRED" | "HASH_MISMATCH" | "NOT_FOUND" | "REUSE_DETECTED";
      }
    | {
        kind: "OK";
        oldExpiresAt: Date;
        oldJti: string;
        userId: number;
      }
  > {
    const { incomingToken, newSession, presentedJti } = input;
    const incomingHash = await hashToken(incomingToken);
    const newTokenHash = await hashToken(newSession.token);

    return await prisma.$transaction(async (tx) => {
      const session = await tx.sessions.findUnique({ where: { jti: presentedJti } });

      if (!session) {
        return { kind: "NOT_FOUND" } as const;
      }

      // Constant-time-ish hash compare. If the cookie token does not hash to
      // the stored value something is being forged → revoke whole family.
      if (incomingHash !== session.tokenHash) {
        await tx.sessions.updateMany({
          data: { revokedAt: new Date() },
          where: { familyId: session.familyId, revokedAt: null, userId: session.userId },
        });
        return { kind: "HASH_MISMATCH" } as const;
      }

      // Reuse detection: a previously rotated/revoked jti is being presented.
      if (session.revokedAt !== null) {
        await tx.sessions.updateMany({
          data: { revokedAt: new Date() },
          where: { familyId: session.familyId, revokedAt: null, userId: session.userId },
        });
        return { kind: "REUSE_DETECTED" } as const;
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        await tx.sessions.update({
          data: { revokedAt: new Date() },
          where: { jti: session.jti },
        });
        return { kind: "EXPIRED" } as const;
      }

      // Atomic conditional rotate. If a concurrent transaction already rotated
      // this jti between findUnique and now, count will be 0 → reuse race.
      const rotated = await tx.sessions.updateMany({
        data: { replacedByJti: newSession.jti, revokedAt: new Date() },
        where: { jti: session.jti, revokedAt: null },
      });

      if (rotated.count === 0) {
        await tx.sessions.updateMany({
          data: { revokedAt: new Date() },
          where: { familyId: session.familyId, revokedAt: null, userId: session.userId },
        });
        return { kind: "REUSE_DETECTED" } as const;
      }

      await tx.sessions.create({
        data: {
          expiresAt: newSession.expiresAt,
          familyId: session.familyId,
          ipAddress: newSession.ipAddress,
          jti: newSession.jti,
          rotatedFromJti: session.jti,
          tokenHash: newTokenHash,
          userAgent: newSession.userAgent,
          userId: session.userId,
        },
      });

      return {
        kind: "OK",
        oldExpiresAt: session.expiresAt,
        oldJti: session.jti,
        userId: session.userId,
      } as const;
    });
  },
};
