import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ReviewCard } from "./ReviewCard";
import type { ReviewSessionFlashcardDto } from "@/types";

describe("ReviewCard", () => {
  const mockFlashcard: ReviewSessionFlashcardDto = {
    id: "1",
    front: "What is the capital of France?",
    back: "Paris",
    sm2State: {
      efactor: 2.5,
      interval: 1,
      repetition: 0,
    },
  };

  describe("Business Rule: Flip logic - show answer on click (US-010)", () => {
    it("should initially display front side with Question label", () => {
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={vi.fn()} />);

      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
      expect(screen.queryByText("Paris")).not.toBeInTheDocument();
    });

    it("should display back side with Answer label after Show Answer clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /show answer/i }));

      expect(screen.getByText("Answer")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.queryByText("What is the capital of France?")).not.toBeInTheDocument();
    });

    it("should hide Show Answer button after it is clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={vi.fn()} />);

      const showAnswerButton = screen.getByRole("button", { name: /show answer/i });
      await user.click(showAnswerButton);

      expect(screen.queryByRole("button", { name: /show answer/i })).not.toBeInTheDocument();
    });

    it("should call onShowAnswer callback when Show Answer is clicked", async () => {
      const user = userEvent.setup();
      const onShowAnswer = vi.fn();
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={onShowAnswer} />);

      await user.click(screen.getByRole("button", { name: /show answer/i }));

      expect(onShowAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe("Business Rule: Display SM-2 state information (transparency)", () => {
    it("should not display SM-2 state before showing answer", () => {
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={vi.fn()} />);

      expect(screen.queryByText(/repetition/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/interval/i)).not.toBeInTheDocument();
    });

    it("should display SM-2 state after showing answer", async () => {
      const user = userEvent.setup();
      const flashcardWithState: ReviewSessionFlashcardDto = {
        ...mockFlashcard,
        sm2State: {
          efactor: 2.5,
          interval: 5,
          repetition: 3,
        },
      };
      render(<ReviewCard flashcard={flashcardWithState} onShowAnswer={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /show answer/i }));

      expect(screen.getByText("Repetition: 3")).toBeInTheDocument();
      expect(screen.getByText("Interval: 5 days")).toBeInTheDocument();
    });
  });

  describe("Edge cases: Content formatting", () => {
    it("should preserve whitespace with whitespace-pre-wrap class", () => {
      const multilineFlashcard: ReviewSessionFlashcardDto = {
        ...mockFlashcard,
        front: "Line 1\nLine 2\nLine 3",
      };
      const { container } = render(<ReviewCard flashcard={multilineFlashcard} onShowAnswer={vi.fn()} />);

      // Verify the paragraph element has the whitespace-pre-wrap class
      const paragraph = container.querySelector("p.whitespace-pre-wrap");
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveClass("whitespace-pre-wrap");
    });

    it("should handle long text content without breaking layout", () => {
      const longTextFlashcard: ReviewSessionFlashcardDto = {
        ...mockFlashcard,
        front: "A".repeat(500),
      };
      const { container } = render(<ReviewCard flashcard={longTextFlashcard} onShowAnswer={vi.fn()} />);

      const contentContainer = container.querySelector(".min-h-\\[200px\\]");
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render Show Answer button with proper semantics", () => {
      render(<ReviewCard flashcard={mockFlashcard} onShowAnswer={vi.fn()} />);

      const button = screen.getByRole("button", { name: /show answer/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });
  });
});
