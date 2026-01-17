/**
 * Streaming utilities for handling Server-Sent Events (SSE) from the chat API
 */

import { generateUUID } from "./utils";

export { generateUUID };

export interface SSEEvent {
  type: "content" | "tool_start" | "tool_end" | "done" | "error";
  delta?: string;
  tool?: string;
  content?: string;
  conversation_id?: string;
  message_id?: string;
  sources?: any[];
  tool_used?: string | null;
  file_attachments?: any[];
}

export interface StreamOptions {
  timeout?: number;
  heartbeatInterval?: number;
  maxRetries?: number;
}

/**
 * Parse SSE stream from fetch response with timeout and connection monitoring
 */
export async function parseSSEStream(
  response: Response,
  onEvent: (event: SSEEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  options: StreamOptions = {}
): Promise<void> {
  if (!response.body) {
    onError(new Error("Response body is not available"));
    return;
  }

  const { timeout = 30000, heartbeatInterval = 10000 } = options;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastActivity = Date.now();
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let timeoutTimer: NodeJS.Timeout | null = null;

  const resetTimeout = () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(() => {
      onError(new Error(`Stream timeout after ${timeout}ms`));
    }, timeout);
  };

  const startHeartbeat = () => {
    heartbeatTimer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > heartbeatInterval) {
        onError(new Error("Connection appears to be dead - no data received"));
      }
    }, heartbeatInterval);
  };

  const cleanup = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    reader.releaseLock();
  };

  try {
    resetTimeout();
    startHeartbeat();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          parseBuffer(buffer, onEvent, onError);
        }
        onComplete();
        break;
      }

      lastActivity = Date.now();
      resetTimeout();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        parseBuffer(line, onEvent, onError);
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    cleanup();
  }
}

function parseBuffer(
  line: string,
  onEvent: (event: SSEEvent) => void,
  onError: (error: Error) => void
): void {
  if (line.startsWith("data: ")) {
    const dataStr = line.slice(6).trim();

    if (dataStr === "[DONE]") {
      return;
    }

    try {
      const event = JSON.parse(dataStr) as SSEEvent;
      onEvent(event);
    } catch (parseError) {
      console.warn("Failed to parse SSE event:", dataStr, parseError);
    }
  }
}

/**
 * Handle streaming errors with fallback strategies
 */
export function handleStreamError(
  error: Error,
  fallbackCallback?: (message: string, canRetry: boolean) => void
): {
  type: "error";
  content: string;
  canRetry: boolean;
  errorType: string;
  originalError: Error;
} {
  console.error("Streaming error:", error);

  let errorMessage = "An error occurred while processing your message";
  let canRetry = true;
  let errorType = "unknown";

  if (error.name === "AbortError") {
    errorMessage = "Request was cancelled";
    canRetry = false;
    errorType = "cancelled";
  } else if (error.message.includes("timeout")) {
    errorMessage = "Request timed out - please try again";
    canRetry = true;
    errorType = "timeout";
  } else if (
    error.message.includes("fetch") ||
    error.message.includes("network")
  ) {
    errorMessage = "Network error - please check your connection";
    canRetry = true;
    errorType = "network";
  } else if (error.message.includes("parse")) {
    errorMessage = "Error parsing server response";
    canRetry = false;
    errorType = "parse";
  } else if (error.message.includes("dead")) {
    errorMessage = "Connection lost - please try again";
    canRetry = true;
    errorType = "connection";
  }

  if (fallbackCallback && typeof fallbackCallback === "function") {
    try {
      fallbackCallback(errorMessage, canRetry);
    } catch (fallbackError) {
      console.error("Fallback callback failed:", fallbackError);
    }
  }

  return {
    type: "error",
    content: errorMessage,
    canRetry,
    errorType,
    originalError: error,
  };
}

/**
 * Debounce function to limit update frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a timeout promise for stream operations
 */
export function createTimeout(
  ms: number,
  message: string = "Operation timed out"
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Validate SSE event structure
 */
export function validateSSEEvent(event: any): event is SSEEvent {
  if (!event || typeof event !== "object") {
    return false;
  }

  const validTypes = ["content", "tool_start", "tool_end", "done", "error"];
  return validTypes.includes(event.type);
}
