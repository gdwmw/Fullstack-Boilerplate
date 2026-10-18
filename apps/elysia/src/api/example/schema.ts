import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

export const payloadSchema = z.object({
  description: z.string().min(1, { message: schemaMessage.string.min("description", 1) }),
  label: z.string().min(1, { message: schemaMessage.string.min("label", 1) }),
});

export const paramSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
});

export const querySchema = paginationQuerySchema;
