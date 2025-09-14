/**
 * Streaming utilities for handling Server-Sent Events (SSE) from the chat API
 */

/**
 * Generate a UUID for message IDs
 * @returns {string} A UUID string
 */
export function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parse SSE stream from fetch response with timeout and connection monitoring
 * @param {Response} response - The fetch response object
 * @param {Function} onEvent - Callback function for each parsed event
 * @param {Function} onError - Callback function for errors
 * @param {Function} onComplete - Callback function when stream completes
 * @param {Object} options - Configuration options
 */
export async function parseSSEStream(
  response,
  onEvent,
  onError,
  onComplete,
  options = {}
) {
  if (!response.body) {
    onError(new Error("Response body is not available"));
    return;
  }

  const {
    timeout = 30000, // 30 seconds timeout
    heartbeatInterval = 10000, // 10 seconds heartbeat
    maxRetries = 3,
  } = options;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastActivity = Date.now();
  let heartbeatTimer = null;
  let timeoutTimer = null;

  // Set up timeout
  const resetTimeout = () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(() => {
      onError(new Error(`Stream timeout after ${timeout}ms`));
    }, timeout);
  };

  // Set up heartbeat monitoring
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
        // Handle remaining buffer
        if (buffer.trim()) {
          parseBuffer(buffer, onEvent, onError, onComplete);
        }
        onComplete();
        break;
      }

      lastActivity = Date.now();
      resetTimeout(); // Reset timeout on activity

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      // Process complete lines
      for (const line of lines) {
        parseBuffer(line, onEvent, onError, onComplete);
      }
    }
  } catch (error) {
    onError(error);
  } finally {
    cleanup();
  }
}

/**
 * Parse a single line from the SSE buffer
 * @param {string} line - The line to parse
 * @param {Function} onEvent - Callback function for parsed events
 * @param {Function} onError - Callback function for errors
 * @param {Function} onComplete - Callback function for completion
 */
function parseBuffer(line, onEvent, onError, onComplete) {
  if (line.startsWith("data: ")) {
    const dataStr = line.slice(6).trim();

    if (dataStr === "[DONE]") {
      onComplete();
      return;
    }

    try {
      const event = JSON.parse(dataStr);
      onEvent(event);
    } catch (parseError) {
      console.warn("Failed to parse SSE event:", dataStr, parseError);
      // Don't treat parse errors as fatal - continue processing
    }
  }
}

/**
 * Handle streaming errors with fallback strategies
 * @param {Error} error - The error that occurred
 * @param {Function} fallbackCallback - Callback to execute fallback behavior
 * @returns {Object} Error handling result
 */
export function handleStreamError(error, fallbackCallback) {
  console.error("Streaming error:", error);

  // Determine error type and appropriate response
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

  // Execute fallback if provided
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
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
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
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message for timeout
 * @returns {Promise} Promise that rejects after timeout
 */
export function createTimeout(ms, message = "Operation timed out") {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Validate SSE event structure
 * @param {Object} event - The event to validate
 * @returns {boolean} Whether the event is valid
 */
export function validateSSEEvent(event) {
  if (!event || typeof event !== "object") {
    return false;
  }

  const validTypes = ["content", "tool_start", "tool_end", "done", "error"];
  return validTypes.includes(event.type);
}
