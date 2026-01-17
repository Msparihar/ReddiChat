"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RedditSourceProps {
  source: {
    title: string;
    text?: string;
    url: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: string;
    permalink: string;
  };
  index: number;
}

export function RedditSource({ source }: RedditSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const formatComments = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="bg-gray-750 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-200 line-clamp-2 mb-1">
            <a
              href={source.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              {source.title}
            </a>
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="bg-orange-600 text-white px-2 py-0.5 rounded font-medium">
              r/{source.subreddit}
            </span>
            <span>u/{source.author}</span>
            <span>•</span>
            <span>{source.created_utc}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 ml-3">
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

      {source.text &&
        source.text !== "[No text content; this is a link post]" && (
          <div>
            <p
              className={cn(
                "text-xs text-gray-300 leading-relaxed",
                !isExpanded && "line-clamp-2"
              )}
            >
              {source.text}
            </p>
            {source.text.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
        <a
          href={source.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          View on Reddit
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        {source.url !== source.permalink && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            Original Link
          </a>
        )}
      </div>
    </div>
  );
}

export default RedditSource;
