import { USER_OMIT_FIELDS } from "@repo/types";

import { prisma } from "@/src/libs";
import { createPaginationMeta } from "@/src/utils";

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
    const skip = (page - 1) * pageSize;
    const [data, total] = await prisma.$transaction([
      prisma.users.findMany({
        include: { image: true },
        omit: USER_OMIT_FIELDS,
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.users.count(),
    ]);

    return {
      data,
      meta: createPaginationMeta({ page, pageSize, totalData: total }),
    };
  },

  async getById(id: string) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id },
    });
  },

  async put(id: string, data: TPayloadSchema) {
    const { imageId, ...rest } = data;
    return await prisma.users.update({
      data: {
        ...rest,
        imageId: imageId ?? null,
      },
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id },
    });
  },
};
