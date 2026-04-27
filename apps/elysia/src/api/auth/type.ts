import { z } from "zod";

import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "./schema";

export type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type TLoginSchema = z.infer<ReturnType<typeof loginSchema>>;
export type TRefreshSchema = z.infer<typeof refreshSchema>;
export type TRegisterSchema = z.infer<typeof registerSchema>;
