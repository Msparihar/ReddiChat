import { tool } from "ai";
import { z } from "zod";
import { searchReddit } from "@/lib/reddit";

export const compareSubredditsTool = tool({
  description: `Compare how different subreddit communities view the same topic.
Searches the same query across 2-5 subreddits and returns posts from each for comparison.
Use when users ask "how does r/X vs r/Y view Z" or want to compare community perspectives.`,
  inputSchema: z.object({
    topic: z.string().describe("The topic to compare across communities"),
    subreddits: z
      .array(z.string())
      .min(2)
      .max(5)
      .describe("List of 2-5 subreddits to compare (e.g., ['investing', 'wallstreetbets'])"),
    time_filter: z
      .enum(["day", "week", "month", "year", "all"])
      .default("month")
      .describe("Time period to search"),
  }),
  execute: async ({ topic, subreddits, time_filter = "month" }) => {
    try {
      const results = await Promise.all(
        subreddits.map(async (sub) => {
          const result = await searchReddit(topic, [sub], 5, time_filter);
          return {
            subreddit: sub,
            postCount: result.posts.length,
            posts: result.posts.map((p) => ({
              title: p.title,
              text: p.text,
              score: p.score,
              numComments: p.numComments,
              permalink: p.permalink,
            })),
            error: result.error || null,
          };
        })
      );

      return {
        topic,
        subreddits: results,
        instruction: "Compare the perspectives across these subreddits. For each community, identify: 1) Their general stance on the topic, 2) Unique viewpoints not seen in other communities, 3) Key differences in tone, risk tolerance, or terminology. Provide a structured comparison.",
      };
    } catch (error: any) {
      return {
        topic,
        error: `Subreddit comparison failed: ${error.message}`,
        subreddits: [],
      };
    }
  },
});
