import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, ModelMessage, ToolResultPart, stepCountIs } from "ai";
import { SYSTEM_PROMPT } from "./system-prompt";
import { searchRedditTool } from "./tools/reddit";
import { webSearchTool } from "./tools/web-search";
import { appendFileSync } from "fs";
import { join } from "path";

const LOG_FILE = join(process.cwd(), "chat-stream.log");

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] [agent] ${message}\n${JSON.stringify(data, null, 2)}\n\n`
    : `[${timestamp}] [agent] ${message}\n`;
  appendFileSync(LOG_FILE, logLine);
}

log("Gemini API Key present:", !!process.env.GEMINI_API_KEY);

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = google("gemini-2.0-flash");

export const tools = {
  search_reddit: searchRedditTool,
  web_search: webSearchTool,
};

export type ToolName = keyof typeof tools;

export interface StreamChatOptions {
  messages: ModelMessage[];
  onToolStart?: (toolName: string) => void;
  onToolEnd?: (toolName: string, result: any) => void;
}

export async function streamChatResponse(options: StreamChatOptions) {
  const { messages, onToolStart, onToolEnd } = options;

  log("streamChatResponse called with messages count:", messages.length);
  log("Using model: gemini-2.0-flash");

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(5),
      onChunk: async ({ chunk }) => {
        log("Chunk received", { type: chunk.type });
      },
      onStepStart: async ({ stepType }) => {
        log(`Step started: ${stepType}`);
      },
      onStepFinish: async ({ stepType, text, toolCalls, toolResults, finishReason, response }) => {
        log("Step finished", {
          stepType,
          textLength: text?.length,
          finishReason,
          toolCallsCount: toolCalls?.length,
          responseId: response?.id,
        });
        if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
            log(`Tool call: ${call.toolName}`, call.args);
            onToolStart?.(call.toolName);
          }
        }
        if (toolResults && toolResults.length > 0) {
          for (const result of toolResults as ToolResultPart[]) {
            onToolEnd?.(result.toolName, result.result);
          }
        }
      },
      onFinish: async ({ text, finishReason, usage, response }) => {
        log("Stream finished", {
          textLength: text?.length,
          finishReason,
          usage,
          responseId: response?.id,
        });
      },
      onError: async ({ error }) => {
        log("Stream error callback", { error: String(error) });
      },
    });

    log("streamText returned result object");
    return result;
  } catch (error: any) {
    log("streamText error", { message: error.message, stack: error.stack });
    throw error;
  }
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
