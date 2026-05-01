import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const changePasswordSchema = z.object({
  confirmPassword: z.string().min(1, { message: schemaMessage.string.required("confirm password") }),
  newPassword: z
    .string()
    .min(8, { message: schemaMessage.string.min("new password", 8) })
    .max(72, { message: schemaMessage.string.max("new password", 72) })
    .regex(/^(?=.*[A-Z])/, { message: "new password must have at least 1 uppercase letter" })
    .regex(/^(?=.*\d)/, { message: "new password must have at least 1 number" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "new password must have at least 1 symbol (!@#$%^&*)" }),
  oldPassword: z.string().min(1, { message: schemaMessage.string.required("current password") }),
});

export type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;
