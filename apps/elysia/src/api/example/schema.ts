import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

const commonSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
  description: z.string().min(1, { message: schemaMessage.string.min("description", 1) }),
  label: z.string().min(1, { message: schemaMessage.string.min("label", 1) }),
});

export const createPayloadSchema = commonSchema.pick({ description: true, label: true });

export const updatePayloadSchema = commonSchema.pick({ description: true });

export const paramSchema = commonSchema.pick({ id: true });

export const querySchema = paginationQuerySchema;
