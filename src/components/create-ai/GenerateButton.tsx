import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface GenerateButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function GenerateButton({ loading, disabled, onClick }: GenerateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className="w-full sm:w-auto" size="lg">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Generate
        </>
      )}
    </Button>
  );
}
