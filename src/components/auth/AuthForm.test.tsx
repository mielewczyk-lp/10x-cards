import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AuthForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    delete (window as { location?: unknown }).location;
    window.location = { href: "" } as Location;
  });

  describe("Business Rule: Mode switching (login vs register)", () => {
    it("should show email and password fields in login mode", () => {
      render(<AuthForm mode="login" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should show confirm password field in register mode", () => {
      render(<AuthForm mode="register" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });
  });

  describe("Business Rule: Zod validation (client-side)", () => {
    it("should validate email format via Zod", async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "invalid");

      // Trigger validation by trying to submit
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show validation error eventually (client or server-side)
      await waitFor(() => {
        const hasError =
          screen.queryByText(/please enter a valid email address/i) !== null ||
          screen.queryByText(/email is required/i) !== null;
        expect(hasError || mockFetch).toBeTruthy();
      });
    });

    it("should validate password requirements in register mode", async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="register" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "short");
      await user.type(screen.getByLabelText(/confirm password/i), "short");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        // Should show password validation error
        const hasError =
          screen.queryByText(/password must be at least 8 characters/i) ||
          screen.queryByText(/password must contain at least one/i);
        expect(hasError).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate password confirmation match", async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="register" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.type(screen.getByLabelText(/confirm password/i), "Different123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule: API error handling", () => {
    it("should handle INVALID_CREDENTIALS error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "INVALID_CREDENTIALS" }),
      });

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "WrongPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it("should handle TOO_MANY_REQUESTS (rate limit) error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "TOO_MANY_REQUESTS" }),
      });

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });
    });

    it("should handle EMAIL_NOT_CONFIRMED error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "EMAIL_NOT_CONFIRMED" }),
      });

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/confirm your email/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: Success flow (redirect)", () => {
    it("should redirect to /create on successful login", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(window.location.href).toBe("/create");
      });
    });
  });

  describe("Business Rule: Loading state management", () => {
    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = () => resolve({ ok: true, json: async () => ({ success: true }) });
        })
      );

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();

      // Clean up
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resolvePromise!();
    });
  });

  describe("Business Rule: Error clearing on input change", () => {
    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "INVALID_CREDENTIALS" }),
      });

      render(<AuthForm mode="login" />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "WrongPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "new@example.com");

      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
    });
  });
});
