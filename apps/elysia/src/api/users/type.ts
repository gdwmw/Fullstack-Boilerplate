import { z } from "zod";

import { querySchema, updatePayloadSchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;
export type TUpdatePayloadSchema = z.infer<typeof updatePayloadSchema>;
