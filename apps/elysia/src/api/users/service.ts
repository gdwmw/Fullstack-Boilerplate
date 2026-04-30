import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma } from "@/src/libs";

import { TPayloadSchema } from "./type";

// ---------------------------------------------------------------------------
// [1] Users primary service
// All core users CRUD logic
// ---------------------------------------------------------------------------

export const service = {
  // [1.1] Delete a user
  async delete(id: number) {
    return await prisma.users.delete({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

  // [1.2] Get all users
  async getAll() {
    return await prisma.users.findMany({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      orderBy: { id: "asc" },
    });
  },

  // [1.3] Get a user by id
  async getById(id: number) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

  // [1.4] Update a user
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
