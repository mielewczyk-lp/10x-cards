import { ThemeProvider } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import type { ReactNode } from "react";

interface AppShellProps {
  userEmail?: string;
  children: ReactNode;
}

export function AppShell({ userEmail, children }: AppShellProps) {
  return (
    <ThemeProvider>
      {userEmail && <Topbar userEmail={userEmail} />}
      {children}
    </ThemeProvider>
  );
}
