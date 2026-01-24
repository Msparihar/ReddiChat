import { tool } from "ai";
import { z } from "zod";
import { searchReddit } from "@/lib/reddit";

export const searchRedditTool = tool({
  description: `Search Reddit for posts related to the query with optional subreddit filtering.
This tool searches Reddit for relevant posts and discussions based on your query.
It's particularly useful for finding recent discussions, opinions, and information from Reddit communities.`,
  inputSchema: z.object({
    query: z.string().describe("Search term or question to find relevant Reddit posts"),
    subreddits: z
      .array(z.string())
      .optional()
      .describe('Optional list of subreddit names to search in (e.g., ["MachineLearning", "technology"])'),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Maximum number of results to return (default: 5, max: 10)"),
    time_filter: z
      .enum(["day", "week", "month", "year", "all"])
      .default("month")
      .describe('Time period to search within ("day", "week", "month", "year", "all")'),
  }),
  execute: async ({ query, subreddits, limit = 5, time_filter = "month" }) => {
    const result = await searchReddit(query, subreddits, limit, time_filter);

    if (result.error) {
      return {
        error: result.error,
        query,
        results: [],
      };
    }

    return {
      query: result.query,
      results_count: result.resultsCount,
      posts: result.posts.map((post) => ({
        title: post.title,
        text: post.text,
        url: post.url,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        num_comments: post.numComments,
        created_utc: post.createdUtc,
        permalink: post.permalink,
      })),
      search_params: result.searchParams,
    };
  },
});
