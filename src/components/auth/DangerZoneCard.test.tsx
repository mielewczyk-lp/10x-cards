import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DangerZoneCard from "./DangerZoneCard";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("DangerZoneCard", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    delete (window as { location?: unknown }).location;
    window.location = { href: "" } as Location;
  });

  describe("Business Rule: Confirmation dialog (critical security operation)", () => {
    it("should show confirmation dialog when Delete Account button is clicked", async () => {
      const user = userEvent.setup();
      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
        expect(screen.getAllByText(/action cannot be undone/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/flashcards and learning progress will be permanently lost/i)).toBeInTheDocument();
      });

      // API should not be called yet
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should close dialog and not delete account when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule: Account deletion flow", () => {
    it("should call API and redirect to register page on successful deletion", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /yes, delete my account/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/account/delete",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
        expect(window.location.href).toBe("/register?deleted=true");
      });
    });
  });

  describe("Business Rule: Error handling", () => {
    it("should display error message when deletion fails", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Database error occurred" }),
      });

      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /yes, delete my account/i }));

      await waitFor(() => {
        expect(screen.getByText(/database error occurred/i)).toBeInTheDocument();
      });

      // Dialog should remain open for user to retry
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      // Should not redirect
      expect(window.location.href).toBe("");
    });

    it("should show generic error when API fails without message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /yes, delete my account/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to delete account/i)).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /yes, delete my account/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Business Rule: Loading state during deletion", () => {
    it("should disable buttons during deletion process", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = () => resolve({ ok: true, json: async () => ({ success: true }) });
        })
      );

      render(<DangerZoneCard />);

      await user.click(screen.getByRole("button", { name: /^delete account$/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /yes, delete my account/i }));

      // Buttons should be disabled during deletion
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

      // Clean up
      resolvePromise!();
    });
  });
});
