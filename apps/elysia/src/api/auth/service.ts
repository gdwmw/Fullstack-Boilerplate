import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma, redis } from "@/src/libs";

import type { TChangePasswordSchema, TLoginSchema, TRegisterSchema } from "./type";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "30m";

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
      include: { image: true },
      omit: { ...AUTH_OMIT_FIELDS },
      where: { id },
    });
  },

  async isBlocklisted(jti: string) {
    const exists = await redis.exists(`blocklist:${jti}`);
    return exists === 1;
  },

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
};
