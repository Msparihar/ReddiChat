import crypto from "crypto";

export function generateRequestId(): string {
  return crypto.randomUUID();
}

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  userId?: string;
  endpoint?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  [key: string]: any;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };
  return JSON.stringify(logEntry);
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(formatLog("error", message, context));
  },
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, context));
    }
  },
};

export function withRequestLogging(
  endpoint: string,
  userId: string | undefined,
  fn: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  const requestId = generateRequestId();
  return fn().then(
    (response) => {
      logger.info("Request completed", {
        requestId,
        endpoint,
        userId,
        duration: Date.now() - start,
        statusCode: response.status,
      });
      return response;
    },
    (error) => {
      logger.error("Request failed", {
        requestId,
        endpoint,
        userId,
        duration: Date.now() - start,
        error: error?.message || String(error),
      });
      throw error;
    }
  );
}
