import { useReducer, useCallback } from "react";
import type { StartPracticeCommand, StartPracticeResponseDto, PracticeFlashcardDto } from "@/types";

// -----------------------------------------------------------------------------
// LOCAL TYPES
// -----------------------------------------------------------------------------

interface State {
  flashcardQueue: PracticeFlashcardDto[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  practiceActive: boolean;
  totalFlashcards: number;
}

type Action =
  | { type: "START_PRACTICE_REQUEST" }
  | { type: "START_PRACTICE_SUCCESS"; payload: { flashcards: PracticeFlashcardDto[]; total: number } }
  | { type: "START_PRACTICE_ERROR"; payload: string }
  | { type: "NEXT_CARD" }
  | { type: "END_PRACTICE" }
  | { type: "RESET" };

// -----------------------------------------------------------------------------
// REDUCER
// -----------------------------------------------------------------------------

const initialState: State = {
  flashcardQueue: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  practiceActive: false,
  totalFlashcards: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_PRACTICE_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "START_PRACTICE_SUCCESS":
      return {
        ...state,
        isLoading: false,
        flashcardQueue: action.payload.flashcards,
        totalFlashcards: action.payload.total,
        currentIndex: 0,
        practiceActive: action.payload.flashcards.length > 0,
        error: null,
      };

    case "START_PRACTICE_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        practiceActive: false,
      };

    case "NEXT_CARD": {
      const nextIndex = state.currentIndex + 1;

      // Check if we've reached the end
      if (nextIndex >= state.flashcardQueue.length) {
        return {
          ...state,
          currentIndex: nextIndex,
          practiceActive: false,
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
      };
    }

    case "END_PRACTICE":
      return {
        ...initialState,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

export function useFreeLearning() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Start a new practice session
   * @param limit Number of flashcards to practice (10, 20, or 50)
   */
  const startPractice = useCallback(async (limit: 10 | 20 | 50) => {
    dispatch({ type: "START_PRACTICE_REQUEST" });

    try {
      const command: StartPracticeCommand = { limit };

      const response = await fetch("/api/flashcards/practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Failed to start practice" } }));
        throw new Error(errorData.error?.message || "Failed to start practice");
      }

      const data: StartPracticeResponseDto = await response.json();

      dispatch({
        type: "START_PRACTICE_SUCCESS",
        payload: { flashcards: data.flashcards, total: data.total },
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start practice";
      dispatch({ type: "START_PRACTICE_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Move to the next flashcard
   */
  const nextCard = useCallback(() => {
    dispatch({ type: "NEXT_CARD" });
  }, []);

  /**
   * End the current practice session
   */
  const endPractice = useCallback(() => {
    dispatch({ type: "END_PRACTICE" });
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Current flashcard
  const currentFlashcard =
    state.practiceActive && state.currentIndex < state.flashcardQueue.length
      ? state.flashcardQueue[state.currentIndex]
      : null;

  // Progress
  const progress = {
    current: state.currentIndex + 1,
    total: state.flashcardQueue.length,
    completed: state.currentIndex,
  };

  // Check if session is complete
  const isComplete =
    state.practiceActive === false &&
    state.currentIndex >= state.flashcardQueue.length &&
    state.flashcardQueue.length > 0;

  return {
    // State
    currentFlashcard,
    isLoading: state.isLoading,
    error: state.error,
    practiceActive: state.practiceActive,
    totalFlashcards: state.totalFlashcards,
    progress,
    isComplete,

    // Actions
    startPractice,
    nextCard,
    endPractice,
    reset,
  };
}
