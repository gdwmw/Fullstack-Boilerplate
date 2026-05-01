import { parseDurationToMs } from "@repo/utils";

import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma, redis } from "@/src/libs";

import { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

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
};
