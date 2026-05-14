import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export interface IPaginationMeta {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
}

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("page") })
    .positive({ message: schemaMessage.number.positive("page") })
    .optional()
    .default(1),
  pageSize: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("page size") })
    .positive({ message: schemaMessage.number.positive("page size") })
    .max(100, { message: schemaMessage.number.max("page size", 100) })
    .optional()
    .default(50),
});

export const createPaginationMeta = ({ page, pageSize, totalData }: Omit<IPaginationMeta, "totalPage">): IPaginationMeta => ({
  page,
  pageSize,
  totalData,
  totalPage: Math.ceil(totalData / pageSize),
});

export const paginateArray = <T>({ items, page, pageSize }: { items: T[]; page: number; pageSize: number }) => {
  const totalData = items.length;
  const skip = (page - 1) * pageSize;

  return {
    data: items.slice(skip, skip + pageSize),
    meta: createPaginationMeta({ page, pageSize, totalData }),
  };
};
