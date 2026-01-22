import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, LogOut } from "lucide-react";

interface TopbarProps {
  userEmail?: string;
  currentPath?: string;
}

export default function Topbar({ userEmail, currentPath = "/" }: TopbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getLinkClassName = (path: string) => {
    const isActive = currentPath === path;
    return `text-sm font-medium cursor-pointer relative transition-colors ${
      isActive
        ? "text-neutral-900 dark:text-neutral-100 after:scale-x-100"
        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 after:scale-x-0 hover:after:scale-x-100"
    } after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-green-600 dark:after:bg-green-500 after:transition-transform`;
  };

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
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-surface">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo */}
          <a href="/create" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <span className="relative inline-flex items-center justify-center px-2 py-1 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white font-bold text-lg rounded shadow-[3px_3px_0_0_#10b981,6px_6px_0_0_#059669,9px_9px_0_0_#047857] dark:shadow-[3px_3px_0_0_#059669,6px_6px_0_0_#047857,9px_9px_0_0_#065f46]">
              10x
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Cards</span>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/create" className={getLinkClassName("/create")}>
              Create
            </a>
            <a href="/flashcards" className={getLinkClassName("/flashcards")}>
              Flashcards
            </a>
            <a href="/review" className={getLinkClassName("/review")}>
              Review
            </a>
            <a href="/stats" className={getLinkClassName("/stats")}>
              Statistics
            </a>
            <a href="/logs" className={getLinkClassName("/logs")}>
              Logs
            </a>
            <a href="/account" className={getLinkClassName("/account")}>
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
                className="flex items-center gap-2 cursor-pointer"
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
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/create"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Create
              </a>
              <a
                href="/flashcards"
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/flashcards"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Flashcards
              </a>
              <a
                href="/review"
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/review"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Review
              </a>
              <a
                href="/stats"
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/stats"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Statistics
              </a>
              <a
                href="/logs"
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/logs"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Logs
              </a>
              <a
                href="/account"
                className={`text-sm font-medium py-2 cursor-pointer transition-colors ${
                  currentPath === "/account"
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
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
                  className="flex items-center gap-2 w-full cursor-pointer"
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
