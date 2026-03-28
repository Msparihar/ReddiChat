import { db } from "@/lib/db";
import { usageTracking } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export interface UsageLimits {
  maxMessagesPerDay: number;
  maxTokensPerDay: number;
  maxUploadsPerDay: number;
  maxUploadBytesPerDay: number;
}

export const DEFAULT_LIMITS: UsageLimits = {
  maxMessagesPerDay: 100,
  maxTokensPerDay: 500000,
  maxUploadsPerDay: 50,
  maxUploadBytesPerDay: 100 * 1024 * 1024, // 100MB
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]; // "2026-03-28"
}

export async function getDailyUsage(userId: string) {
  const today = getTodayDate();

  const [usage] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.date, today)
      )
    );

  return usage || {
    messageCount: 0,
    estimatedTokens: 0,
    uploadCount: 0,
    uploadBytes: 0,
  };
}

function formatBytes(bytes: number): string {
  const mb = Math.round(bytes / (1024 * 1024));
  return `${mb}MB`;
}

export async function checkDailyLimit(
  userId: string,
  type: "message" | "upload",
  limits: UsageLimits = DEFAULT_LIMITS
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  const usage = await getDailyUsage(userId);

  if (type === "message") {
    if (usage.messageCount >= limits.maxMessagesPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.messageCount}/${limits.maxMessagesPerDay} messages today. Resets at midnight UTC.`,
        current: usage.messageCount,
        limit: limits.maxMessagesPerDay,
      };
    }
    if (usage.estimatedTokens >= limits.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.estimatedTokens.toLocaleString()}/${limits.maxTokensPerDay.toLocaleString()} tokens today. Resets at midnight UTC.`,
        current: usage.estimatedTokens,
        limit: limits.maxTokensPerDay,
      };
    }
  }

  if (type === "upload") {
    if (usage.uploadCount >= limits.maxUploadsPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.uploadCount}/${limits.maxUploadsPerDay} uploads today. Resets at midnight UTC.`,
        current: usage.uploadCount,
        limit: limits.maxUploadsPerDay,
      };
    }
    if (usage.uploadBytes >= limits.maxUploadBytesPerDay) {
      return {
        allowed: false,
        reason: `You've used ${formatBytes(usage.uploadBytes)}/${formatBytes(limits.maxUploadBytesPerDay)} of daily upload quota. Resets at midnight UTC.`,
        current: usage.uploadBytes,
        limit: limits.maxUploadBytesPerDay,
      };
    }
  }

  return { allowed: true };
}

export async function trackMessageUsage(
  userId: string,
  estimatedTokens: number
): Promise<void> {
  const today = getTodayDate();

  try {
    await db
      .insert(usageTracking)
      .values({
        userId,
        date: today,
        messageCount: 1,
        estimatedTokens,
        uploadCount: 0,
        uploadBytes: 0,
      })
      .onConflictDoUpdate({
        target: [usageTracking.userId, usageTracking.date],
        set: {
          messageCount: sql`${usageTracking.messageCount} + 1`,
          estimatedTokens: sql`${usageTracking.estimatedTokens} + ${estimatedTokens}`,
        },
      });
  } catch (error) {
    logger.error("Failed to track message usage", {
      userId,
      error: (error as Error)?.message,
    });
  }
}

export async function trackUploadUsage(
  userId: string,
  fileCount: number,
  totalBytes: number
): Promise<void> {
  const today = getTodayDate();

  try {
    await db
      .insert(usageTracking)
      .values({
        userId,
        date: today,
        messageCount: 0,
        estimatedTokens: 0,
        uploadCount: fileCount,
        uploadBytes: totalBytes,
      })
      .onConflictDoUpdate({
        target: [usageTracking.userId, usageTracking.date],
        set: {
          uploadCount: sql`${usageTracking.uploadCount} + ${fileCount}`,
          uploadBytes: sql`${usageTracking.uploadBytes} + ${totalBytes}`,
        },
      });
  } catch (error) {
    logger.error("Failed to track upload usage", {
      userId,
      error: (error as Error)?.message,
    });
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
