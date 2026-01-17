"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore, Message, FileAttachment } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { RedditSource } from "./RedditSource";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function MessageList() {
  const { messages, isLoading, isStreaming, currentTool } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                className={cn("px-4 py-6", isDark ? "bg-gray-950" : "bg-white")}
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
                              className="text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded"
                            >
                              📎 {file.filename}
                            </div>
                          ))}
                        </div>
                      )}
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl">
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
                className={cn(
                  "px-4 py-6",
                  isDark ? "bg-gray-950" : "bg-white",
                  message.isError && "bg-red-50 border-l-4 border-red-400"
                )}
              >
                <div className="max-w-3xl mx-auto">
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={message.content} />

                    {message.isError && message.canRetry && (
                      <button
                        onClick={() => useChatStore.getState().retryFailedMessage()}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Retry
                      </button>
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
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.toolUsed && (
                        <span className="text-blue-500">
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
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
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
