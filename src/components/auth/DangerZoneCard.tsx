import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DangerZoneCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    setError("");
    setIsDeleting(true);

    try {
      // Call the account deletion API
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete account. Please try again.");
      }

      // On success, redirect to register page with a message
      window.location.href = "/register?deleted=true";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle id="danger-heading" className="text-red-600 dark:text-red-500">
          Danger Zone
        </CardTitle>
        <CardDescription>Irreversible actions that will permanently affect your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex-1">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">Delete Account</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <span className="display-block">
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </span>
                    <span className="display-blockfont-medium text-neutral-900 dark:text-neutral-100">
                      All of your flashcards and learning progress will be permanently lost.
                    </span>
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Yes, delete my account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
