import { tool } from "ai";
import { z } from "zod";
import { search, SafeSearchType } from "duck-duck-scrape";

export const webSearchTool = tool({
  description: `Search the web using DuckDuckGo for current information and news related to the query.
This tool searches the web for relevant, current information and news articles.`,
  parameters: z.object({
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
      const searchResults = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      const results = searchResults.results.slice(0, num_results).map((result) => ({
        title: result.title,
        snippet: result.description,
        url: result.url,
        source: result.hostname || new URL(result.url).hostname,
      }));

      return {
        query,
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
