import { logger } from "@/lib/logger";

interface SanitizedError {
  message: string;
  type: "rate_limit" | "auth" | "timeout" | "validation" | "provider" | "internal";
  retryable: boolean;
}

/**
 * Sanitize error messages before sending to client.
 * Never expose internal details, API keys, or stack traces.
 */
export function sanitizeError(error: unknown, requestId?: string): SanitizedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = err.message?.toLowerCase() || "";

  // Log the full error server-side
  logger.error("Error sanitized for client", {
    requestId,
    error: err.message,
    stack: err.stack?.split("\n")[0],
  });

  // Rate limit errors
  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("quota")) {
    return {
      message: "The AI service is busy. Please try again in a moment.",
      type: "rate_limit",
      retryable: true,
    };
  }

  // Auth/key errors
  if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("api key") || msg.includes("invalid key")) {
    return {
      message: "Service configuration error. Please contact support.",
      type: "auth",
      retryable: false,
    };
  }

  // Timeout errors
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("deadline")) {
    return {
      message: "Request timed out. Please try again.",
      type: "timeout",
      retryable: true,
    };
  }

  // Validation errors
  if (msg.includes("validation") || msg.includes("invalid") || msg.includes("required")) {
    return {
      message: "Invalid request. Please check your input and try again.",
      type: "validation",
      retryable: false,
    };
  }

  // Provider-specific errors (don't leak provider details)
  if (msg.includes("google") || msg.includes("openai") || msg.includes("gemini") || msg.includes("gpt")) {
    return {
      message: "AI service temporarily unavailable. Please try again.",
      type: "provider",
      retryable: true,
    };
  }

  // Default
  return {
    message: "Something went wrong. Please try again.",
    type: "internal",
    retryable: true,
  };
}
