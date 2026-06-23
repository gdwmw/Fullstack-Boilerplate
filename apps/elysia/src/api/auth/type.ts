import { changePasswordSchema, loginSchema, registerSchema } from "@repo/schemas";
import { z } from "zod";

export type TRegisterSchema = z.infer<typeof registerSchema>;
export type TLoginSchema = z.infer<ReturnType<typeof loginSchema>>;
export type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;
