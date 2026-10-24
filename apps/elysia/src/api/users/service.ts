import { USER_OMIT_FIELDS } from "@repo/types";

import { prisma } from "@/src/libs/prisma";
import { createPaginationMeta } from "@/src/utils/pagination";

import { TPayloadSchema, TQuerySchema } from "./type";

export const service = {
  async delete(id: string) {
    return await prisma.users.delete({
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id },
    });
  },

  async getAll({ page, pageSize }: TQuerySchema) {
    const recordsToSkip = (page - 1) * pageSize;

    const [users, totalUsers] = await prisma.$transaction([
      prisma.users.findMany({
        include: { image: true },
        omit: USER_OMIT_FIELDS,
        orderBy: { id: "asc" },
        skip: recordsToSkip,
        take: pageSize,
      }),
      prisma.users.count(),
    ]);

    return {
      data: users,
      meta: createPaginationMeta({ page, pageSize, totalData: totalUsers }),
    };
  },

  async getById(id: string) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id },
    });
  },

  async update(userId: string, payload: TPayloadSchema) {
    const { imageId, ...userFields } = payload;

    return prisma.users.update({
      data: {
        ...userFields,
        imageId: imageId ?? null,
      },
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id: userId },
    });
  },
};
