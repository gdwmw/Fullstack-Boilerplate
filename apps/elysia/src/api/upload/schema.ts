import { MAX_FILE_SIZE, schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

const commonSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: schemaMessage.file.notEmpty("file"),
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: schemaMessage.file.maxSize("file", `"${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB"`),
    }),
});

export const uploadSchema = commonSchema.pick({ file: true });

export const paramSchema = commonSchema.pick({ id: true });

export const querySchema = paginationQuerySchema;
