"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

  const previewText = source.text !== "[No text content; this is a link post]"
    ? (source.text || source.snippet)
    : source.snippet;

  return (
    <div className="bg-gray-750 border border-gray-600 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
      {isImageUrl(source.url) && (
        <div className="w-full h-32 overflow-hidden bg-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source.url}
            alt={source.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
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
        <div className="flex items-center gap-3 text-xs text-gray-400 sm:ml-3">
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
          <div>
            <p
              className={cn(
                "text-xs text-gray-300 leading-relaxed",
                !isExpanded && "line-clamp-2"
              )}
            >
              {previewText}
            </p>
            {previewText.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
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

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
        <a
          href={source.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          Open on Reddit
          <ExternalLink className="w-3 h-3" />
        </a>
        {source.url !== source.permalink && !isImageUrl(source.url) && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
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
