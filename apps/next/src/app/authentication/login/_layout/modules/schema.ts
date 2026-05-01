import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const loginSchema = (method: boolean) =>
  z.object({
    identifier: method
      ? z.email({ message: schemaMessage.string.email("email") })
      : z.string().min(1, { message: schemaMessage.string.required("username") }),
    password: z.string().min(1, { message: schemaMessage.string.required("password") }),
  });

export type TLoginSchema = z.infer<ReturnType<typeof loginSchema>>;
