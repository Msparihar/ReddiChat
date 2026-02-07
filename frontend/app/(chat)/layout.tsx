"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { SignInCard } from "@/components/auth/SignInCard";
import { useSession } from "@/lib/auth/client";
import { useUIStore } from "@/stores/ui-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen } = useUIStore();
  const { data: session, isPending } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (isPending) {
    return (
      <div
        className={cn(
          "h-screen flex items-center justify-center",
          isDark ? "bg-gray-950" : "bg-gray-50"
        )}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={cn(
          "h-screen flex items-center justify-center p-4",
          isDark
            ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
            : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
        )}
      >
        <SignInCard callbackURL="/chat" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "ml-60" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}
