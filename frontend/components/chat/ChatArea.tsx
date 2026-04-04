"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";

export function ChatArea() {
  const { currentThread, messages, isLoading, isStreaming, exportAsMarkdown } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track streaming time
  useEffect(() => {
    if (isStreaming && !streamStartTime) {
      const start = Date.now();
      setStreamStartTime(start);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }

    if (!isStreaming && streamStartTime) {
      setLastResponseTime(Math.round((Date.now() - streamStartTime) / 100) / 10);
      setStreamStartTime(null);
      setElapsedTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStreaming, streamStartTime]);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full",
        isDark ? "bg-[#0c0c0d]" : "bg-white"
      )}
    >
      {/* Chat Header */}
      {currentThread && messages.length > 0 && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2 border-b flex-shrink-0",
            isDark ? "border-[rgba(255,255,255,0.06)]" : "border-[rgba(0,0,0,0.06)]"
          )}
        >
          <h2
            className={cn(
              "text-sm font-medium truncate",
              isDark ? "text-gray-300" : "text-gray-700"
            )}
          >
            {currentThread.title}
          </h2>
          <button
            onClick={() => {
              exportAsMarkdown();
              toast.success("Exported!");
            }}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark
                ? "text-gray-400 hover:bg-[#222226]"
                : "text-gray-500 hover:bg-gray-100"
            )}
            title="Export as Markdown"
            aria-label="Export conversation as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!currentThread || messages.length === 0 ? (
          isLoading ? (
            <div className="h-full overflow-y-auto">
              <MessageList />
            </div>
          ) : (
            <WelcomeScreen />
          )
        ) : (
          <div className="h-full overflow-y-auto">
            <MessageList />
          </div>
        )}
      </div>

      {/* Streaming Status */}
      {isStreaming && elapsedTime > 0 && (
        <div
          className={cn(
            "flex-shrink-0 px-4 py-1.5 text-xs text-center",
            elapsedTime > 15
              ? "text-amber-500"
              : isDark
                ? "text-gray-500"
                : "text-gray-400"
          )}
        >
          {elapsedTime > 15
            ? `This is taking longer than usual... (${elapsedTime}s)`
            : `Generating... ${elapsedTime}s`}
        </div>
      )}

      {/* Last Response Time */}
      {!isStreaming && lastResponseTime && lastResponseTime > 0 && (
        <div
          className={cn(
            "flex-shrink-0 px-4 py-1 text-[10px] text-center",
            isDark ? "text-gray-600" : "text-gray-300"
          )}
        >
          Responded in {lastResponseTime}s
        </div>
      )}

      {/* Message Input Area - Fixed at bottom */}
      <div className={cn("flex-shrink-0", isDark ? "bg-[#0c0c0d]" : "bg-white")}>
        <MessageInput />
      </div>
    </div>
  );
}

export default ChatArea;
