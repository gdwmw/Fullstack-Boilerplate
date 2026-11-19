import { z } from "zod";

import { createPayloadSchema, paramSchema, querySchema, updatePayloadSchema } from "./schema";

export type TCreatePayloadSchema = z.infer<typeof createPayloadSchema>;
export type TUpdatePayloadSchema = z.infer<typeof updatePayloadSchema>;
export type TParamSchema = z.infer<typeof paramSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
