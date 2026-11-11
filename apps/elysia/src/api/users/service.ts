import { USER_OMIT_FIELDS } from "@repo/types";

import { prisma } from "@/src/libs/prisma";
import { createPaginationMeta } from "@/src/utils/pagination";

import { TParamSchema, TQuerySchema, TUpdatePayloadSchema } from "./type";

export const service = {
  async delete({ param }: { param: TParamSchema }) {
    return await prisma.users.delete({
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id: param.id },
    });
  },

  async getAll({ query }: { query: TQuerySchema }) {
    const recordsToSkip = (query.page - 1) * query.pageSize;

    const [users, totalUsers] = await prisma.$transaction([
      prisma.users.findMany({
        include: { image: true },
        omit: USER_OMIT_FIELDS,
        orderBy: { id: "asc" },
        skip: recordsToSkip,
        take: query.pageSize,
      }),
      prisma.users.count(),
    ]);

    return {
      data: users,
      meta: createPaginationMeta({ page: query.page, pageSize: query.pageSize, totalData: totalUsers }),
    };
  },

  async getById({ param }: { param: TParamSchema }) {
    return await prisma.users.findUnique({
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id: param.id },
    });
  },

  async update({ param, payload }: { param: TParamSchema; payload: TUpdatePayloadSchema }) {
    const { imageId, ...userFields } = payload;

    return prisma.users.update({
      data: {
        ...userFields,
        imageId: imageId ?? null,
      },
      include: { image: true },
      omit: USER_OMIT_FIELDS,
      where: { id: param.id },
    });
  },
};
