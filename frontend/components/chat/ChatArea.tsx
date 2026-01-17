"use client";

import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";

export function ChatArea() {
  const { currentThread, messages, isLoading } = useChatStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full",
        isDark ? "bg-gray-950" : "bg-white"
      )}
    >
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

      {/* Message Input Area - Fixed at bottom */}
      <div className={cn("flex-shrink-0", isDark ? "bg-gray-950" : "bg-white")}>
        <MessageInput />
      </div>
    </div>
  );
}

export default ChatArea;
