import { UserRole } from "@prisma/client";
import * as z from "zod";
export const SettingsSchema = z.object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.optional(z.nativeEnum(UserRole)), 
    email: z.optional(z.string().email()),
    password: z.union([z.string().min(6), z.literal("")]).optional(),
    newPassword: z.union([z.string().min(6), z.literal("")]).optional()
  })
  .refine((data) => {
    if (data.password || data.newPassword) {
      return !!data.password && !!data.newPassword;
    }
    return true;
  }, {
    message: "Both password fields are required when changing password",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && data.newPassword.length > 0) {
      return data.newPassword.length >= 6;
    }
    return true;
  }, {
    message: "New password must be at least 6 characters",
    path: ["newPassword"]
  });
export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required"
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required"
  }),
  name: z.string().min(1, {
    message: "Name is required",
  })
});