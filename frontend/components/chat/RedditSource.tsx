"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

interface RedditSourceProps {
  source: {
    title: string;
    text?: string;
    snippet?: string;
    url: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: string;
    permalink: string;
    thumbnail?: string;
  };
  index: number;
}

function getRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return dateStr;
  }
}

function getDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function RedditSource({ source }: RedditSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formatScore = (score: number) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  };

  const formatComments = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

  const hasImage = isImageUrl(source.url);
  const hasThumbnail = source.thumbnail && source.thumbnail !== "self" && source.thumbnail !== "default" && source.thumbnail !== "nsfw" && source.thumbnail.startsWith("http");
  const isLinkPost = source.url !== source.permalink && !hasImage;
  const domain = isLinkPost ? getDomain(source.url) : null;

  const previewText = source.text !== "[No text content; this is a link post]"
    ? (source.text || source.snippet)
    : source.snippet;

  return (
    <div className={cn(
      "rounded-[10px] overflow-hidden transition-all duration-200 border",
      isDark
        ? "bg-[var(--rc-bg-tertiary)] border-[var(--rc-border)] hover:bg-[var(--rc-bg-hover)] hover:border-[var(--rc-border-emphasis)]"
        : "bg-white border-[var(--rc-border)] shadow-[var(--rc-shadow-card)] hover:shadow-[var(--rc-shadow-card-hover)]"
    )}>
      <div className="p-3">
        <div className="flex gap-3">
          {/* Thumbnail */}
          {(hasThumbnail || hasImage) && (
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hasThumbnail ? source.thumbnail! : source.url}
                alt=""
                className="w-16 h-16 rounded-lg object-cover bg-[var(--rc-bg-hover)]"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-sm font-medium line-clamp-2 mb-1", isDark ? "text-[var(--rc-text)]" : "text-[var(--rc-text)]")}>
                  <a
                    href={source.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand transition-colors"
                  >
                    {source.title}
                  </a>
                </h4>
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="bg-brand text-white px-2 py-0.5 rounded font-medium">
                    r/{source.subreddit}
                  </span>
                  <span className={isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-tertiary)]"}>
                    u/{source.author}
                  </span>
                  <span className={isDark ? "text-[var(--rc-text-quaternary)]" : "text-[var(--rc-text-quaternary)]"}>
                    {getRelativeTime(source.created_utc)}
                  </span>
                  {domain && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
                      isDark ? "bg-[var(--rc-bg-hover)] text-[var(--rc-text-tertiary)]" : "bg-[var(--rc-bg-tertiary)] text-[var(--rc-text-tertiary)]"
                    )}>
                      <LinkIcon className="w-2.5 h-2.5" />
                      {domain}
                    </span>
                  )}
                </div>
              </div>
              <div className={cn("flex items-center gap-3 text-xs sm:ml-3", isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-tertiary)]")}>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{formatScore(source.score)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{formatComments(source.num_comments)}</span>
                </div>
              </div>
            </div>

            {previewText && (
              <div className="mt-2">
                <p className={cn(
                  "text-xs leading-relaxed transition-all duration-200",
                  isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]",
                  !isExpanded && "line-clamp-3"
                )}>
                  {previewText}
                </p>
                {previewText.length > 200 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-0.5 text-xs text-brand hover:text-brand-hover mt-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Show more <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={cn("flex items-center justify-between mt-2 pt-2 border-t", isDark ? "border-[var(--rc-border)]" : "border-[var(--rc-border)]")}>
          <a
            href={source.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:text-brand-hover transition-colors flex items-center gap-1"
          >
            Open on Reddit
            <ExternalLink className="w-3 h-3" />
          </a>
          {source.url !== source.permalink && !hasImage && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("text-xs transition-colors flex items-center gap-1", isDark ? "text-[var(--rc-text-secondary)] hover:text-[var(--rc-text)]" : "text-[var(--rc-text-secondary)] hover:text-[var(--rc-text)]")}
            >
              Original Link
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default RedditSource;
