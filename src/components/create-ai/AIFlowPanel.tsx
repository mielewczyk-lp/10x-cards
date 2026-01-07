import { useAiGenerationFlow } from "@/lib/hooks/useAiGenerationFlow";
import { TextAreaWithCounter } from "./TextAreaWithCounter";
import { GenerateButton } from "./GenerateButton";
import { StatusBar } from "./StatusBar";
import { CandidateList } from "./CandidateList";
import { BulkSaveButton } from "./BulkSaveButton";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AIFlowPanel() {
  const {
    inputText,
    charCount,
    inputError,
    candidates,
    loadingGenerate,
    loadingSave,
    error,
    stats,
    setInputText,
    generate,
    updateCandidate,
    saveAccepted,
  } = useAiGenerationFlow();

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSave = async () => {
    const result = await saveAccepted();
    if (result) {
      toast.success(`Successfully saved ${result.length} flashcard(s)!`);
    }
  };

  const hasAcceptedCandidates = stats.accepted + stats.edited > 0;

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Input Section */}
      <div className="space-y-4">
        <TextAreaWithCounter
          value={inputText}
          onChange={setInputText}
          charCount={charCount}
          error={inputError}
          disabled={loadingGenerate}
        />

        <GenerateButton
          loading={loadingGenerate}
          disabled={!!inputError || inputText.trim().length === 0 || loadingGenerate}
          onClick={generate}
        />
      </div>

      {/* Candidates Section */}
      {candidates.length > 0 && (
        <div className="space-y-4">
          <StatusBar stats={stats} />

          <CandidateList candidates={candidates} onUpdateCandidate={updateCandidate} />

          <BulkSaveButton disabled={!hasAcceptedCandidates || loadingSave} loading={loadingSave} onClick={handleSave} />
        </div>
      )}
    </div>
  );
}
