"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { sendMessage, isLoading, isStreaming } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || isLoading || isStreaming)
      return;

    await sendMessage(message, selectedFiles);
    setMessage("");
    setSelectedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border",
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-200"
              )}
            >
              <span
                className={cn(
                  "text-sm truncate max-w-[120px]",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}
              >
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative border rounded-xl transition-colors flex items-end",
            isDark
              ? "bg-gray-900 border-gray-700 focus-within:border-gray-500"
              : "bg-white border-gray-200 focus-within:border-gray-400"
          )}
        >
          <div className="flex items-center p-3 pb-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.txt,.md"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDark
                  ? "text-gray-400 hover:bg-gray-800"
                  : "text-gray-500 hover:bg-gray-100"
              )}
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? "AI is responding..."
                  : "Ask about Reddit posts, search subreddits, or upload files..."
              }
              disabled={isLoading || isStreaming}
              className={cn(
                "w-full bg-transparent py-3 pr-16 text-sm resize-none focus:outline-none min-h-[48px] max-h-32 placeholder:text-gray-400 scrollbar-thin pt-4",
                isDark ? "text-gray-100" : "text-gray-900",
                (isLoading || isStreaming) && "opacity-50 cursor-not-allowed"
              )}
              rows={1}
              style={{
                height: "auto",
                minHeight: "48px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height =
                  Math.min(target.scrollHeight, 128) + "px";
              }}
            />

            <div className="absolute right-3 bottom-3">
              <button
                type="submit"
                disabled={!message.trim() || isLoading || isStreaming}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  message.trim() && !isLoading && !isStreaming
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                )}
                title={isStreaming ? "AI is responding..." : "Send message"}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </form>
    </div>
  );
}

export default MessageInput;
