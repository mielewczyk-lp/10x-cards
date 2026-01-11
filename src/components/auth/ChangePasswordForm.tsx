import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrength from "./PasswordStrength";
import { ChangePasswordSchema, getAuthErrorMessage } from "@/lib/validation/authSchemas";
import type { ChangePasswordInput } from "@/lib/validation/authSchemas";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmNewPasswordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate input using Zod
      const formData: ChangePasswordInput = {
        currentPassword,
        newPassword,
        confirmNewPassword,
      };

      const validatedData = ChangePasswordSchema.parse(formData);

      // TODO: Implement Supabase password update
      console.log("Password change attempt");

      // Placeholder for actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
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
      console.error("Password change error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="password-heading">Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <Alert>
              <AlertDescription className="text-green-600 dark:text-green-500">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor={currentPasswordId}>Current Password</Label>
            <Input
              id={currentPasswordId}
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.currentPassword) {
                  setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.currentPassword}
              aria-describedby={fieldErrors.currentPassword ? `${currentPasswordId}-error` : undefined}
            />
            {fieldErrors.currentPassword && (
              <p id={`${currentPasswordId}-error`} className="text-sm text-red-600 dark:text-red-500">
                {fieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={newPasswordId}>New Password</Label>
            <Input
              id={newPasswordId}
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.newPassword}
              aria-describedby={fieldErrors.newPassword ? `${newPasswordId}-error` : undefined}
            />
            {fieldErrors.newPassword && (
              <p id={`${newPasswordId}-error`} className="text-sm text-red-600 dark:text-red-500">
                {fieldErrors.newPassword}
              </p>
            )}
            {newPassword && !fieldErrors.newPassword && <PasswordStrength password={newPassword} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor={confirmNewPasswordId}>Confirm New Password</Label>
            <Input
              id={confirmNewPasswordId}
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                if (fieldErrors.confirmNewPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmNewPassword: "" }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.confirmNewPassword}
              aria-describedby={fieldErrors.confirmNewPassword ? `${confirmNewPasswordId}-error` : undefined}
            />
            {fieldErrors.confirmNewPassword && (
              <p id={`${confirmNewPasswordId}-error`} className="text-sm text-red-600 dark:text-red-500">
                {fieldErrors.confirmNewPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
