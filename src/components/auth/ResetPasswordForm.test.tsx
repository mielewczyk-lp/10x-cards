import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordForm from "./ResetPasswordForm";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    delete (window as { location?: unknown }).location;
    window.location = { href: "" } as Location;
  });

  describe("Business Rule: Password validation and confirmation", () => {
    it("should validate password requirements", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "short");
      await user.type(screen.getByLabelText(/confirm new password/i), "short");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        // Should show validation error for password requirements
        const hasError = screen.queryByText(/password must be at least 8 characters/i) ||
                        screen.queryByText(/password must contain at least one/i);
        expect(hasError).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate passwords match", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "Different123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule: Token validation errors", () => {
    it("should handle INVALID_TOKEN error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "INVALID_TOKEN" }),
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/reset link is invalid or has expired/i)).toBeInTheDocument();
      });
    });

    it("should handle TOKEN_EXPIRED error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "TOKEN_EXPIRED" }),
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/reset link has expired/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: Success flow (redirect to login)", () => {
    it("should redirect to login with success message on successful reset", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(window.location.href).toBe("/login?reset=success");
      });
    });
  });

  describe("Business Rule: PasswordStrength integration", () => {
    it("should show PasswordStrength component when typing new password", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "TestPass123");

      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      });
    });

    it("should not show PasswordStrength when there are validation errors", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "short");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        const hasError = screen.queryByText(/password must be at least 8 characters/i) ||
                        screen.queryByText(/password must contain at least one/i);
        expect(hasError).toBeInTheDocument();
      });

      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    });
  });

  describe("Business Rule: Loading state", () => {
    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = () => resolve({ ok: true, json: async () => ({ success: true }) });
        })
      );

      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      expect(screen.getByRole("button", { name: /resetting password/i })).toBeDisabled();
      expect(screen.getByLabelText(/^new password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled();

      // Clean up
      resolvePromise!();
    });
  });
});
