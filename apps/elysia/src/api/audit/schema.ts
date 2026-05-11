import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const querySchema = z.object({
  actor: z.string().optional(),
  archiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "archive date must be in YYYY-MM-DD format" })
    .optional(),
  level: z.enum(["INFO", "ERROR"], { message: schemaMessage.string.enum("level") }).optional(),
  method: z.enum(["DELETE", "GET", "PATCH", "POST", "PUT"], { message: schemaMessage.string.enum("method") }).optional(),
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
  path: z.string().optional(),
  statusCode: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("status code") })
    .min(100)
    .max(599)
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "time must be in hh:mm format" })
    .optional(),
});

export const archiveQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(9999).optional(),
});
