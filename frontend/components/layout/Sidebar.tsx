"use client";

import { useEffect } from "react";
import { Plus, Menu } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { ConversationHistory } from "./ConversationHistory";
import { ProfileDropdown } from "./ProfileDropdown";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } =
    useUIStore();
  const { createNewThread } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleNewChat = () => {
    createNewThread();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeof window !== "undefined" && window.innerWidth < 768 && isSidebarOpen) {
        const sidebar = document.querySelector("[data-sidebar]");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, setSidebarOpen]);

  return (
    <aside
      data-sidebar
      className={cn(
        "border-r transition-all duration-300 flex flex-col z-40",
        isDark
          ? "bg-[#141416] border-gray-800"
          : "bg-[#f8f7f6] border-gray-200",
        "fixed top-0 bottom-0 left-0",
        isSidebarOpen ? "w-60 translate-x-0" : "w-16 translate-x-0"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          "border-b",
          isDark ? "border-gray-800" : "border-gray-200",
          isSidebarOpen ? "p-3" : "p-2"
        )}
      >
        {isSidebarOpen ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isDark ? "hover:bg-[#222226]" : "hover:bg-[#e8e7e5]"
                  )}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <Menu
                    className={cn(
                      "w-4 h-4",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}
                  />
                </button>
                <Link
                  href="/"
                  className={cn(
                    "text-lg font-semibold hover:text-brand transition-colors cursor-pointer",
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}
                >
                  ReddiChat
                </Link>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full bg-brand hover:bg-brand-hover text-white rounded-md flex items-center justify-center gap-2 px-3 py-2 transition-colors text-sm font-medium"
              aria-label="Create new chat"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col space-y-1">
              <button
                onClick={toggleSidebar}
                className={cn(
                  "w-full p-2 rounded-md transition-colors flex items-center justify-center",
                  isDark ? "hover:bg-[#222226]" : "hover:bg-[#e8e7e5]"
                )}
                aria-label="Expand sidebar"
              >
                <Menu
                  className={cn(
                    "w-5 h-5",
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}
                />
              </button>

            </div>

            <button
              onClick={handleNewChat}
              className="w-full p-2 bg-brand hover:bg-brand-hover text-white rounded-md transition-colors flex items-center justify-center"
              aria-label="Create new chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ConversationHistory isCollapsed={!isSidebarOpen} />
      </div>

      {/* User Profile */}
      <div
        className={cn(
          "border-t",
          isDark ? "border-gray-800" : "border-gray-200",
          isSidebarOpen ? "p-3" : "p-2"
        )}
      >
        <ProfileDropdown isCollapsed={!isSidebarOpen} />
      </div>
    </aside>
  );
}

export default Sidebar;
