import { useReducer, useCallback } from "react";
import type {
  StartReviewSessionCommand,
  StartReviewSessionResponseDto,
  SubmitAnswerCommand,
  SubmitAnswerResponseDto,
  ReviewSessionFlashcardDto,
} from "@/types";

// -----------------------------------------------------------------------------
// LOCAL TYPES
// -----------------------------------------------------------------------------

interface State {
  flashcardQueue: ReviewSessionFlashcardDto[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  totalReviewed: number;
  sessionActive: boolean;
}

type Action =
  | { type: "START_SESSION_REQUEST" }
  | { type: "START_SESSION_SUCCESS"; payload: { flashcards: ReviewSessionFlashcardDto[] } }
  | { type: "START_SESSION_ERROR"; payload: string }
  | { type: "SUBMIT_ANSWER_REQUEST" }
  | { type: "SUBMIT_ANSWER_SUCCESS"; payload: { nextFlashcard: ReviewSessionFlashcardDto | null } }
  | { type: "SUBMIT_ANSWER_ERROR"; payload: string }
  | { type: "END_SESSION" }
  | { type: "RESET" };

// -----------------------------------------------------------------------------
// REDUCER
// -----------------------------------------------------------------------------

const initialState: State = {
  flashcardQueue: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  totalReviewed: 0,
  sessionActive: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_SESSION_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "START_SESSION_SUCCESS":
      return {
        ...state,
        isLoading: false,
        flashcardQueue: action.payload.flashcards,
        currentIndex: 0,
        totalReviewed: 0,
        sessionActive: action.payload.flashcards.length > 0,
        error: null,
      };

    case "START_SESSION_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        sessionActive: false,
      };

    case "SUBMIT_ANSWER_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "SUBMIT_ANSWER_SUCCESS": {
      const newTotalReviewed = state.totalReviewed + 1;

      // If there's a next flashcard from the server, add it to the queue
      if (action.payload.nextFlashcard) {
        return {
          ...state,
          isLoading: false,
          currentIndex: state.currentIndex + 1,
          totalReviewed: newTotalReviewed,
          error: null,
        };
      }

      // Check if there are more flashcards in the current queue
      const hasMoreInQueue = state.currentIndex + 1 < state.flashcardQueue.length;

      if (hasMoreInQueue) {
        return {
          ...state,
          isLoading: false,
          currentIndex: state.currentIndex + 1,
          totalReviewed: newTotalReviewed,
          error: null,
        };
      }

      // No more flashcards - end session
      return {
        ...state,
        isLoading: false,
        totalReviewed: newTotalReviewed,
        sessionActive: false,
        error: null,
      };
    }

    case "SUBMIT_ANSWER_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "END_SESSION":
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

export function useReviewSession() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Start a new review session
   */
  const startSession = useCallback(async (limit = 20) => {
    dispatch({ type: "START_SESSION_REQUEST" });

    try {
      const command: StartReviewSessionCommand = { limit };

      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Failed to start session" } }));
        throw new Error(errorData.error?.message || "Failed to start session");
      }

      const data: StartReviewSessionResponseDto = await response.json();

      dispatch({
        type: "START_SESSION_SUCCESS",
        payload: { flashcards: data.flashcards },
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start session";
      dispatch({ type: "START_SESSION_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Submit answer for current flashcard
   */
  const submitAnswer = useCallback(
    async (grade: number) => {
      if (!state.sessionActive || state.currentIndex >= state.flashcardQueue.length) {
        throw new Error("No active session or no current flashcard");
      }

      dispatch({ type: "SUBMIT_ANSWER_REQUEST" });

      try {
        const currentFlashcard = state.flashcardQueue[state.currentIndex];
        const command: SubmitAnswerCommand = { grade };

        const response = await fetch(`/api/review-sessions/flashcards/${currentFlashcard.id}/answer`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: "Failed to submit answer" } }));
          throw new Error(errorData.error?.message || "Failed to submit answer");
        }

        const data: SubmitAnswerResponseDto = await response.json();

        dispatch({
          type: "SUBMIT_ANSWER_SUCCESS",
          payload: { nextFlashcard: data.nextFlashcard },
        });

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to submit answer";
        dispatch({ type: "SUBMIT_ANSWER_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [state.sessionActive, state.currentIndex, state.flashcardQueue]
  );

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    dispatch({ type: "END_SESSION" });
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Current flashcard
  const currentFlashcard =
    state.sessionActive && state.currentIndex < state.flashcardQueue.length
      ? state.flashcardQueue[state.currentIndex]
      : null;

  // Progress
  const progress = {
    current: state.currentIndex + 1,
    total: state.flashcardQueue.length,
    reviewed: state.totalReviewed,
  };

  return {
    // State
    currentFlashcard,
    isLoading: state.isLoading,
    error: state.error,
    sessionActive: state.sessionActive,
    progress,

    // Actions
    startSession,
    submitAnswer,
    endSession,
    reset,
  };
}
