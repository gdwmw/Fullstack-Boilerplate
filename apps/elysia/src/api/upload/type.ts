import { z } from "zod";

import { querySchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;
