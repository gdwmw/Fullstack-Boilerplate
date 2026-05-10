import { schemaMessage } from "@repo/constants";
import { z } from "zod";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

const passwordPolicySchema = (label: string) =>
  z
    .string()
    .min(PASSWORD_MIN, { message: schemaMessage.string.min(label, PASSWORD_MIN) })
    .max(PASSWORD_MAX, { message: schemaMessage.string.max(label, PASSWORD_MAX) })
    .regex(/^(?=.*[A-Z])/, { message: `${label} must have at least 1 uppercase letter` })
    .regex(/^(?=.*\d)/, { message: `${label} must have at least 1 number` })
    .regex(/^(?=.*[!@#$%^&*])/, { message: `${label} must have at least 1 symbol (!@#$%^&*)` });

export const registerSchema = z.object({
  email: z.email({ message: schemaMessage.string.email("email") }),
  name: z.string().min(3, { message: schemaMessage.string.min("name", 3) }),
  password: passwordPolicySchema("password"),
  phone: z.string().min(10, { message: schemaMessage.string.min("phone", 10) }),
  role: z
    .enum(["user", "admin"], { message: schemaMessage.string.enum("role") })
    .default("user")
    .optional(),
  username: z.string().min(4, { message: schemaMessage.string.min("username", 4) }),
});

export const registerFormSchema = registerSchema.extend({
  confirmPassword: z.string().min(1, { message: schemaMessage.string.required("confirm password") }),
});

export const loginSchema = (method: "email" | "username") =>
  z.object({
    identifier:
      method === "email"
        ? z.email({ message: schemaMessage.string.email("email") })
        : z.string().min(1, { message: schemaMessage.string.required("username") }),
    method: z.enum(["email", "username"], { message: schemaMessage.string.enum("method") }),
    password: z.string().min(1, { message: schemaMessage.string.required("password") }),
  });

export const loginFormSchema = (isEmail: boolean) =>
  z.object({
    identifier: isEmail
      ? z.email({ message: schemaMessage.string.email("email") })
      : z.string().min(1, { message: schemaMessage.string.required("username") }),
    password: z.string().min(1, { message: schemaMessage.string.required("password") }),
  });

export const changePasswordSchema = z.object({
  newPassword: passwordPolicySchema("new password"),
  oldPassword: z.string().min(1, { message: schemaMessage.string.required("current password") }),
});

export const changePasswordFormSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, { message: schemaMessage.string.required("confirm password") }),
});

export type TRegisterSchema = z.infer<typeof registerSchema>;
export type TRegisterFormSchema = z.infer<typeof registerFormSchema>;
export type TLoginSchema = z.infer<ReturnType<typeof loginSchema>>;
export type TLoginFormSchema = z.infer<ReturnType<typeof loginFormSchema>>;
export type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type TChangePasswordFormSchema = z.infer<typeof changePasswordFormSchema>;
