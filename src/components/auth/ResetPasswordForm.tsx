import { useState, useId, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrength from "./PasswordStrength";
import { ResetPasswordSchema, getAuthErrorMessage } from "@/lib/validation/authSchemas";
import type { ResetPasswordInput } from "@/lib/validation/authSchemas";

interface ResetPasswordFormProps {
  accessToken?: string;
}

export default function ResetPasswordForm({ accessToken }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenErrorMessage, setTokenErrorMessage] = useState("");

  const passwordId = useId();
  const confirmPasswordId = useId();

  // Check if token exists on mount
  useEffect(() => {
    if (!accessToken) {
      setTokenError(true);
      setTokenErrorMessage("Invalid or missing reset link. Please request a new password reset.");
    }
  }, [accessToken]);

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

      const validatedData = ResetPasswordSchema.parse(formData);

      // TODO: Implement Supabase password reset
      // The access_token from URL is automatically used by Supabase
      // supabase.auth.updateUser({ password: validatedData.password })
      console.log("Password reset with new password");

      // Placeholder for actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success - redirect to login with success message
      window.location.href = "/login?reset=success";
    } catch (err) {
      if (err && typeof err === "object" && "errors" in err) {
        // Zod validation error
        const zodError = err as { errors: { path: string[]; message: string }[] };
        const errors: Record<string, string> = {};

        zodError.errors.forEach((error) => {
          const field = error.path[0] as string;
          const message = getAuthErrorMessage(error.message);
          errors[field] = message;
        });

        setFieldErrors(errors);
      }
      console.error("Password reset error:", err);
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
        {tokenError ? (
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-medium mb-2">Invalid reset link</p>
              <p className="mb-4">{tokenErrorMessage}</p>
              <Button variant="outline" size="sm" asChild>
                <a href="/forgot-password">Request new reset link</a>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
