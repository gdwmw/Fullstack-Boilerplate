import { schemaMessage } from "@repo/constants";
import { z } from "zod";

const commonExampleSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { message: schemaMessage.string.required("description") }),
  name: z.string().min(3, { message: schemaMessage.string.min("Name", 3) }),
});

export const createExamplePayloadSchema = commonExampleSchema
  .pick({ name: true })
  .extend({ description: commonExampleSchema.shape.description.optional() });

export const updateExamplePayloadSchema = commonExampleSchema.pick({ description: true, name: true });

export type TCreateExamplePayloadSchema = z.infer<typeof createExamplePayloadSchema>;
export type TUpdateExamplePayloadSchema = z.infer<typeof updateExamplePayloadSchema>;
