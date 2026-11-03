import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const profileSchema = z.object({
  email: z.email({ message: schemaMessage.string.email("email") }),
  image: z
    .any()
    .refine((files) => files instanceof FileList, "invalid file list")
    .refine((files) => files.length <= 1, "maximum 1 files")
    .refine((files) => Array.from(files).every((file) => (file as File).size <= 5 * 1024 * 1024), "maximum file size 5 MB")
    .optional(),
  name: z.string().min(3, { message: schemaMessage.string.min("name", 3) }),
  phone: z.string().min(10, { message: schemaMessage.string.min("phone", 10) }),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export type TProfileSchema = z.infer<typeof profileSchema>;
