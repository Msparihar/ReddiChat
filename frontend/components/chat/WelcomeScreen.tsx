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
  { icon: MessageSquare, label: "Ask Reddit", color: "text-orange-400" },
  { icon: Search, label: "Search", color: "text-blue-400" },
  { icon: Upload, label: "Upload", color: "text-green-400" },
  { icon: Zap, label: "Quick Help", color: "text-yellow-400" },
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
        isDark ? "bg-gray-950" : "bg-white"
      )}
    >
      <div className="text-center mb-8 mt-12">
        <h1
          className={cn(
            "text-2xl font-normal mb-6",
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
                      ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                      : "bg-purple-100 border-purple-300 text-purple-700"
                    : isDark
                    ? "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                )}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? isDark
                        ? "text-purple-300"
                        : "text-purple-700"
                      : category.color
                  }`}
                />
                <span
                  className={cn(
                    "text-sm font-normal",
                    isActive
                      ? isDark
                        ? "text-purple-300"
                        : "text-purple-700"
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
                "text-left p-3 rounded-md transition-colors border",
                isDark
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300"
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
          <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full transition-colors text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-normal">Upgrade to Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
