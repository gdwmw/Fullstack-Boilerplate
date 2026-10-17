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

  async changePassword(userId: string, data: TChangePasswordSchema) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user?.password) {
      return null;
    }

    const isCurrentPasswordValid = await Bun.password.verify(data.oldPassword, user.password);

    if (!isCurrentPasswordValid) {
      return null;
    }

    const hashedNewPassword = await Bun.password.hash(data.newPassword);

    return prisma.users.update({
      data: {
        password: hashedNewPassword,
      },
      omit: { ...USER_OMIT_FIELDS, imageId: true },
      where: { id: userId },
    });
  },

  async getUserById(id: string) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: { ...USER_OMIT_FIELDS },
      where: { id },
    });
  },

  async isBlocklisted(jti: string) {
    const exists = await redis.exists(`blocklist:${jti}`);
    return exists === 1;
  },

  async login(data: TLoginSchema) {
    const user = await prisma.users.findUnique({
      include: { image: true },
      where: data.method === "email" ? { email: data.identifier } : { username: data.identifier },
    });

    if (!user?.password) {
      return null;
    }

    const isPasswordValid = await Bun.password.verify(data.password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },

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
      omit: { ...USER_OMIT_FIELDS, imageId: true },
    });
  },
};
