import { USER_OMIT_FIELDS } from "@repo/types";

import { prisma } from "@/src/libs/prisma";
import { redis } from "@/src/libs/redis";

import { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

export const service = {
  async addToBlocklist(jti: string, expiresAt: Date) {
    const remainingTtlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (remainingTtlSeconds <= 0) {
      return;
    }

    await redis.set(`blocklist:${jti}`, "1", "EX", remainingTtlSeconds);
  },

  async changePassword({ payload, userId }: { payload: TChangePasswordSchema; userId: string }) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user?.password) {
      return null;
    }

    const isCurrentPasswordValid = await Bun.password.verify(payload.oldPassword, user.password);

    if (!isCurrentPasswordValid) {
      return null;
    }

    const hashedNewPassword = await Bun.password.hash(payload.newPassword);

    return prisma.users.update({
      data: {
        password: hashedNewPassword,
      },
      omit: { ...USER_OMIT_FIELDS, imageId: true },
      where: { id: userId },
    });
  },

  async getUserById({ userId }: { userId: string }) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: { ...USER_OMIT_FIELDS },
      where: { id: userId },
    });
  },

  async isRefreshTokenBlocked(jti: string) {
    return (await redis.exists(`blocklist:${jti}`)) === 1;
  },

  async login({ payload }: { payload: TLoginSchema }) {
    const user = await prisma.users.findUnique({
      include: { image: true },
      where: payload.method === "email" ? { email: payload.identifier } : { username: payload.identifier },
    });

    if (!user?.password) {
      return null;
    }

    const isPasswordValid = await Bun.password.verify(payload.password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },

  async register({ payload }: { payload: TRegisterSchema }) {
    const hashedPassword = await Bun.password.hash(payload.password);

    return await prisma.users.create({
      data: {
        email: payload.email,
        name: payload.name,
        password: hashedPassword,
        phone: payload.phone,
        role: payload.role ?? "user",
        username: payload.username,
      },
      omit: { ...USER_OMIT_FIELDS, imageId: true },
    });
  },
};
