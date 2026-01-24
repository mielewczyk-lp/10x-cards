import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { AnswerButtons } from "./AnswerButtons";

describe("AnswerButtons", () => {
  describe("Business Rule: SM-2 grade mapping (CRITICAL for spaced repetition)", () => {
    it("should map Again button to grade 0 (complete blackout)", async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} />);

      await user.click(screen.getByRole("button", { name: /again/i }));

      expect(onAnswer).toHaveBeenCalledWith(0);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });

    it("should map Hard button to grade 2 (incorrect response; correct one remembered)", async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} />);

      await user.click(screen.getByRole("button", { name: /hard/i }));

      expect(onAnswer).toHaveBeenCalledWith(2);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });

    it("should map Good button to grade 4 (correct response with hesitation)", async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} />);

      await user.click(screen.getByRole("button", { name: /good/i }));

      expect(onAnswer).toHaveBeenCalledWith(4);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });

    it("should map Easy button to grade 5 (perfect response)", async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} />);

      await user.click(screen.getByRole("button", { name: /easy/i }));

      expect(onAnswer).toHaveBeenCalledWith(5);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe("Disabled state handling", () => {
    it("should disable all buttons when disabled prop is true", () => {
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} disabled={true} />);

      expect(screen.getByRole("button", { name: /again/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /hard/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /good/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /easy/i })).toBeDisabled();
    });

    it("should not call onAnswer when buttons are disabled", async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<AnswerButtons onAnswer={onAnswer} disabled={true} />);

      await user.click(screen.getByRole("button", { name: /again/i }));

      expect(onAnswer).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility (US-010 requirement)", () => {
    it("should have proper ARIA labels for all answer buttons", () => {
      render(<AnswerButtons onAnswer={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Again - I forgot completely" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hard - I barely remembered" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Good - I remembered correctly" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Easy - I remembered perfectly" })).toBeInTheDocument();
    });
  });
});
