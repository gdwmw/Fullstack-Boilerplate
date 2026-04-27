import { z } from "zod";

import { schemaMessage } from "@/src/constants";

export const payloadSchema = z.object({
  email: z.email({ message: schemaMessage.string.email("Email") }),
  imageId: z
    .number()
    .int({ message: schemaMessage.number.int("Image ID") })
    .positive({ message: schemaMessage.number.positive("Image ID") })
    .nullable()
    .optional(),
  name: z.string().min(3, { message: schemaMessage.string.min("Name", 3) }),
  phone: z.string().min(10, { message: schemaMessage.string.min("Phone", 10) }),
  role: z.enum(["user", "admin"], { message: schemaMessage.string.enum("Role") }).optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("Username", 4) }),
});

export const paramSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: schemaMessage.number.int("ID") })
    .positive({ message: schemaMessage.number.positive("ID") }),
});
