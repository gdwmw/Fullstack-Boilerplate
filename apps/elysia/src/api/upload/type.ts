import { z } from "zod";

import { paramSchema, querySchema, uploadSchema } from "./schema";

export type TUploadPayloadSchema = z.infer<typeof uploadSchema>;
export type TParamSchema = z.infer<typeof paramSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
