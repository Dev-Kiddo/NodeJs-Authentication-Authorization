import { z } from "zod";

export const userValidationSchema = z.object({
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(4),
  gender: z.enum(["M", "F"]),
});

export const loginValidationSchema = z.object({
  email: z.string(),
  password: z.string().min(4),
});

export const forgotValidationSchema = z.object({
  email: z.email(),
});

export const resetValidationSchema = z.object({
  password: z.string().min(4),
  confirmPassword: z.string().min(4),
});
