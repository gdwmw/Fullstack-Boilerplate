import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils";

export const querySchema = paginationQuerySchema.extend({
  actor: z.string().optional(),
  archiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "archive date must be in YYYY-MM-DD format" })
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
    .regex(/^\d{2}:\d{2}$/, { message: "time from must be in hh:mm format" })
    .optional(),
  timeTo: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "time to must be in hh:mm format" })
    .optional(),
});

export const archiveQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(9999).optional(),
});
