import { parseDurationToMs } from "@repo/utils";

import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma, redis } from "@/src/libs";

import { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

// ---------------------------------------------------------------------------
// [1] Constants & helper types
// Konstanta durasi token dan kontrak payload session.
// ---------------------------------------------------------------------------

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

// [1.1] Hash token untuk penyimpanan aman di DB.
const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// ---------------------------------------------------------------------------
// [2] Auth service
// Seluruh logic otentikasi, session refresh, dan blocklist token.
// ---------------------------------------------------------------------------

export const service = {
  // [2.1] Expose TTL token agar bisa dipakai route/helper lain.
  ACCESS_TOKEN_EXPIRES_IN,

  // [2.2] Blocklist token sampai masa berlakunya habis.
  async addToBlocklist(jti: string, expiresAt: Date) {
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await redis.set(`blocklist:${jti}`, "1", "EX", ttlSeconds);
    }
  },

  // [2.3] Ganti password user jika password lama valid.
  async changePassword(id: number, data: TChangePasswordSchema) {
    const res = await prisma.users.findUnique({
      where: { id },
    });

    if (!res || !res.password) return null;

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

  // [2.4] Buat refresh session baru (token disimpan dalam bentuk hash).
  async createRefreshSession(data: ICreateRefreshSessionPayload) {
    const tokenHash = await hashToken(data.token);

    return await prisma.session.create({
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

  // [2.5] Ambil refresh session berdasarkan jti.
  async getRefreshSessionByJti(jti: string) {
    return await prisma.session.findUnique({ where: { jti } });
  },

  // [2.6] Konversi durasi refresh token menjadi max-age cookie (detik).
  getRefreshTokenMaxAgeSeconds() {
    return Math.floor(parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN) / 1000);
  },

  // [2.7] Ambil user by id untuk endpoint auth yang butuh profil user.
  async getUserById(id: number) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: { ...AUTH_OMIT_FIELDS },
      where: { id },
    });
  },

  // [2.8] Cek apakah jti token sudah diblok.
  async isBlocklisted(jti: string) {
    const exists = await redis.exists(`blocklist:${jti}`);
    return exists === 1;
  },

  // [2.9] Bandingkan token raw dari cookie dengan hash di DB.
  async isRefreshTokenHashMatch(token: string, expectedHash: string) {
    const tokenHash = await hashToken(token);
    return tokenHash === expectedHash;
  },

  // [2.10] Login dengan email/username + password.
  async login(data: TLoginSchema) {
    const res = await prisma.users.findUnique({
      include: { image: true },
      where: data.method === "email" ? { email: data.identifier } : { username: data.identifier },
    });

    if (!res || !res.password) return null;

    const isValidPassword = await Bun.password.verify(data.password, res.password);
    if (!isValidPassword) return null;

    const { password: _password, ...user } = res;

    return user;
  },

  // [2.11] Expose TTL refresh token untuk helper cookie di route.
  REFRESH_TOKEN_EXPIRES_IN,

  // [2.12] Register user baru dengan password ter-hash.
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

  // [2.13] Bersihkan refresh session yang sudah kedaluwarsa.
  async removeExpiredRefreshSessions() {
    return await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  // [2.14] Revoke seluruh session dalam satu token family milik user.
  async revokeRefreshFamily(userId: number, familyId: string) {
    return await prisma.session.updateMany({
      data: { revokedAt: new Date() },
      where: {
        familyId,
        revokedAt: null,
        userId,
      },
    });
  },

  // [2.15] Revoke refresh session aktif berdasarkan jti.
  async revokeRefreshSessionByJti(jti: string) {
    return await prisma.session.updateMany({
      data: { revokedAt: new Date() },
      where: {
        jti,
        revokedAt: null,
      },
    });
  },

  // [2.16] Rotasi refresh session: revoke session lama lalu buat session baru.
  async rotateRefreshSession(data: IRotateRefreshSessionPayload) {
    const tokenHash = await hashToken(data.token);

    return await prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        data: {
          replacedByJti: data.newJti,
          revokedAt: new Date(),
        },
        where: {
          jti: data.currentJti,
          revokedAt: null,
        },
      });

      return await tx.session.create({
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
