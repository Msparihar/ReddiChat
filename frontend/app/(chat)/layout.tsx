"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen } = useUIStore();

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
