import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const querySchema = z.object({
  dateTime: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, { message: "dateTime must be in DD-MM-YYYY HH:mm format" })
    .optional(),
  level: z.enum(["INFO", "ERROR"], { message: schemaMessage.string.enum("level") }).optional(),
  limit: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("limit") })
    .positive({ message: schemaMessage.number.positive("limit") })
    .max(100, { message: schemaMessage.number.max("limit", 100) })
    .optional()
    .default(20),
  method: z.enum(["DELETE", "GET", "PATCH", "POST", "PUT"], { message: schemaMessage.string.enum("method") }).optional(),
  page: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("page") })
    .positive({ message: schemaMessage.number.positive("page") })
    .optional()
    .default(1),
  path: z.string().optional(),
  statusCode: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("statusCode") })
    .min(100)
    .max(599)
    .optional(),
});
