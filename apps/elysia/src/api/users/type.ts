import { z } from "zod";

import { paramSchema, querySchema, updatePayloadSchema } from "./schema";

export type TUpdatePayloadSchema = z.infer<typeof updatePayloadSchema>;
export type TParamSchema = z.infer<typeof paramSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
