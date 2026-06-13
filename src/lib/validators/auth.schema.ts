import { z } from 'zod';

// ─── Shared rules ─────────────────────────────────────────────────────────────

const PASSWORD_SCHEMA = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be under 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const INDIAN_PHONE = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must start with 6–9 and be 10 digits)');

// ─── Register ─────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .regex(/^[\p{L}\s'-]+$/u, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be under 255 characters')
    .transform((s) => s.toLowerCase().trim()),
  phone: INDIAN_PHONE,
  password: PASSWORD_SCHEMA,
  role: z.enum(['host', 'vendor']),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email:    z.string().email('Invalid email address').transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required').max(128),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Forgot password ──────────────────────────────────────────────────────────

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').transform((s) => s.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// ─── Reset password ───────────────────────────────────────────────────────────

export const ResetPasswordSchema = z.object({
  token:    z.string().min(1, 'Reset token is required'),
  password: PASSWORD_SCHEMA,
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ─── Change password (authenticated) ─────────────────────────────────────────

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     PASSWORD_SCHEMA,
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: 'New password must differ from current password',
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ─── Backwards-compatible aliases (used by existing API routes) ───────────────

export const registerSchema = RegisterSchema;
export const loginSchema    = LoginSchema;
export const forgotPasswordSchema  = ForgotPasswordSchema;
export const resetPasswordSchema   = ResetPasswordSchema;
export const refreshSchema = z.object({});
