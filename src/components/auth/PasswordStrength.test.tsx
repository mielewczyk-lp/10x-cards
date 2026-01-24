import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordStrength from "./PasswordStrength";

describe("PasswordStrength", () => {
  it("should not render when password is empty", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  describe("Business Rule: Strength levels based on score", () => {
    it("should show Weak (red) for score 0-2: short, single type", () => {
      render(<PasswordStrength password="password" />);
      expect(screen.getByText("Weak")).toHaveClass("text-red-600");
    });

    it("should show Fair (orange) for score 3-4: 8+ chars, mixed case, numbers", () => {
      render(<PasswordStrength password="Pass1234" />);
      expect(screen.getByText("Fair")).toHaveClass("text-orange-600");
    });

    it("should show Good (yellow) for score 5: 12+ chars, mixed case, numbers", () => {
      render(<PasswordStrength password="Password1234" />);
      expect(screen.getByText("Good")).toHaveClass("text-yellow-600");
    });

    it("should show Strong (green) for score 6-7: 16+ chars, all types", () => {
      render(<PasswordStrength password="Password1234!@#$" />);
      expect(screen.getByText("Strong")).toHaveClass("text-green-600");
    });
  });

  describe("Business Rule: Critical length thresholds (8, 12, 16)", () => {
    it("should award points at 8, 12, and 16 character thresholds", () => {
      const { rerender } = render(<PasswordStrength password="abcdefgh" />); // 8 chars
      let progressBar = screen.getByRole("status").querySelector('[aria-valuenow="2"]');
      expect(progressBar).toBeInTheDocument(); // length=1, lowercase=1

      rerender(<PasswordStrength password="abcdefghijkl" />); // 12 chars
      progressBar = screen.getByRole("status").querySelector('[aria-valuenow="3"]');
      expect(progressBar).toBeInTheDocument(); // length=2, lowercase=1

      rerender(<PasswordStrength password="abcdefghijklmnop" />); // 16 chars
      progressBar = screen.getByRole("status").querySelector('[aria-valuenow="4"]');
      expect(progressBar).toBeInTheDocument(); // length=3, lowercase=1
    });
  });

  describe("Business Rule: Character variety requirements", () => {
    it("should highlight requirements checklist based on password content", () => {
      render(<PasswordStrength password="Pass123" />);
      
      expect(screen.getByText("At least 8 characters")).not.toHaveClass("text-green-600"); // 7 chars
      expect(screen.getByText("Contains a letter")).toHaveClass("text-green-600");
      expect(screen.getByText("Contains a number")).toHaveClass("text-green-600");
    });

    it("should detect all character types for maximum score", () => {
      render(<PasswordStrength password="Abc123!@#$%^&*ab" />);
      const progressBar = screen.getByRole("status").querySelector('[aria-valuenow="7"]');
      expect(progressBar).toBeInTheDocument(); // All criteria met
    });
  });
});
