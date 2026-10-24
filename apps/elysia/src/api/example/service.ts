import { prisma } from "@/src/libs/prisma";
import { createPaginationMeta } from "@/src/utils/pagination";

import { TPayloadSchema, TQuerySchema } from "./type";

export const service = {
  async create(payload: TPayloadSchema) {
    return prisma.examples.create({
      data: payload,
    });
  },

  async delete(id: string) {
    return prisma.examples.delete({
      where: { id },
    });
  },

  async getAll({ page, pageSize }: TQuerySchema) {
    const recordsToSkip = (page - 1) * pageSize;

    const [examples, totalExamples] = await prisma.$transaction([
      prisma.examples.findMany({
        orderBy: { id: "asc" },
        skip: recordsToSkip,
        take: pageSize,
      }),
      prisma.examples.count(),
    ]);

    return {
      data: examples,
      meta: createPaginationMeta({ page, pageSize, totalData: totalExamples }),
    };
  },

  async getById(id: string) {
    return prisma.examples.findUnique({
      where: { id },
    });
  },

  async update(id: string, payload: TPayloadSchema) {
    return prisma.examples.update({
      data: payload,
      where: { id },
    });
  },
};
