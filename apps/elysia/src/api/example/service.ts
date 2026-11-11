import { prisma } from "@/src/libs/prisma";
import { createPaginationMeta } from "@/src/utils/pagination";

import { TCreatePayloadSchema, TParamSchema, TQuerySchema, TUpdatePayloadSchema } from "./type";

export const service = {
  async create({ payload }: { payload: TCreatePayloadSchema }) {
    return prisma.examples.create({
      data: payload,
    });
  },

  async delete({ param }: { param: TParamSchema }) {
    return prisma.examples.delete({
      where: { id: param.id },
    });
  },

  async getAll({ query }: { query: TQuerySchema }) {
    const recordsToSkip = (query.page - 1) * query.pageSize;

    const [examples, totalExamples] = await prisma.$transaction([
      prisma.examples.findMany({
        orderBy: { id: "asc" },
        skip: recordsToSkip,
        take: query.pageSize,
      }),
      prisma.examples.count(),
    ]);

    return {
      data: examples,
      meta: createPaginationMeta({ page: query.page, pageSize: query.pageSize, totalData: totalExamples }),
    };
  },

  async getById({ param }: { param: TParamSchema }) {
    return prisma.examples.findUnique({
      where: { id: param.id },
    });
  },

  async update({ param, payload }: { param: TParamSchema; payload: TUpdatePayloadSchema }) {
    return prisma.examples.update({
      data: payload,
      where: { id: param.id },
    });
  },
};
