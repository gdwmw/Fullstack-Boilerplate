import { z } from "zod";

import { schemaMessage } from "@/src/constants";

export const registerSchema = z.object({
  email: z.email({ message: schemaMessage.string.email("Email") }),
  name: z.string().min(3, { message: schemaMessage.string.min("Name", 3) }),
  password: z
    .string()
    .min(8, { message: schemaMessage.string.min("Password", 8) })
    .max(72, { message: schemaMessage.string.max("Password", 72) })
    .regex(/^(?=.*[A-Z])/, { message: "Password must have at least 1 uppercase letter" })
    .regex(/^(?=.*\d)/, { message: "Password must have at least 1 number" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "Password must have at least 1 symbol (!@#$%^&*)" }),
  phone: z.string().min(10, { message: schemaMessage.string.min("Phone", 10) }),
  role: z
    .enum(["user", "admin"], { message: schemaMessage.string.enum("Role") })
    .default("user")
    .optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("Username", 4) }),
});

export const loginSchema = (method: string) =>
  z.object({
    identifier:
      method === "email"
        ? z.email({ message: schemaMessage.string.email(method) })
        : z.string().min(1, { message: schemaMessage.string.required(method) }),
    method: z.enum(["email", "username"], { message: schemaMessage.string.enum("Method") }),
    password: z.string().min(1, { message: schemaMessage.string.required("Password") }),
  });

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, { message: schemaMessage.string.required("Refresh token") }),
});

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: schemaMessage.string.min("Password", 8) })
    .max(72, { message: schemaMessage.string.max("Password", 72) })
    .regex(/^(?=.*[A-Z])/, { message: "Password must have at least 1 uppercase letter" })
    .regex(/^(?=.*\d)/, { message: "Password must have at least 1 number" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "Password must have at least 1 symbol (!@#$%^&*)" }),
  oldPassword: z.string().min(1, { message: schemaMessage.string.required("Current password") }),
});
