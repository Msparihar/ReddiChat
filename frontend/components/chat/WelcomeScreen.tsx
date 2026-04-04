"use client";

import { MessageSquare, Search, Upload, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useSession } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const categoryQueries: Record<string, string[]> = {
  "Ask Reddit": [
    "What's trending in r/technology today?",
    "Find popular AI discussions on Reddit",
    "Show me top posts from r/programming",
    "Search for recent gaming news on Reddit",
  ],
  Search: [
    "Search for 'machine learning' posts in r/MachineLearning",
    "Find discussions about 'React' in programming subreddits",
    "Look up 'cryptocurrency' trends across Reddit",
    "Search for 'job opportunities' in tech subreddits",
  ],
  Upload: [
    "Analyze this document and find related Reddit discussions",
    "Upload an image and find similar posts on Reddit",
    "Process this PDF and search for relevant subreddits",
    "Upload a code file and find programming discussions about it",
  ],
  "Quick Help": [
    "How do I search for specific subreddits?",
    "What are the most active programming communities?",
    "Show me how to filter Reddit posts by date",
    "Help me find trending topics in my interests",
  ],
};

const categories = [
  { icon: MessageSquare, label: "Ask Reddit", color: "text-[var(--rc-text-secondary)]" },
  { icon: Search, label: "Search", color: "text-[var(--rc-text-secondary)]" },
  { icon: Upload, label: "Upload", color: "text-[var(--rc-text-secondary)]" },
  { icon: Zap, label: "Quick Help", color: "text-[var(--rc-text-secondary)]" },
];

export function WelcomeScreen() {
  const { sendMessage } = useChatStore();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeCategory, setActiveCategory] = useState("Ask Reddit");

  const suggestedPrompts = categoryQueries[activeCategory];

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleCategoryClick = (categoryLabel: string) => {
    setActiveCategory(categoryLabel);
  };

  const userName = session?.user?.name?.split(" ")[0];

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center p-6 max-w-3xl mx-auto overflow-y-auto",
        isDark ? "bg-[#0c0c0d]" : "bg-white"
      )}
    >
      <div className="text-center mb-8 mt-12">
        <h1
          className={cn(
            "text-2xl font-normal mb-6 tracking-tight",
            isDark ? "text-gray-100" : "text-gray-900"
          )}
        >
          How can I help you{userName ? `, ${userName}` : ""}?
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.label;
            return (
              <button
                key={category.label}
                onClick={() => handleCategoryClick(category.label)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors border",
                  isActive
                    ? isDark
                      ? "bg-[rgba(255,69,0,0.15)] border-[rgba(255,69,0,0.3)] text-brand"
                      : "bg-[rgba(255,69,0,0.08)] border-[rgba(255,69,0,0.2)] text-brand"
                    : isDark
                    ? "bg-[#1b1b1e] hover:bg-[#222226] border-[rgba(255,255,255,0.06)]"
                    : "bg-white hover:bg-[#f0efed] border-[rgba(0,0,0,0.06)]"
                )}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-brand"
                      : category.color
                  }`}
                />
                <span
                  className={cn(
                    "text-sm font-normal",
                    isActive
                      ? "text-brand"
                      : isDark
                      ? "text-gray-100"
                      : "text-gray-900"
                  )}
                >
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Suggested Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-xl">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className={cn(
                "text-left p-3 rounded-md transition-colors",
                isDark
                  ? "bg-[#1b1b1e] border border-[rgba(255,255,255,0.06)] hover:bg-[#222226] hover:border-[rgba(255,255,255,0.10)]"
                  : "bg-white border-none shadow-[2px_4px_24px_0px_rgba(0,0,0,0.08)] hover:shadow-[3px_5px_30px_0px_rgba(0,0,0,0.14)] transition-shadow duration-300"
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                {prompt}
              </span>
            </button>
          ))}
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-brand to-[#ff6b35] hover:from-brand-hover hover:to-brand rounded-full transition-colors text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-normal">Upgrade to Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
