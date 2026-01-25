import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "./ForgotPasswordForm";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Business Rule: Email validation", () => {
    it("should require email field", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        // Empty email triggers browser validation or Zod validation
        const hasError = screen.queryByText(/email is required/i) ||
                        screen.queryByText(/please enter a valid email address/i);
        expect(hasError).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate email format via API", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: "VALIDATION_ERROR",
          details: [{ path: ["email"], message: "EMAIL_INVALID" }]
        }),
      });

      render(<ForgotPasswordForm />);

      // Use technically valid format but server rejects it
      await user.type(screen.getByLabelText(/email/i), "test@invalid");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: Success state (security - always show success)", () => {
    it("should show success message on valid submission (don't reveal if email exists)", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      });

      // Form should be hidden, only success message visible
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /send reset link/i })).not.toBeInTheDocument();
    });

    it("should show success message even for non-existent email (security)", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByLabelText(/email/i), "nonexistent@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: API error handling", () => {
    it("should handle server errors gracefully", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "INTERNAL_ERROR" }),
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });

      // Form should still be visible for retry
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
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

      render(<ForgotPasswordForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();

      // Clean up
      resolvePromise!();
    });
  });
});
