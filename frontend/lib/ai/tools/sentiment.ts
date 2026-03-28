import { tool } from "ai";
import { z } from "zod";
import { searchReddit } from "@/lib/reddit";

export const analyzeSentimentTool = tool({
  description: `Analyze community sentiment on a topic by searching Reddit and categorizing post/comment opinions.
Returns sentiment distribution (positive/negative/neutral percentages), key agreement points, and disagreement points.
Use this when users ask "what do people think about X" or want community consensus on a topic.`,
  inputSchema: z.object({
    topic: z.string().describe("The topic to analyze sentiment for"),
    subreddits: z
      .array(z.string())
      .optional()
      .describe("Optional subreddits to focus the analysis on"),
    time_filter: z
      .enum(["day", "week", "month", "year", "all"])
      .default("month")
      .describe("Time period to analyze"),
  }),
  execute: async ({ topic, subreddits, time_filter = "month" }) => {
    try {
      const result = await searchReddit(topic, subreddits, 10, time_filter);

      if (result.error || result.posts.length === 0) {
        return {
          topic,
          error: result.error || "No posts found for sentiment analysis",
          sentiment: null,
        };
      }

      // Build structured data for the AI to analyze
      const postSummaries = result.posts.map((post) => ({
        title: post.title,
        text: post.text,
        subreddit: post.subreddit,
        score: post.score,
        numComments: post.numComments,
        permalink: post.permalink,
      }));

      return {
        topic,
        postCount: postSummaries.length,
        posts: postSummaries,
        searchParams: result.searchParams,
        instruction: "Analyze these posts and provide: 1) Overall sentiment distribution (positive/negative/neutral percentages), 2) Key points people agree on, 3) Key disagreements or controversial aspects, 4) Notable subreddit-specific viewpoints if multiple subreddits are represented.",
      };
    } catch (error: any) {
      return {
        topic,
        error: `Sentiment analysis failed: ${error.message}`,
        sentiment: null,
      };
    }
  },
});
