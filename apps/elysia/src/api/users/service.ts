import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma } from "@/src/libs";

import { TPayloadSchema } from "./type";

// ---------------------------------------------------------------------------
// [1] Service utama users
// Semua logic utama users CRUD
// ---------------------------------------------------------------------------

export const service = {
  // [1.1] Hapus user
  async delete(id: number) {
    return await prisma.users.delete({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

  // [1.2] Ambil semua user
  async getAll() {
    return await prisma.users.findMany({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      orderBy: { id: "asc" },
    });
  },

  // [1.3] Ambil user by id
  async getById(id: number) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

  // [1.4] Update user
  async put(id: number, data: TPayloadSchema) {
    const { imageId, ...rest } = data;
    return await prisma.users.update({
      data: {
        ...rest,
        imageId: imageId ?? null,
      },
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },
};
