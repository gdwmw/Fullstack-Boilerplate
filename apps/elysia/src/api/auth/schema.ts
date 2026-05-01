import { z } from "zod";

import { schemaMessage } from "@/src/constants";

export const registerSchema = z.object({
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
  role: z
    .enum(["user", "admin"], { message: schemaMessage.string.enum("role") })
    .default("user")
    .optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export const loginSchema = (method: string) =>
  z.object({
    identifier:
      method === "email"
        ? z.email({ message: schemaMessage.string.email(method) })
        : z.string().min(1, { message: schemaMessage.string.required(method) }),
    method: z.enum(["email", "username"], { message: schemaMessage.string.enum("method") }),
    password: z.string().min(1, { message: schemaMessage.string.required("password") }),
  });

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: schemaMessage.string.min("password", 8) })
    .max(72, { message: schemaMessage.string.max("password", 72) })
    .regex(/^(?=.*[A-Z])/, { message: "password must have at least 1 uppercase letter" })
    .regex(/^(?=.*\d)/, { message: "password must have at least 1 number" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "password must have at least 1 symbol (!@#$%^&*)" }),
  oldPassword: z.string().min(1, { message: schemaMessage.string.required("current password") }),
});
