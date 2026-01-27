import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordStrength from "./PasswordStrength";
import { LoginSchema, RegisterSchema, getAuthErrorMessage } from "@/lib/validation/authSchemas";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const isRegister = mode === "register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate input using Zod
      const formData = isRegister ? { email, password, confirmPassword } : { email, password };

      const schema = isRegister ? RegisterSchema : LoginSchema;
      const validationResult = schema.safeParse(formData);

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

      // Call authentication API
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
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
          // Other errors (INVALID_CREDENTIALS, etc.)
          const errorMessage = getAuthErrorMessage(data.error);
          setFieldErrors({ email: errorMessage });
        }
        return;
      }

      // Success - redirect based on mode
      if (isRegister) {
        // After registration, redirect to login with confirmation message
        window.location.href = "/login?registered=true";
      } else {
        // After login, redirect to create page
        window.location.href = "/create";
      }
    } catch (err) {
      console.error("Auth error:", err);
      setFieldErrors({
        email: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRegister ? "Sign Up" : "Sign In"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "Create your account to start creating flashcards"
            : "Enter your credentials to access your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              name="email"
              data-test-id="auth-email-input"
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
              <p
                id={`${emailId}-error`}
                className="text-sm text-red-600 dark:text-red-500"
                data-test-id="auth-email-error"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              id={passwordId}
              name="password"
              data-test-id="auth-password-input"
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
              <p
                id={`${passwordId}-error`}
                className="text-sm text-red-600 dark:text-red-500"
                data-test-id="auth-password-error"
              >
                {fieldErrors.password}
              </p>
            )}
            {isRegister && password && !fieldErrors.password && <PasswordStrength password={password} />}
          </div>

          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor={confirmPasswordId}>Confirm Password</Label>
              <Input
                id={confirmPasswordId}
                name="confirmPassword"
                data-test-id="auth-confirm-password-input"
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
                <p
                  id={`${confirmPasswordId}-error`}
                  className="text-sm text-red-600 dark:text-red-500"
                  data-test-id="auth-confirm-password-error"
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading} data-test-id="auth-submit-button">
            {isLoading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
