import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrength from "./PasswordStrength";
import { ResetPasswordSchema, getAuthErrorMessage } from "@/lib/validation/authSchemas";
import type { ResetPasswordInput } from "@/lib/validation/authSchemas";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const passwordId = useId();
  const confirmPasswordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate input using Zod
      const formData: ResetPasswordInput = {
        password,
        confirmPassword,
      };

      const validationResult = ResetPasswordSchema.safeParse(formData);

      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path[0] as string;
          const message = getAuthErrorMessage(error.message);
          errors[field] = message;
        });
        setFieldErrors(errors);
        return;
      }

      // Call API endpoint
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (data.error === "VALIDATION_ERROR" && data.details) {
          // Server-side validation errors
          const errors: Record<string, string> = {};
          data.details.forEach((error: { path: string[]; message: string }) => {
            const field = error.path[0] as string;
            const message = getAuthErrorMessage(error.message);
            errors[field] = message;
          });
          setFieldErrors(errors);
        } else {
          // Other errors
          const errorMessage = getAuthErrorMessage(data.error);
          setFieldErrors({ password: errorMessage });
        }
        return;
      }

      // Success - redirect to login with success message
      window.location.href = "/login?reset=success";
    } catch (err) {
      console.error("Password reset error:", err);
      setFieldErrors({ password: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={passwordId}>New Password</Label>
            <Input
              id={passwordId}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
            />
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className="text-sm text-red-600 dark:text-red-500">
                {fieldErrors.password}
              </p>
            )}
            {password && !fieldErrors.password && <PasswordStrength password={password} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
            <Input
              id={confirmPasswordId}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p id={`${confirmPasswordId}-error`} className="text-sm text-red-600 dark:text-red-500">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
