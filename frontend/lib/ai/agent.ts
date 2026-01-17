import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, CoreMessage, ToolResultPart } from "ai";
import { SYSTEM_PROMPT } from "./system-prompt";
import { searchRedditTool } from "./tools/reddit";
import { webSearchTool } from "./tools/web-search";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const model = google("gemini-2.0-flash");

export const tools = {
  search_reddit: searchRedditTool,
  web_search: webSearchTool,
};

export type ToolName = keyof typeof tools;

export interface StreamChatOptions {
  messages: CoreMessage[];
  onToolStart?: (toolName: string) => void;
  onToolEnd?: (toolName: string, result: any) => void;
}

export async function streamChatResponse(options: StreamChatOptions) {
  const { messages, onToolStart, onToolEnd } = options;

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
    onStepFinish: async ({ toolCalls, toolResults }) => {
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          onToolStart?.(call.toolName);
        }
      }
      if (toolResults && toolResults.length > 0) {
        for (const result of toolResults as ToolResultPart[]) {
          onToolEnd?.(result.toolName, result.result);
        }
      }
    },
  });

  return result;
}

export function extractSources(toolResults: any[]): any[] {
  const sources: any[] = [];

  for (const result of toolResults) {
    if (result.toolName === "search_reddit" && result.result?.posts) {
      for (const post of result.result.posts) {
        sources.push({
          type: "reddit",
          title: post.title,
          url: post.permalink,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          num_comments: post.num_comments,
        });
      }
    }
    if (result.toolName === "web_search" && result.result?.results) {
      for (const item of result.result.results) {
        sources.push({
          type: "web",
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          source: item.source,
        });
      }
    }
  }

  return sources;
}
