import { z } from "zod";

import { paramSchema, payloadSchema, querySchema } from "./schema";

export type TPayloadSchema = z.infer<typeof payloadSchema>;
export type TParamSchema = z.infer<typeof paramSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
