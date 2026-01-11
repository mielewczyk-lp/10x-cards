import { z } from "zod";

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 */
const passwordValidation = z
  .string({
    required_error: "PASSWORD_REQUIRED",
    invalid_type_error: "PASSWORD_INVALID",
  })
  .min(8, { message: "PASSWORD_TOO_SHORT" })
  .regex(/[a-zA-Z]/, { message: "PASSWORD_MISSING_LETTER" })
  .regex(/[0-9]/, { message: "PASSWORD_MISSING_NUMBER" });

/**
 * Email validation schema
 * Validates RFC 5322 compliant email addresses
 */
const emailValidation = z
  .string({
    required_error: "EMAIL_REQUIRED",
    invalid_type_error: "EMAIL_INVALID",
  })
  .email({ message: "EMAIL_INVALID" })
  .trim();

/**
 * Validation schema for login
 * Validates:
 * - email: required, valid email format
 * - password: required, minimum 8 characters
 */
export const LoginSchema = z.object({
  email: emailValidation,
  password: z
    .string({
      required_error: "PASSWORD_REQUIRED",
      invalid_type_error: "PASSWORD_INVALID",
    })
    .min(1, { message: "PASSWORD_REQUIRED" }),
});

/**
 * Validation schema for registration
 * Validates:
 * - email: required, valid email format
 * - password: required, meets password requirements
 * - confirmPassword: required, must match password
 */
export const RegisterSchema = z
  .object({
    email: emailValidation,
    password: passwordValidation,
    confirmPassword: z.string({
      required_error: "CONFIRM_PASSWORD_REQUIRED",
      invalid_type_error: "CONFIRM_PASSWORD_INVALID",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });

/**
 * Validation schema for password change
 * Validates:
 * - currentPassword: required
 * - newPassword: required, meets password requirements
 * - confirmNewPassword: required, must match newPassword
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: "CURRENT_PASSWORD_REQUIRED",
        invalid_type_error: "CURRENT_PASSWORD_INVALID",
      })
      .min(1, { message: "CURRENT_PASSWORD_REQUIRED" }),
    newPassword: passwordValidation,
    confirmNewPassword: z.string({
      required_error: "CONFIRM_NEW_PASSWORD_REQUIRED",
      invalid_type_error: "CONFIRM_NEW_PASSWORD_INVALID",
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmNewPassword"],
  });

/**
 * Validation schema for forgot password
 * Validates:
 * - email: required, valid email format
 */
export const ForgotPasswordSchema = z.object({
  email: emailValidation,
});

/**
 * Validation schema for password reset
 * Validates:
 * - password: required, meets password requirements
 * - confirmPassword: required, must match password
 */
export const ResetPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string({
      required_error: "CONFIRM_PASSWORD_REQUIRED",
      invalid_type_error: "CONFIRM_PASSWORD_INVALID",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });

/**
 * Type inference from the schemas
 */
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Error code to user-friendly message mapping
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Field validation errors
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_INVALID: "Invalid password format",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  PASSWORD_MISSING_LETTER: "Password must contain at least one letter",
  PASSWORD_MISSING_NUMBER: "Password must contain at least one number",
  CONFIRM_PASSWORD_REQUIRED: "Please confirm your password",
  CONFIRM_PASSWORD_INVALID: "Invalid password confirmation",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  CURRENT_PASSWORD_INVALID: "Invalid current password",
  CONFIRM_NEW_PASSWORD_REQUIRED: "Please confirm your new password",
  CONFIRM_NEW_PASSWORD_INVALID: "Invalid new password confirmation",

  // Supabase auth errors
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_ALREADY_EXISTS: "An account with this email already exists",
  TOO_MANY_REQUESTS: "Too many attempts. Please try again later",
  WEAK_PASSWORD: "Password is too weak. Please choose a stronger password",
  EMAIL_NOT_CONFIRMED: "Please confirm your email address",
  EMAIL_NOT_FOUND: "No account found with this email address",
  INVALID_TOKEN: "This reset link is invalid or has expired",
  TOKEN_EXPIRED: "This reset link has expired. Please request a new one",

  // Password change/reset errors
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  PASSWORD_SAME_AS_OLD: "New password must be different from your current password",
  PASSWORD_UPDATE_FAILED: "Failed to update password. Please try again",
  RESET_EMAIL_FAILED: "Failed to send reset email. Please try again",
  PASSWORD_RESET_FAILED: "Failed to reset password. Please try again",
  INVALID_OR_EXPIRED_TOKEN: "This reset link is invalid or has expired. Please request a new one",
  SESSION_EXPIRED: "Your session has expired. Please log in again",
  UNAUTHORIZED: "You must be logged in to perform this action",

  // API errors
  VALIDATION_ERROR: "Please check your input and try again",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later",
};

/**
 * Helper function to get user-friendly error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  return AUTH_ERROR_MESSAGES[errorCode] || "An error occurred. Please try again";
}
