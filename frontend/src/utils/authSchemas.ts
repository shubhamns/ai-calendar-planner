import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(255, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
