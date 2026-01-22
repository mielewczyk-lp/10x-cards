import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, LogOut } from "lucide-react";

interface TopbarProps {
  userEmail?: string;
}

export default function Topbar({ userEmail }: TopbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = "/login";
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Logout failed:", response.status, errorData);
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo */}
          <a
            href="/create"
            className="text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            10x Cards
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/create"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Create
            </a>
            <a
              href="/flashcards"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Flashcards
            </a>
            <a
              href="/review"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Review
            </a>
            <a
              href="/stats"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Statistics
            </a>
            <a
              href="/logs"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Logs
            </a>
            <a
              href="/account"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              Account
            </a>

            {/* User info, theme toggle and logout */}
            <div className="flex items-center space-x-3 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              {userEmail && <span className="text-sm text-neutral-600 dark:text-neutral-400">{userEmail}</span>}
              <ThemeToggle />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-col space-y-3">
              <a
                href="/create"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Create
              </a>
              <a
                href="/flashcards"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Flashcards
              </a>
              <a
                href="/review"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Review
              </a>
              <a
                href="/stats"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Statistics
              </a>
              <a
                href="/logs"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Logs
              </a>
              <a
                href="/account"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors py-2"
              >
                Account
              </a>

              {/* User info, theme toggle and logout for mobile */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                {userEmail && <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{userEmail}</p>}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Theme:</span>
                  <ThemeToggle />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
