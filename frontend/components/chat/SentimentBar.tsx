"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

interface SentimentBarProps {
  topic: string;
  positive: number;
  negative: number;
  neutral: number;
  agreements?: string[];
  disagreements?: string[];
}

export function SentimentBar({ topic, positive, negative, neutral, agreements, disagreements }: SentimentBarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const total = positive + negative + neutral;
  const pPct = total > 0 ? Math.round((positive / total) * 100) : 0;
  const nPct = total > 0 ? Math.round((negative / total) * 100) : 0;
  const neuPct = total > 0 ? 100 - pPct - nPct : 0;

  return (
    <div className={cn(
      "rounded-[10px] p-4 my-3 border",
      isDark ? "bg-[var(--rc-bg-tertiary)] border-[var(--rc-border)]" : "bg-[var(--rc-bg-secondary)] border-[var(--rc-border)] shadow-[var(--rc-shadow-card)]"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs font-medium tracking-wide uppercase", isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-secondary)]")}>
          Community Sentiment
        </span>
        <span className={cn("text-xs", isDark ? "text-[var(--rc-text-tertiary)]" : "text-[var(--rc-text-tertiary)]")}>
          {topic}
        </span>
      </div>

      {/* Bar */}
      <div className={cn("w-full h-2 rounded-full overflow-hidden flex", isDark ? "bg-[var(--rc-bg-hover)]" : "bg-[var(--rc-bg-tertiary)]")}>
        {pPct > 0 && (
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pPct}%` }} />
        )}
        {neuPct > 0 && (
          <div className={cn("h-full transition-all duration-500", isDark ? "bg-[#4a4a52]" : "bg-[#c8c8ce]")} style={{ width: `${neuPct}%` }} />
        )}
        {nPct > 0 && (
          <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${nPct}%` }} />
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className={isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]"}>Positive {pPct}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", isDark ? "bg-[#4a4a52]" : "bg-[#c8c8ce]")} />
            <span className={isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]"}>Neutral {neuPct}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className={isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]"}>Negative {nPct}%</span>
          </span>
        </div>
      </div>

      {/* Key points */}
      {(agreements?.length || disagreements?.length) ? (
        <div className={cn("mt-3 pt-3 border-t space-y-2", isDark ? "border-[var(--rc-border)]" : "border-[var(--rc-border)]")}>
          {agreements && agreements.length > 0 && (
            <div>
              <span className="text-xs font-medium text-emerald-500">Key agreements:</span>
              <ul className={cn("text-xs mt-1 space-y-0.5 ml-3", isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]")}>
                {agreements.slice(0, 3).map((a, i) => <li key={i} className="list-disc">{a}</li>)}
              </ul>
            </div>
          )}
          {disagreements && disagreements.length > 0 && (
            <div>
              <span className="text-xs font-medium text-red-500">Key disagreements:</span>
              <ul className={cn("text-xs mt-1 space-y-0.5 ml-3", isDark ? "text-[var(--rc-text-secondary)]" : "text-[var(--rc-text-secondary)]")}>
                {disagreements.slice(0, 3).map((d, i) => <li key={i} className="list-disc">{d}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
