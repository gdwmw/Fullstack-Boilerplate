import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

export const querySchema = paginationQuerySchema.extend({
  actor: z.string().optional(),
  archiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: schemaMessage.string.format("archive date", "YYYY-MM-DD") })
    .optional(),
  level: z.enum(["INFO", "ERROR"], { message: schemaMessage.string.enum("level") }).optional(),
  method: z.enum(["DELETE", "GET", "PATCH", "POST", "PUT"], { message: schemaMessage.string.enum("method") }).optional(),
  path: z.string().optional(),
  statusCode: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("status code") })
    .min(100)
    .max(599)
    .optional(),
  timeFrom: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: schemaMessage.string.format("time from", "HH:mm") })
    .optional(),
  timeTo: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: schemaMessage.string.format("time to", "HH:mm") })
    .optional(),
});

export const archiveQuerySchema = paginationQuerySchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(9999).optional(),
});
