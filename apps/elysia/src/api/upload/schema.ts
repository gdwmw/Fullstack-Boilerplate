import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils";

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: "file cannot be empty",
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "file size must be 10 MB or less",
    }),
});

export const paramSchema = z.object({
  id: z.uuid(),
});

export const querySchema = paginationQuerySchema;
export type TQuerySchema = z.infer<typeof querySchema>;
