import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { LearningStatsResponseDto } from "@/types";

export default function LearningStatsPanel() {
  const [stats, setStats] = useState<LearningStatsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stats/learning");

      if (!response.ok) {
        throw new Error("Failed to fetch learning statistics");
      }

      const data: LearningStatsResponseDto = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format last review date as human-readable relative time
   */
  const formatLastReview = (dateString: string | null): string => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
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

  const { mastery, schedule, totals } = stats;

  // Calculate percentages for mastery
  const masteredPercentage = mastery.totalCards > 0 ? (mastery.masteredCards / mastery.totalCards) * 100 : 0;
  const reviewedPercentage = totals.totalCards > 0 ? (totals.reviewedAtLeastOnce / totals.totalCards) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Mastery Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Mastery Progress</CardTitle>
          <CardDescription>How well you know your flashcards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{mastery.masteredCards}</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                cards mastered ({masteredPercentage.toFixed(0)}%)
              </span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Not Learned <span className="text-red-600 dark:text-red-500 font-medium">(Again</span>
                  <span className="text-neutral-500">/</span>
                  <span className="text-orange-600 dark:text-orange-500 font-medium">Hard)</span>
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{mastery.newCards}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">New or forgotten</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Learning <span className="text-green-600 dark:text-green-500 font-medium">(Good</span>
                  <span className="text-neutral-500">/</span>
                  <span className="text-blue-600 dark:text-blue-500 font-medium">Easy)</span>
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-500">{mastery.learningCards}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">1-2 successful reviews</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Mastered <span className="text-green-600 dark:text-green-500 font-medium">(Good</span>
                  <span className="text-neutral-500">/</span>
                  <span className="text-blue-600 dark:text-blue-500 font-medium">Easy)</span>
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-500">{mastery.masteredCards}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">3+ successful reviews</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle>Review Schedule</CardTitle>
          <CardDescription>Upcoming reviews based on spaced repetition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{schedule.dueNow}</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">cards due now</span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Due Tomorrow</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{schedule.dueTomorrow}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Due This Week</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{schedule.dueThisWeek}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Due Next Week</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">{schedule.dueNextWeek}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>Quality metrics and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main metrics grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Flashcards</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{totals.totalCards}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Reviewed At Least Once</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">{totals.reviewedAtLeastOnce}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {reviewedPercentage.toFixed(0)}% of total
                </p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Average Ease Factor</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  {totals.avgEaseFactor.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Higher is easier</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Last Review</p>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  {formatLastReview(totals.lastReviewDate)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info note - spans both columns */}
      <div className="md:col-span-2 text-sm text-neutral-600 dark:text-neutral-400 text-center">
        <p>These statistics reflect your learning progress using the SM-2 spaced repetition algorithm.</p>
      </div>
    </div>
  );
}
