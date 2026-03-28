import { logger } from "@/lib/logger";

const MAX_INPUT_TOKENS = 32000;
const RESPONSE_RESERVE = 8000;
const SYSTEM_PROMPT_RESERVE = 2000;
const AVAILABLE_FOR_HISTORY = MAX_INPUT_TOKENS - RESPONSE_RESERVE - SYSTEM_PROMPT_RESERVE;

// Rough token estimate: ~4 chars per token for English text
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface TruncationResult {
  messages: Array<{ role: string; content: string }>;
  totalEstimatedTokens: number;
  messagesDropped: number;
  originalMessageCount: number;
}

/**
 * Truncate conversation history to fit within token budget.
 * Always keeps the current (last) message. Drops oldest messages first.
 */
export function truncateHistory(
  historyMessages: Array<{ role: string; content: string }>,
  currentMessageTokens: number,
  requestId?: string
): TruncationResult {
  const budgetForHistory = AVAILABLE_FOR_HISTORY - currentMessageTokens;
  const originalCount = historyMessages.length;

  if (budgetForHistory <= 0) {
    // Current message alone exceeds budget — send only current message
    logger.warn("Current message exceeds history budget", {
      requestId,
      currentMessageTokens,
      budgetForHistory: AVAILABLE_FOR_HISTORY,
    });
    return {
      messages: [],
      totalEstimatedTokens: currentMessageTokens,
      messagesDropped: originalCount,
      originalMessageCount: originalCount,
    };
  }

  // Calculate tokens for each message
  const messagesWithTokens = historyMessages.map(msg => ({
    ...msg,
    tokens: estimateTokens(msg.content),
  }));

  // Start from the most recent and work backwards, adding messages until budget exhausted
  const kept: typeof messagesWithTokens = [];
  let usedTokens = 0;

  for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
    const msg = messagesWithTokens[i];
    if (usedTokens + msg.tokens <= budgetForHistory) {
      kept.unshift(msg);
      usedTokens += msg.tokens;
    } else {
      break; // Stop once we can't fit more
    }
  }

  const dropped = originalCount - kept.length;

  if (dropped > 0) {
    logger.info("Truncated conversation history", {
      requestId,
      originalMessageCount: originalCount,
      keptMessages: kept.length,
      messagesDropped: dropped,
      historyTokens: usedTokens,
      currentMessageTokens,
      totalEstimatedTokens: usedTokens + currentMessageTokens,
    });
  }

  return {
    messages: kept.map(({ tokens, ...msg }) => msg),
    totalEstimatedTokens: usedTokens + currentMessageTokens,
    messagesDropped: dropped,
    originalMessageCount: originalCount,
  };
}

/**
 * Estimate total tokens for a message that may include text and images.
 * Images are roughly 1000 tokens each (conservative estimate).
 */
export function estimateMessageTokens(
  text: string,
  imageCount: number = 0
): number {
  const textTokens = estimateTokens(text);
  const imageTokens = imageCount * 1000;
  return textTokens + imageTokens;
}

/**
 * Cap a single message's text to a maximum token count.
 * Returns truncated text if over limit.
 */
export function capMessageLength(
  text: string,
  maxTokens: number = 5000
): { text: string; wasTruncated: boolean } {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) {
    return { text, wasTruncated: false };
  }

  // Truncate to approximate char count for maxTokens
  const maxChars = maxTokens * 4;
  return {
    text: text.substring(0, maxChars) + "...[truncated]",
    wasTruncated: true,
  };
}
