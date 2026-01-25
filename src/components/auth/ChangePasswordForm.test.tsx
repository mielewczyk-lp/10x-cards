import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordForm from "./ChangePasswordForm";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Business Rule: Three-field validation (current/new/confirm)", () => {
    it("should validate all three password fields are required", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate new password meets requirements", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "OldPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "short");
      await user.type(screen.getByLabelText(/confirm new password/i), "short");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        // Should show password validation error
        const hasError = screen.queryByText(/password must be at least 8 characters/i) ||
                        screen.queryByText(/password must contain at least one/i);
        expect(hasError).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate new password and confirmation match", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "OldPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "Different123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule: Specific error code handling", () => {
    it("should handle CURRENT_PASSWORD_INCORRECT error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "CURRENT_PASSWORD_INCORRECT" }),
      });

      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "WrongPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    it("should handle SESSION_EXPIRED error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "SESSION_EXPIRED" }),
      });

      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "OldPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
      });
    });

    it("should handle UNAUTHORIZED error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "UNAUTHORIZED" }),
      });

      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "OldPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be logged in/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: Success state handling", () => {
    it("should show success message and clear form on success", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/current password/i), "OldPass123");
      await user.type(screen.getByLabelText(/^new password$/i), "NewPass123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });

      // Form should be cleared
      expect(screen.getByLabelText(/current password/i)).toHaveValue("");
      expect(screen.getByLabelText(/^new password$/i)).toHaveValue("");
      expect(screen.getByLabelText(/confirm new password/i)).toHaveValue("");
    });
  });

  describe("Business Rule: PasswordStrength integration", () => {
    it("should show PasswordStrength component for new password", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "TestPass123");

      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      });
    });

    it("should not show PasswordStrength when there are validation errors", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText(/^new password$/i), "short");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        const hasError = screen.queryByText(/password must be at least 8 characters/i) ||
                        screen.queryByText(/password must contain at least one/i);
        expect(hasError).toBeInTheDocument();
      });

      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    });
  });
});
