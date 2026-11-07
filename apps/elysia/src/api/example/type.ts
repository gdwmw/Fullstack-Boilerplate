import { z } from "zod";

import { createPayloadSchema, querySchema, updatePayloadSchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;
export type TCreatePayloadSchema = z.infer<typeof createPayloadSchema>;
export type TUpdatePayloadSchema = z.infer<typeof updatePayloadSchema>;
