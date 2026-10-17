import { z } from "zod";

import { payloadSchema, querySchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;
export type TPayloadSchema = z.infer<typeof payloadSchema>;
