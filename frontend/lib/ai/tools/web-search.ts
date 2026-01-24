import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const webSearchTool = tool({
  description: `Search the web for current information, news, and articles related to the query.
This tool searches the web for relevant, up-to-date information using Tavily's AI-optimized search.`,
  inputSchema: z.object({
    query: z.string().describe("Search term to find relevant web results"),
    num_results: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Maximum number of results to return (default: 5, max: 10)"),
  }),
  execute: async ({ query, num_results = 5 }) => {
    try {
      const response = await tavilyClient.search(query, {
        maxResults: num_results,
        includeAnswer: true,
      });

      const results = response.results.map((result) => ({
        title: result.title,
        snippet: result.content,
        url: result.url,
        score: result.score,
      }));

      return {
        query,
        answer: response.answer,
        results_count: results.length,
        results,
      };
    } catch (error: any) {
      console.error("Web search error:", error);
      return {
        query,
        error: `Web search failed: ${error.message}`,
        results_count: 0,
        results: [],
      };
    }
  },
});
