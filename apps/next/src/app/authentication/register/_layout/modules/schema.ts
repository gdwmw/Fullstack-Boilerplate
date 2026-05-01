import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const registerSchema = z.object({
  confirmPassword: z.string().min(1, { message: schemaMessage.string.required("confirm password") }),
  email: z.email({ message: schemaMessage.string.email("email") }),
  name: z.string().min(3, { message: schemaMessage.string.min("name", 3) }),
  password: z
    .string()
    .min(8, { message: schemaMessage.string.min("password", 8) })
    .max(72, { message: schemaMessage.string.max("password", 72) })
    .regex(/^(?=.*[A-Z])/, { message: "password must have at least 1 uppercase letter" })
    .regex(/^(?=.*\d)/, { message: "password must have at least 1 number" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "password must have at least 1 symbol (!@#$%^&*)" }),
  phone: z.string().min(10, { message: schemaMessage.string.min("phone", 10) }),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export type TRegisterSchema = z.infer<typeof registerSchema>;
