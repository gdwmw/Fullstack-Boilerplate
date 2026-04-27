import { AUTH_OMIT_FIELDS } from "@/src/constants";
import { prisma } from "@/src/libs";

import type { TPayloadSchema } from "./type";

export const service = {
  async delete(id: number) {
    return await prisma.users.delete({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

  async getAll() {
    return await prisma.users.findMany({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      orderBy: { id: "asc" },
    });
  },

  async getById(id: number) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: AUTH_OMIT_FIELDS,
      where: { id },
    });
  },

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
