import { z } from "zod";

import { schemaMessage } from "@/src/constants";

export const exampleSchema = z.object({
  name: z.string().min(3, { message: schemaMessage.string.min("Name", 3) }),
});

export type TExampleSchema = z.infer<typeof exampleSchema>;
