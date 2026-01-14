import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

interface ErrorPageProps {
  title?: string;
  description?: string;
  homeUrl?: string;
  homeLabel?: string;
}

export default function ErrorPage({
  title = "404 - Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  homeUrl = "/",
  homeLabel = "Go to Home",
}: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 dark:bg-destructive/20 p-3">
              <AlertCircle className="size-8 text-destructive dark:text-destructive/80" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={homeUrl} aria-label={homeLabel}>
              <Home aria-hidden="true" />
              {homeLabel}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
