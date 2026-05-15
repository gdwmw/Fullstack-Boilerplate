import { z } from "zod";

import { paramSchema, querySchema, uploadSchema } from "./schema";

export type TParamSchema = z.infer<typeof paramSchema>;
export type TQuerySchema = z.infer<typeof querySchema>;
export type TUploadSchema = z.infer<typeof uploadSchema>;
