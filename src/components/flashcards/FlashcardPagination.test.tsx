import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { FlashcardPagination } from "./FlashcardPagination";

describe("FlashcardPagination", () => {
  describe("Business Rule: Navigation buttons disabled states (US-007)", () => {
    it("should disable First and Previous buttons on first page", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /first page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /last page/i })).not.toBeDisabled();
    });

    it("should disable Next and Last buttons on last page", () => {
      render(
        <FlashcardPagination
          page={10}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /first page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /previous page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /last page/i })).toBeDisabled();
    });

    it("should disable all navigation buttons when totalPages is 0 (no items)", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={0}
          totalPages={0}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /first page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /last page/i })).toBeDisabled();
    });

    it("should enable all navigation buttons on middle page", () => {
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /first page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /previous page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /last page/i })).not.toBeDisabled();
    });
  });

  describe("Business Rule: Page change callbacks", () => {
    it("should call onPageChange with 1 when First button clicked", async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /first page/i }));

      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("should call onPageChange with page - 1 when Previous button clicked", async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /previous page/i }));

      expect(onPageChange).toHaveBeenCalledWith(4);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("should call onPageChange with page + 1 when Next button clicked", async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /next page/i }));

      expect(onPageChange).toHaveBeenCalledWith(6);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("should call onPageChange with totalPages when Last button clicked", async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /last page/i }));

      expect(onPageChange).toHaveBeenCalledWith(10);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Business Rule: Range display (X-Y of Z)", () => {
    it("should display correct range for first page", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={45}
          totalPages={5}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByText("Showing 1-10 of 45")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    });

    it("should display correct range for middle page", () => {
      render(
        <FlashcardPagination
          page={3}
          pageSize={10}
          totalItems={45}
          totalPages={5}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByText("Showing 21-30 of 45")).toBeInTheDocument();
      expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
    });

    it("should display correct range for last partial page", () => {
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={45}
          totalPages={5}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByText("Showing 41-45 of 45")).toBeInTheDocument();
      expect(screen.getByText("Page 5 of 5")).toBeInTheDocument();
    });

    it("should display 0-0 of 0 when no items", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={0}
          totalPages={0}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByText("Showing 0-0 of 0")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    });
  });

  describe("Business Rule: Page size selector", () => {
    it("should render all page size options (10, 20, 50, 100)", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      const select = screen.getByRole("combobox", { name: /per page/i });
      const options = Array.from(select.querySelectorAll("option")).map((opt) => opt.value);

      expect(options).toEqual(["10", "20", "50", "100"]);
    });

    it("should call onPageSizeChange when page size is changed", async () => {
      const user = userEvent.setup();
      const onPageSizeChange = vi.fn();
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={onPageSizeChange}
        />
      );

      await user.selectOptions(screen.getByRole("combobox", { name: /per page/i }), "50");

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
      expect(onPageSizeChange).toHaveBeenCalledTimes(1);
    });

    it("should display current page size as selected", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={50}
          totalItems={100}
          totalPages={2}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      const select = screen.getByRole("combobox", { name: /per page/i }) as HTMLSelectElement;
      expect(select.value).toBe("50");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all navigation buttons", () => {
      render(
        <FlashcardPagination
          page={5}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Last page" })).toBeInTheDocument();
    });

    it("should have labeled page size selector", () => {
      render(
        <FlashcardPagination
          page={1}
          pageSize={10}
          totalItems={100}
          totalPages={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      );

      const select = screen.getByRole("combobox", { name: /per page/i });
      expect(select).toBeInTheDocument();
    });
  });
});
