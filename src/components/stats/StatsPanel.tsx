import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { StatsResponseDto } from "@/types";

export default function StatsPanel() {
  const [stats, setStats] = useState<StatsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data: StatsResponseDto = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <p className="font-medium">Error loading statistics</p>
        <p className="text-sm">{error}</p>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const { aiAcceptanceRate, aiFlashcardShare } = stats;

  // Target for MVP success: 75%
  const TARGET_PERCENTAGE = 75;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* AI Acceptance Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle>AI Acceptance Rate</CardTitle>
          <CardDescription>Percentage of AI-generated flashcards accepted by you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                {aiAcceptanceRate.acceptanceRate.toFixed(1)}%
              </span>
              <span
                className={`text-sm font-medium ${
                  aiAcceptanceRate.acceptanceRate >= TARGET_PERCENTAGE
                    ? "text-green-600 dark:text-green-500"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {aiAcceptanceRate.acceptanceRate >= TARGET_PERCENTAGE
                  ? "✓ Target met"
                  : `Target: ${TARGET_PERCENTAGE}%`}
              </span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Generated</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {aiAcceptanceRate.totalGenerated}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Accepted</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-500">
                  {aiAcceptanceRate.totalAccepted + aiAcceptanceRate.totalAcceptedEdited}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Accepted (no edit)</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  {aiAcceptanceRate.totalAccepted}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Accepted (edited)</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  {aiAcceptanceRate.totalAcceptedEdited}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Rejected</p>
                <p className="text-lg font-medium text-red-600 dark:text-red-500">{aiAcceptanceRate.totalRejected}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Flashcard Share Card */}
      <Card>
        <CardHeader>
          <CardTitle>AI Flashcard Share</CardTitle>
          <CardDescription>Percentage of your flashcards created using AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                {aiFlashcardShare.aiSharePercentage.toFixed(1)}%
              </span>
              <span
                className={`text-sm font-medium ${
                  aiFlashcardShare.aiSharePercentage >= TARGET_PERCENTAGE
                    ? "text-green-600 dark:text-green-500"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {aiFlashcardShare.aiSharePercentage >= TARGET_PERCENTAGE
                  ? "✓ Target met"
                  : `Target: ${TARGET_PERCENTAGE}%`}
              </span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Flashcards</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {aiFlashcardShare.totalFlashcards}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">AI Flashcards</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-500">
                  {aiFlashcardShare.aiFlashcards}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Manual Flashcards</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  {aiFlashcardShare.manualFlashcards}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info note - spans both columns */}
      <div className="md:col-span-2 text-sm text-neutral-600 dark:text-neutral-400 text-center">
        <p>These statistics help track the MVP success criteria:</p>
        <p className="mt-1">
          <strong>Target:</strong> 75% AI acceptance rate and 75% AI flashcard share
        </p>
      </div>
    </div>
  );
}
