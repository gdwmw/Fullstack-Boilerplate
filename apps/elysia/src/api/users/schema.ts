import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const payloadSchema = z.object({
  email: z.email({ message: schemaMessage.string.email("email") }),
  imageId: z
    .number()
    .int({ message: schemaMessage.number.int("image id") })
    .positive({ message: schemaMessage.number.positive("image id") })
    .nullable()
    .optional(),
  name: z.string().min(3, { message: schemaMessage.string.min("name", 3) }),
  phone: z.string().min(10, { message: schemaMessage.string.min("phone", 10) }),
  role: z.enum(["user", "admin"], { message: schemaMessage.string.enum("role") }).optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export const paramSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("id") })
    .positive({ message: schemaMessage.number.positive("id") }),
});
