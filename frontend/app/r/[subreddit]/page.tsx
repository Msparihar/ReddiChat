"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, MessageSquare, TrendingUp, Users, ExternalLink } from "lucide-react";

interface SubredditPost {
  title: string;
  score: number;
  numComments: number;
  permalink: string;
  subreddit: string;
  createdUtc: string;
  text: string;
}

export default function SubredditPage() {
  const params = useParams();
  const subreddit = params.subreddit as string;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [posts, setPosts] = useState<SubredditPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubredditData() {
      try {
        setIsLoading(true);
        // Use our existing API to search within the subreddit
        const res = await fetch(
          `/api/reddit/subreddit/${subreddit}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Failed to fetch subreddit data");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        setError("Failed to load subreddit data");
      } finally {
        setIsLoading(false);
      }
    }

    if (subreddit) fetchSubredditData();
  }, [subreddit]);

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[var(--rc-bg)] text-[var(--rc-text)]" : "bg-white text-[var(--rc-text)]")}>
      {/* Header */}
      <header className={cn("border-b px-6 py-4", isDark ? "border-[var(--rc-border)]" : "border-[var(--rc-border)]")}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/chat"
              className={cn("p-1.5 rounded-md transition-colors", isDark ? "hover:bg-[var(--rc-bg-hover)]" : "hover:bg-[var(--rc-bg-hover)]")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">r/{subreddit}</h1>
            <a
              href={`https://reddit.com/r/${subreddit}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("p-1.5 rounded-md transition-colors", isDark ? "hover:bg-[var(--rc-bg-hover)] text-[var(--rc-text-secondary)]" : "hover:bg-[var(--rc-bg-hover)] text-[var(--rc-text-tertiary)]")}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className={cn("text-sm", isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-tertiary)]")}>
            Community overview and recent discussions
          </p>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/chat?prompt=${encodeURIComponent(`What's trending in r/${subreddit} today?`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            What's trending?
          </Link>
          <Link
            href={`/chat?prompt=${encodeURIComponent(`What do people in r/${subreddit} think about the latest news?`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            Community sentiment
          </Link>
          <Link
            href={`/chat?prompt=${encodeURIComponent(`Give me a deep analysis of the r/${subreddit} community culture`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            <Users className="w-3 h-3" />
            Community culture
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn("h-24 rounded-lg animate-pulse", isDark ? "bg-[var(--rc-bg-secondary)]" : "bg-[var(--rc-bg-tertiary)]")} />
            ))}
          </div>
        ) : error ? (
          <div className={cn("text-center py-12", isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-tertiary)]")}>
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className={cn("text-lg font-semibold mb-4", isDark ? "text-[var(--rc-text)]" : "text-[var(--rc-text)]")}>
              Recent Discussions
            </h2>
            {posts.length === 0 ? (
              <p className={cn("text-sm", isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-secondary)]")}>
                No recent posts found
              </p>
            ) : (
              posts.map((post, i) => (
                <a
                  key={i}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block p-4 rounded-lg border transition-all",
                    isDark
                      ? "bg-[var(--rc-bg-secondary)] border-[var(--rc-border)] hover:border-[var(--rc-border-emphasis)]"
                      : "bg-white border-[var(--rc-border)] shadow-[var(--rc-shadow-card)] hover:shadow-[var(--rc-shadow-card-hover)]"
                  )}
                >
                  <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-[var(--rc-text)]" : "text-[var(--rc-text)]")}>
                    {post.title}
                  </h3>
                  {post.text && (
                    <p className={cn("text-xs mb-2 line-clamp-2", isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-tertiary)]")}>
                      {post.text}
                    </p>
                  )}
                  <div className={cn("flex items-center gap-3 text-xs", isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-secondary)]")}>
                    <span>{post.score} points</span>
                    <span>{post.numComments} comments</span>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating CTA */}
      <Link
        href={`/chat?prompt=${encodeURIComponent(`Tell me about the r/${subreddit} community`)}`}
        className="fixed bottom-6 right-6 bg-brand hover:bg-brand-hover text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:shadow-xl text-sm font-medium"
      >
        <MessageSquare className="w-4 h-4" />
        Ask about r/{subreddit}
      </Link>
    </div>
  );
}
