import { MAX_FILE_SIZE, schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: schemaMessage.file.notEmpty("file"),
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: schemaMessage.file.maxSize("file", `"${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB"`),
    }),
});

export const paramSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
});

export const querySchema = paginationQuerySchema;
