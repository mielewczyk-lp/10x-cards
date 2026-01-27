import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function PasswordResetToast() {
  useEffect(() => {
    // Check for reset success in URL params
    const params = new URLSearchParams(window.location.search);
    const resetSuccess = params.get("reset") === "success";

    if (resetSuccess) {
      toast.success("Password reset successful!", {
        description: "You can now use your new password.",
      });

      // Clean URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return <Toaster />;
}
