"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore, Message, FileAttachment } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { RedditSource } from "./RedditSource";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export function MessageList() {
  const { messages, isLoading, isStreaming, currentTool } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast.success("Copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="h-full scrollbar-thin">
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" ? (
              <div
                className={cn("px-4 py-6", isDark ? "bg-[#0c0c0d]" : "bg-white")}
              >
                <div className="max-w-3xl mx-auto flex gap-4 justify-end">
                  <div className="max-w-2xl">
                    {message.hasAttachments &&
                      message.fileAttachments &&
                      message.fileAttachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {message.fileAttachments.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="text-sm text-[#a0a0a8] bg-[#1b1b1e] px-3 py-2 rounded"
                            >
                              📎 {file.filename}
                            </div>
                          ))}
                        </div>
                      )}
                    <div className={cn("px-4 py-3 rounded-2xl", isDark ? "bg-[#1b1b1e] text-[#ededef]" : "bg-[#f0efed] text-[#1a1a1c]")}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-2 text-right",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                aria-busy={message.isPending || undefined}
                className={cn(
                  "px-4 py-6 group",
                  isDark ? "bg-[#0c0c0d]" : "bg-white",
                  message.isError && "bg-red-50 border-l-4 border-red-400"
                )}
              >
                <div className="max-w-3xl mx-auto">
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={message.content} />

                    {message.isError && (
                      <div className={cn("mt-3 flex items-center gap-2", isDark ? "text-gray-400" : "text-gray-500")}>
                        {message.canRetry && (
                          <button
                            onClick={() => useChatStore.getState().retryFailedMessage()}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-md transition-colors",
                              "bg-brand hover:bg-brand-hover text-white",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                            )}
                            aria-label="Retry sending message"
                          >
                            Retry
                          </button>
                        )}
                        <span className="text-xs">
                          {message.content.includes("Rate limit") && "Try again in a few minutes"}
                          {message.content.includes("Session expired") && "Please sign in again"}
                          {message.content.includes("timed out") && "The request took too long"}
                        </span>
                      </div>
                    )}

                    {message.isPending && (
                      <div className="inline-flex items-center gap-1 mt-2">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex items-center gap-4 mt-4 text-xs",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          isDark ? "hover:bg-[#222226] text-gray-500" : "hover:bg-gray-100 text-gray-400",
                          "md:opacity-0 md:group-hover:opacity-100",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        )}
                        title="Copy message"
                        aria-label="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.toolUsed && (
                        <span className="text-brand">
                          • Used{" "}
                          {message.toolUsed === "search_reddit"
                            ? "Reddit Search"
                            : message.toolUsed}
                        </span>
                      )}
                      {message.isError && (
                        <span className="text-red-500">• Error occurred</span>
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div
                          className={cn(
                            "text-sm font-medium mb-3",
                            isDark ? "text-gray-300" : "text-gray-600"
                          )}
                        >
                          Sources from Reddit:
                        </div>
                        {message.sources.map((source: any, index: number) => (
                          <RedditSource
                            key={index}
                            source={source}
                            index={index}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && !isStreaming && (
          <div className="px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400/60 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {isStreaming && currentTool && (
          <div className="px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div
                className={cn(
                  "flex items-center gap-2 text-sm",
                  isDark ? "text-gray-500" : "text-gray-400"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                <span>
                  {currentTool === "search_reddit"
                    ? "Searching Reddit..."
                    : currentTool === "web_search"
                    ? "Searching the web..."
                    : `Using ${currentTool}...`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageList;
