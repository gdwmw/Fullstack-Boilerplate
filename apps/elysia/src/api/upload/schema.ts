import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

const FILE_MAX_SIZE = 10 * 1024 * 1024;

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: schemaMessage.file.notEmpty("file"),
    })
    .refine((file) => file.size <= FILE_MAX_SIZE, {
      message: schemaMessage.file.maxSize("file", "10 MB"),
    }),
});

export const paramSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
});

export const querySchema = paginationQuerySchema;
