import { tool } from "ai";
import { z } from "zod";
import { searchReddit } from "@/lib/reddit";

export const getTrendingTool = tool({
  description: `Get trending/hot discussions from a specific subreddit or across Reddit.
Returns recent popular posts ranked by engagement (score and comments).
Use when users ask "what's trending", "what's hot", or "what are people talking about" in a subreddit.`,
  inputSchema: z.object({
    subreddit: z
      .string()
      .optional()
      .describe("Subreddit to get trends from (e.g., 'technology'). Omit for all of Reddit."),
    time_filter: z
      .enum(["day", "week", "month"])
      .default("day")
      .describe("Time period for trending posts"),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(10)
      .describe("Number of trending posts to return"),
  }),
  execute: async ({ subreddit, time_filter = "day", limit = 10 }) => {
    try {
      const subs = subreddit ? [subreddit] : undefined;
      const result = await searchReddit("*", subs, limit, time_filter);

      if (result.error) {
        return {
          subreddit: subreddit || "all",
          error: result.error,
          posts: [],
        };
      }

      // Sort by engagement (score + comments)
      const sorted = result.posts
        .map((p) => ({
          title: p.title,
          text: p.text,
          subreddit: p.subreddit,
          score: p.score,
          numComments: p.numComments,
          permalink: p.permalink,
          createdUtc: p.createdUtc,
          engagement: p.score + p.numComments * 2,
        }))
        .sort((a, b) => b.engagement - a.engagement);

      return {
        subreddit: subreddit || "all",
        timeFilter: time_filter,
        postCount: sorted.length,
        posts: sorted,
        instruction: "Present these trending posts as a digest. For each post, highlight: the topic, why it's getting attention (high score, lots of comments), and a brief summary of the discussion. Group by theme if patterns emerge.",
      };
    } catch (error: any) {
      return {
        subreddit: subreddit || "all",
        error: `Trending fetch failed: ${error.message}`,
        posts: [],
      };
    }
  },
});
