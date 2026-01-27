import { useState, useId, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ForgotPasswordSchema, getAuthErrorMessage } from "@/lib/validation/authSchemas";
import type { ForgotPasswordInput } from "@/lib/validation/authSchemas";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const emailId = useId();

  // Check for error in URL params (from redirect after failed reset link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      const errorMessage = getAuthErrorMessage(errorParam);
      setUrlError(errorMessage);
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate input using Zod
      const formData: ForgotPasswordInput = { email };
      const validationResult = ForgotPasswordSchema.safeParse(formData);

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
      const response = await fetch("/api/auth/forgot-password", {
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
          setFieldErrors({ email: errorMessage });
        }
        return;
      }

      // Success - always show success message for security reasons
      // (don't reveal if email exists in database)
      setSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setFieldErrors({ email: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll send you an email with instructions to reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        {urlError && (
          <Alert className="mb-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <AlertDescription className="text-red-600 dark:text-red-500">{urlError}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert>
            <AlertDescription className="text-green-600 dark:text-green-500">
              <p className="font-medium mb-2">Check your email</p>
              <p>
                We&apos;ve sent password reset instructions to <strong>{email || "your email"}</strong>. Please check
                your inbox and follow the link to reset your password.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={emailId}>Email address</Label>
              <Input
                id={emailId}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
              />
              {fieldErrors.email && (
                <p id={`${emailId}-error`} className="text-sm text-red-600 dark:text-red-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
