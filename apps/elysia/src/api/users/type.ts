import { z } from "zod";

import { payloadSchema, querySchema } from "./schema";

export type TPayloadSchema = z.infer<typeof payloadSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
