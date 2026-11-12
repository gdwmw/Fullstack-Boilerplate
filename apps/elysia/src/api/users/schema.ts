import { schemaMessage } from "@repo/constants";
import { z } from "zod";

import { paginationQuerySchema } from "@/src/utils/pagination";

const commonSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
  email: z.email({ message: schemaMessage.string.email("email") }),
  imageId: z
    .uuid({ message: schemaMessage.string.uuid("image id") })
    .nullable()
    .optional(),
  name: z.string().min(3, { message: schemaMessage.string.min("name", 3) }),
  phone: z.string().min(10, { message: schemaMessage.string.min("phone", 10) }),
  role: z.enum(["user", "admin"], { message: schemaMessage.string.enum("role") }).optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export const updatePayloadSchema = commonSchema.pick({ email: true, imageId: true, name: true, phone: true, role: true, username: true });

export const paramSchema = commonSchema.pick({ id: true });

export const querySchema = paginationQuerySchema;
