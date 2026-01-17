"use client";

import { useEffect } from "react";
import { Plus, LogOut, Menu, Settings, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { useChatStore } from "@/stores/chat-store";
import { useSession, signOut } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { ConversationHistory } from "./ConversationHistory";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, toggleSettings } =
    useUIStore();
  const { createNewThread } = useChatStore();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const user = session?.user;

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const renderUserAvatar = () => {
    if (user?.image) {
      return (
        <img
          src={user.image}
          alt={user.name || "User"}
          className="w-7 h-7 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-white">
          {getUserInitials(user?.name)}
        </span>
      </div>
    );
  };

  const handleNewChat = () => {
    createNewThread();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
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
          ? "bg-gray-900 border-gray-800"
          : "bg-gray-50 border-gray-200",
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
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
                  )}
                  title="Collapse sidebar"
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
                    "text-lg font-semibold hover:text-orange-400 transition-colors cursor-pointer",
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}
                >
                  ReddiChat
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
                  )}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <button
                  onClick={toggleSettings}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
                  )}
                  title="Settings"
                >
                  <Settings
                    className={cn(
                      "w-4 h-4",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center gap-2 px-3 py-2 transition-colors text-sm font-medium"
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
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
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

              <button
                onClick={toggleTheme}
                className={cn(
                  "w-full p-2 rounded-md transition-colors flex items-center justify-center",
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
                )}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-gray-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <button
                onClick={toggleSettings}
                className={cn(
                  "w-full p-2 rounded-md transition-colors flex items-center justify-center",
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
                )}
                aria-label="Settings"
              >
                <Settings
                  className={cn(
                    "w-4 h-4",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}
                />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center justify-center"
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
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSettings}
            className={cn(
              "flex items-center w-full rounded-md p-1 transition-colors",
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-200",
              isSidebarOpen ? "gap-2.5" : "justify-center"
            )}
            aria-label="Open user settings"
          >
            {renderUserAvatar()}
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-normal truncate",
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}
                >
                  {user?.name || "Guest User"}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  Free
                </div>
              </div>
            )}
          </button>

          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2 w-full rounded-md p-1 transition-colors text-sm",
                isDark
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              )}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
