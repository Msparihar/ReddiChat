"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SignInCard } from "@/components/auth/SignInCard";
import { useSession } from "@/lib/auth/client";
import { useUIStore } from "@/stores/ui-store";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { createNewThread } = useChatStore();
  const { data: session, isPending } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K — focus conversation search
      if (isModifier && e.key === "k") {
        e.preventDefault();
        (window as any).focusConversationSearch?.();
      }

      // Cmd/Ctrl + N — new chat
      if (isModifier && e.key === "n") {
        e.preventDefault();
        createNewThread();
      }

      // Escape — close sidebar on mobile
      if (e.key === "Escape") {
        if (typeof window !== "undefined" && window.innerWidth < 768 && isSidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewThread, isSidebarOpen, setSidebarOpen]);

  if (isPending) {
    return (
      <div
        className={cn(
          "h-screen flex items-center justify-center",
          isDark ? "bg-[#0c0c0d]" : "bg-[#f8f7f6]"
        )}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
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
          isSidebarOpen ? "md:ml-60 ml-0" : "md:ml-16 ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
