import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma } from "@/src/libs";

import type { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const parseDurationToMs = (value: string) => {
  const parsed = /^([0-9]+)(ms|s|m|h|d)$/i.exec(value.trim());

  if (!parsed) {
    throw new Error("Invalid token expiration format. Use: 15m, 7d, 3600s");
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

const refreshTokenExpiresAt = () => {
  const durationInMs = parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN);
  return new Date(Date.now() + durationInMs);
};

const sanitize = (user: { email: string; id: number; name: string; phone: string; role: string; username: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
  username: user.username,
});

export const service = {
  ACCESS_TOKEN_EXPIRES_IN,
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

  async getUserById(id: number) {
    return await prisma.users.findUnique({
      omit: { ...AUTH_OMIT_FIELDS, imageId: true },
      where: { id },
    });
  },

  async login(data: TLoginSchema) {
    const res = await prisma.users.findUnique({
      include: { image: true },
      where: data.method === "email" ? { email: data.identifier } : { username: data.identifier },
    });

    if (!res || !res.password) return null;

    const isValidPassword = await Bun.password.verify(data.password, res.password);
    if (!isValidPassword) return null;

    const { password: _password, refreshToken: _refreshToken, refreshTokenExpiresAt: _refreshTokenExpiresAt, ...user } = res;

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

  async revokeRefreshToken(userId: number) {
    await prisma.users.update({
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
      where: { id: userId },
    });
  },

  async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await Bun.password.hash(refreshToken);

    await prisma.users.update({
      data: {
        refreshToken: hashedRefreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt(),
      },
      where: { id: userId },
    });
  },

  async validateRefreshToken(userId: number, refreshToken: string) {
    const res = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!res || !res.refreshToken || !res.refreshTokenExpiresAt) return null;
    if (res.refreshTokenExpiresAt.getTime() < Date.now()) return null;

    const isValidRefreshToken = await Bun.password.verify(refreshToken, res.refreshToken);

    if (!isValidRefreshToken) return null;

    return sanitize(res);
  },
};
