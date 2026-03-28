"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Trash2, Search } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface ConversationHistoryProps {
  isCollapsed?: boolean;
}

async function fetchConversations() {
  const response = await fetch("/api/chat/history", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }
  return response.json();
}

export function ConversationHistory({
  isCollapsed = false,
}: ConversationHistoryProps) {
  const {
    threads,
    currentThread,
    loadConversation,
    syncThreadsWithAPI,
    deleteThread,
  } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredThreads = searchQuery.trim()
    ? threads.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    staleTime: 30000,
  });

  useEffect(() => {
    if (data?.conversations) {
      syncThreadsWithAPI(data.conversations);
    }
  }, [data, syncThreadsWithAPI]);

  // Expose refetch for external use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).refreshConversationList = refetch;
    }
  }, [refetch]);

  // Expose search focus for keyboard shortcut
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).focusConversationSearch = () => searchInputRef.current?.focus();
    }
  }, []);

  const handleSelectConversation = async (conversationId: string) => {
    try {
      await loadConversation(conversationId);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chat/history/${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        deleteThread(conversationId);
        refetch();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  if (isCollapsed) {
    return (
      <div className="p-2 space-y-1">
        {threads.slice(0, 5).map((thread) => (
          <button
            key={thread.id || "new"}
            onClick={() => thread.id && handleSelectConversation(thread.id)}
            className={cn(
              "w-full p-2 rounded-md transition-colors flex items-center justify-center",
              currentThread?.id === thread.id
                ? isDark
                  ? "bg-gray-800"
                  : "bg-gray-200"
                : isDark
                ? "hover:bg-gray-800"
                : "hover:bg-gray-200"
            )}
            title={thread.title}
          >
            <MessageSquare
              className={cn(
                "w-4 h-4",
                isDark ? "text-gray-400" : "text-gray-500"
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-10 rounded",
                isDark ? "bg-gray-800" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {/* Search */}
      <div className="relative mb-2">
        <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5", isDark ? "text-gray-500" : "text-gray-400")} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className={cn(
            "w-full text-xs pl-8 pr-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-purple-500",
            isDark
              ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
              : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"
          )}
        />
      </div>

      {filteredThreads.length === 0 ? (
        <div
          className={cn(
            "text-sm text-center py-4",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
        >
          {searchQuery.trim() ? "No matching conversations" : "No conversations yet"}
        </div>
      ) : (
        filteredThreads.map((thread) => (
          <div
            key={thread.id || "new"}
            className={cn(
              "group relative flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors",
              currentThread?.id === thread.id
                ? isDark
                  ? "bg-gray-800"
                  : "bg-gray-200"
                : isDark
                ? "hover:bg-gray-800"
                : "hover:bg-gray-200"
            )}
            onClick={() => thread.id && handleSelectConversation(thread.id)}
          >
            <MessageSquare
              className={cn(
                "w-4 h-4 flex-shrink-0",
                isDark ? "text-gray-400" : "text-gray-500"
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm truncate",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}
              >
                {thread.title}
              </div>
              <div
                className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-400"
                )}
              >
                {formatRelativeTime(thread.createdAt)}
              </div>
            </div>
            {thread.id && (
              <button
                onClick={(e) => handleDeleteConversation(e, thread.id!)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-300 text-gray-500"
                )}
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ConversationHistory;
