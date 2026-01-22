import { ThemeProvider } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import type { ReactNode } from "react";

interface AppShellProps {
  userEmail?: string;
  currentPath?: string;
  children: ReactNode;
}

export function AppShell({ userEmail, currentPath, children }: AppShellProps) {
  return (
    <ThemeProvider>
      {userEmail && <Topbar userEmail={userEmail} currentPath={currentPath} />}
      {children}
    </ThemeProvider>
  );
}
