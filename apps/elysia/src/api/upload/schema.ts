import { z } from "zod";

export const uploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size > 0, {
    message: "file cannot be empty",
  }),
});

export const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
});
