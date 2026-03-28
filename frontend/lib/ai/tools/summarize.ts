import { tool } from "ai";
import { z } from "zod";
import { searchReddit } from "@/lib/reddit";

export const summarizeThreadTool = tool({
  description: `Summarize a Reddit thread or find and summarize discussions about a specific topic.
Use when users share a Reddit link, ask for a TLDR of a discussion, or want a summary of what people are saying about something.`,
  inputSchema: z.object({
    query: z.string().describe("The topic to find threads about, or keywords from a specific thread"),
    subreddit: z
      .string()
      .optional()
      .describe("Specific subreddit to search in"),
    limit: z
      .number()
      .min(1)
      .max(5)
      .default(3)
      .describe("Number of threads to summarize"),
  }),
  execute: async ({ query, subreddit, limit = 3 }) => {
    try {
      const subs = subreddit ? [subreddit] : undefined;
      const result = await searchReddit(query, subs, limit, "month");

      if (result.error || result.posts.length === 0) {
        return {
          query,
          error: result.error || "No threads found to summarize",
          threads: [],
        };
      }

      const threads = result.posts.map((p) => ({
        title: p.title,
        text: p.text,
        subreddit: p.subreddit,
        author: p.author,
        score: p.score,
        numComments: p.numComments,
        permalink: p.permalink,
        createdUtc: p.createdUtc,
      }));

      return {
        query,
        threadCount: threads.length,
        threads,
        instruction: "Provide a TLDR summary for each thread. Include: 1) Main topic/question, 2) Key points or arguments made, 3) Community consensus (if any), 4) Notable dissenting opinions, 5) Most actionable takeaway. Keep each summary concise but informative.",
      };
    } catch (error: any) {
      return {
        query,
        error: `Thread summary failed: ${error.message}`,
        threads: [],
      };
    }
  },
});
