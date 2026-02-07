"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, User, Loader2, Clock } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface SearchResult {
  id: string;
  redditUsername: string;
  redditAvatar: string | null;
  redditKarma: number | null;
  searchedAt: string;
}

interface UserSearchAutocompleteProps {
  isDark: boolean;
  onSelect: (username: string) => void;
  onInputChange?: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}

async function fetchSearchHistory(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const res = await fetch(`/api/user-searches?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.searches || [];
}

function formatKarma(karma: number) {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
}

export function UserSearchAutocomplete({
  isDark,
  onSelect,
  onInputChange,
  autoFocus = false,
  placeholder = "username",
  compact = false,
}: UserSearchAutocompleteProps) {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const router = useRouter();

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 200);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["user-search-history", debouncedInput],
    queryFn: () => fetchSearchHistory(debouncedInput),
    enabled: isAuthenticated && isOpen,
    staleTime: 10_000,
  });

  const handleSelect = useCallback(
    (username: string) => {
      setInput(username);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect(username);
    },
    [onSelect]
  );

  const handleSubmit = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
      handleSelect(results[highlightedIndex].redditUsername);
    } else if (input.trim()) {
      handleSelect(input.trim());
    }
  }, [highlightedIndex, results, input, handleSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          handleSubmit();
          break;
        case "Escape":
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, results, handleSubmit]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  const inputHeight = compact ? "py-2" : "py-3";

  return (
    <div className="relative w-full">
      <div className="relative">
        <span
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
        >
          u/
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onInputChange?.(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full pl-8 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50",
            inputHeight,
            isDark
              ? "bg-slate-800 border-slate-700 text-white placeholder-gray-500"
              : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2
              size={16}
              className={cn(
                "animate-spin",
                isDark ? "text-gray-500" : "text-gray-400"
              )}
            />
          ) : (
            <Search
              size={16}
              className={isDark ? "text-gray-500" : "text-gray-400"}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && isAuthenticated && results.length > 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full mt-1 rounded-lg border shadow-xl overflow-hidden",
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-gray-200"
          )}
        >
          <div
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5",
              isDark
                ? "text-gray-500 border-b border-slate-800"
                : "text-gray-400 border-b border-gray-100"
            )}
          >
            <Clock size={11} />
            Recent searches
          </div>
          {results.map((result, index) => (
            <button
              key={result.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result.redditUsername);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                highlightedIndex === index
                  ? isDark
                    ? "bg-slate-800"
                    : "bg-gray-100"
                  : "hover:bg-slate-800/50"
              )}
            >
              {result.redditAvatar ? (
                <img
                  src={result.redditAvatar.split("?")[0]}
                  alt={result.redditUsername}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                />
              ) : (
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br from-orange-500 to-red-500"
                  )}
                >
                  <User size={14} className="text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium truncate",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  u/{result.redditUsername}
                </div>
                <div
                  className={cn(
                    "text-xs flex items-center gap-2",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {result.redditKarma != null && (
                    <span>{formatKarma(result.redditKarma)} karma</span>
                  )}
                  <span>{formatRelativeTime(result.searchedAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
