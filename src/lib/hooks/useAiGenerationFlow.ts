import { useReducer, useCallback, useMemo } from "react";
import type {
  CreateGenerationSourceCommand,
  CreateGenerationSourceResponseDto,
  CreateFlashcardCommand,
  FlashcardDto,
  UpdateGenerationSourceCommand,
} from "@/types";

// -----------------------------------------------------------------------------
// LOCAL TYPES
// -----------------------------------------------------------------------------

export interface FlashcardCandidate {
  id: string;
  front: string;
  back: string;
  status: "pending" | "accepted" | "edited" | "rejected";
}

interface State {
  inputText: string;
  candidates: FlashcardCandidate[];
  generationSourceId: string | null;
  loadingGenerate: boolean;
  loadingSave: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_INPUT_TEXT"; payload: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; payload: { sourceId: string; candidates: FlashcardCandidate[] } }
  | { type: "GENERATE_ERROR"; payload: string }
  | { type: "UPDATE_CANDIDATE"; payload: { id: string; updates: Partial<FlashcardCandidate> } }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "RESET" };

// -----------------------------------------------------------------------------
// REDUCER
// -----------------------------------------------------------------------------

const initialState: State = {
  inputText: "",
  candidates: [],
  generationSourceId: null,
  loadingGenerate: false,
  loadingSave: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.payload, error: null };

    case "GENERATE_START":
      return { ...state, loadingGenerate: true, error: null, candidates: [] };

    case "GENERATE_SUCCESS":
      return {
        ...state,
        loadingGenerate: false,
        generationSourceId: action.payload.sourceId,
        candidates: action.payload.candidates,
      };

    case "GENERATE_ERROR":
      return { ...state, loadingGenerate: false, error: action.payload };

    case "UPDATE_CANDIDATE": {
      const updatedCandidates = state.candidates.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
      );
      return { ...state, candidates: updatedCandidates };
    }

    case "SAVE_START":
      return { ...state, loadingSave: true, error: null };

    case "SAVE_SUCCESS":
      return {
        ...state,
        loadingSave: false,
        inputText: "",
        candidates: [],
        generationSourceId: null,
      };

    case "SAVE_ERROR":
      return { ...state, loadingSave: false, error: action.payload };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

export function useAiGenerationFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Character count
  const charCount = useMemo(() => state.inputText.length, [state.inputText]);

  // Validation
  const inputError = useMemo(() => {
    const trimmed = state.inputText.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length < 1000) return "Text must be at least 1000 characters";
    if (trimmed.length > 10000) return "Text must not exceed 10000 characters";
    return null;
  }, [state.inputText]);

  // Stats
  const stats = useMemo(() => {
    const pending = state.candidates.filter((c) => c.status === "pending").length;
    const accepted = state.candidates.filter((c) => c.status === "accepted").length;
    const edited = state.candidates.filter((c) => c.status === "edited").length;
    const rejected = state.candidates.filter((c) => c.status === "rejected").length;
    return {
      total: state.candidates.length,
      pending,
      accepted,
      edited,
      rejected,
    };
  }, [state.candidates]);

  // Set input text
  const setInputText = useCallback((text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  }, []);

  // Generate candidates
  const generate = useCallback(async () => {
    const trimmed = state.inputText.trim();

    // Guard: validation
    if (trimmed.length < 1000 || trimmed.length > 10000) {
      dispatch({ type: "GENERATE_ERROR", payload: "Invalid input text length" });
      return;
    }

    dispatch({ type: "GENERATE_START" });

    try {
      const command: CreateGenerationSourceCommand = { inputText: trimmed };
      const response = await fetch("/api/generation-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || "Failed to generate flashcards";
        throw new Error(errorMessage);
      }

      const data: CreateGenerationSourceResponseDto = await response.json();

      // Transform candidates - all start as pending, user must accept them
      const candidates: FlashcardCandidate[] = data.candidates.map((c, index) => ({
        id: `${data.id}-${index}`,
        front: c.front,
        back: c.back,
        status: "pending",
      }));

      dispatch({
        type: "GENERATE_SUCCESS",
        payload: { sourceId: data.id, candidates },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      dispatch({ type: "GENERATE_ERROR", payload: message });
    }
  }, [state.inputText]);

  // Update candidate
  const updateCandidate = useCallback((id: string, updates: Partial<FlashcardCandidate>) => {
    dispatch({ type: "UPDATE_CANDIDATE", payload: { id, updates } });
  }, []);

  // Save accepted candidates
  const saveAccepted = useCallback(async () => {
    const acceptedCandidates = state.candidates.filter((c) => c.status === "accepted" || c.status === "edited");

    if (acceptedCandidates.length === 0) {
      dispatch({ type: "SAVE_ERROR", payload: "No candidates to save" });
      return;
    }

    dispatch({ type: "SAVE_START" });

    try {
      // Prepare flashcard commands
      const commands: CreateFlashcardCommand[] = acceptedCandidates.map((c) => ({
        front: c.front,
        back: c.back,
        sourceType: c.status === "edited" ? "ai-edited" : "ai-full",
        generationSourceId: state.generationSourceId,
      }));

      // POST /flashcards
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commands),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || "Failed to save flashcards";
        throw new Error(errorMessage);
      }

      const savedFlashcards: FlashcardDto[] = await response.json();

      // Optional: Update generation source stats
      if (state.generationSourceId) {
        const updateCommand: UpdateGenerationSourceCommand = {
          totalAccepted: stats.accepted,
          totalAcceptedEdited: stats.edited,
          totalRejected: stats.rejected,
        };

        await fetch(`/api/generation-sources/${state.generationSourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateCommand),
        }).catch((err) => {
          console.error("Failed to update generation source stats:", err);
        });
      }

      dispatch({ type: "SAVE_SUCCESS" });
      return savedFlashcards;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      dispatch({ type: "SAVE_ERROR", payload: message });
    }
  }, [state.candidates, state.generationSourceId, stats]);

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    // State
    inputText: state.inputText,
    charCount,
    inputError,
    candidates: state.candidates,
    generationSourceId: state.generationSourceId,
    loadingGenerate: state.loadingGenerate,
    loadingSave: state.loadingSave,
    error: state.error,
    stats,

    // Actions
    setInputText,
    generate,
    updateCandidate,
    saveAccepted,
    reset,
  };
}
