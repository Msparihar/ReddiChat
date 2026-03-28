"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X, Check, ChevronDown } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { AI_MODELS } from "@/lib/ai/models";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { useUsage } from "@/hooks/use-usage";

const OPENAI_ICON = (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 260"
      className="w-3.5 h-3.5 dark:hidden block"
    >
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 260"
      className="w-3.5 h-3.5 hidden dark:block"
    >
      <path
        fill="#fff"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
      />
    </svg>
  </>
);

const GEMINI_ICON = (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="gemini-gradient"
        x1="0%"
        x2="68.73%"
        y1="100%"
        y2="30.395%"
      >
        <stop offset="0%" stopColor="#1C7DFF" />
        <stop offset="52.021%" stopColor="#1C69FF" />
        <stop offset="100%" stopColor="#F0DCD6" />
      </linearGradient>
    </defs>
    <path
      d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12"
      fill="url(#gemini-gradient)"
      fillRule="nonzero"
    />
  </svg>
);

const MODEL_ICONS: Record<string, React.ReactNode> = {
  "gemini-2.5-flash": GEMINI_ICON,
  "gemini-3-flash": GEMINI_ICON,
  "gemini-3.1-pro": GEMINI_ICON,
  "gpt-5.4-mini": OPENAI_ICON,
  "gpt-5.4": OPENAI_ICON,
};

export function MessageInput() {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { sendMessage, isLoading, isStreaming, selectedModel, setSelectedModel } =
    useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  const { data: usageData, isLoading: usageLoading, isError: usageError } = useUsage();

  const messagesRemaining = usageData
    ? usageData.limits.messages - usageData.usage.messages
    : null;

  const usageExhausted = messagesRemaining !== null && messagesRemaining <= 0;

  const getUsageColor = () => {
    if (messagesRemaining === null) return isDark ? "text-gray-500" : "text-gray-400";
    if (messagesRemaining > 20) return isDark ? "text-gray-500" : "text-gray-400";
    if (messagesRemaining > 5) return "text-amber-500";
    if (messagesRemaining > 0) return "text-red-500";
    return "text-red-500 font-bold";
  };

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
            "relative border rounded-xl transition-colors",
            isDark
              ? "bg-gray-900 border-gray-700 focus-within:border-gray-500"
              : "bg-white border-gray-200 focus-within:border-gray-400"
          )}
        >
          {/* Textarea */}
          <div className="relative">
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
                "w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none min-h-[48px] max-h-32 placeholder:text-gray-400 scrollbar-thin",
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
          </div>

          {/* Bottom bar with model selector, attach, and send */}
          <div
            className={cn(
              "flex items-center justify-between px-3 py-2 border-t",
              isDark ? "border-gray-800" : "border-gray-100"
            )}
          >
            <div className="flex items-center gap-2">
              {/* Model selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2 text-xs rounded-md",
                      isDark
                        ? "text-gray-300 hover:bg-gray-800"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedModel}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5"
                      >
                        {MODEL_ICONS[selectedModel]}
                        <span>{currentModel.displayName}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className={cn(
                    "min-w-[12rem]",
                    isDark
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  )}
                >
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onSelect={() => setSelectedModel(model.id)}
                      className={cn(
                        "flex items-center justify-between gap-2 cursor-pointer",
                        isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {MODEL_ICONS[model.id]}
                        <div className="flex flex-col">
                          <span className="text-sm">{model.displayName}</span>
                          <span
                            className={cn(
                              "text-[10px]",
                              isDark ? "text-gray-500" : "text-gray-400"
                            )}
                          >
                            {model.description}
                          </span>
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="w-4 h-4 text-purple-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div
                className={cn(
                  "h-4 w-px",
                  isDark ? "bg-gray-700" : "bg-gray-200"
                )}
              />

              {/* File attach */}
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

              {/* Divider */}
              <div
                className={cn(
                  "h-4 w-px",
                  isDark ? "bg-gray-700" : "bg-gray-200"
                )}
              />

              {/* Usage indicator */}
              <div
                className={cn("text-[11px] flex items-center gap-1", getUsageColor())}
                title={
                  usageData
                    ? `Messages: ${usageData.usage.messages}/${usageData.limits.messages} | Tokens: ${usageData.usage.tokens.toLocaleString()}/${usageData.limits.tokens.toLocaleString()} | Uploads: ${usageData.usage.uploads}/${usageData.limits.uploads}`
                    : "Loading usage..."
                }
              >
                {usageLoading || usageError ? (
                  <span>—</span>
                ) : messagesRemaining !== null ? (
                  <span>{messagesRemaining} msgs left</span>
                ) : null}
              </div>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading || isStreaming || usageExhausted}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                message.trim() && !isLoading && !isStreaming
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : isDark
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
              title={isStreaming ? "AI is responding..." : "Send message"}
            >
              <Send className="w-4 h-4" />
            </button>
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
