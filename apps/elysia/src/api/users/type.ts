import { z } from "zod";

import { paramSchema, payloadSchema } from "./schema";

export type TPayloadSchema = z.infer<typeof payloadSchema>;
export type TParamSchema = z.infer<typeof paramSchema>;
