import { db } from "@/lib/db";
import { usageTracking } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getTierLimits, UserRole } from "@/lib/tiers";

export interface UsageLimits {
  maxMessagesPerDay: number;
  maxTokensPerDay: number;
  maxUploadsPerDay: number;
  maxUploadBytesPerDay: number;
}

export const DEFAULT_LIMITS: UsageLimits = getTierLimits("free");

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
  limits?: UsageLimits,
  role: UserRole = "free"
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  const effectiveLimits = limits || getTierLimits(role);

  // Admin/unlimited tier — skip checks
  if (effectiveLimits.maxMessagesPerDay === Infinity && type === "message") {
    return { allowed: true };
  }
  if (effectiveLimits.maxUploadsPerDay === Infinity && type === "upload") {
    return { allowed: true };
  }

  const usage = await getDailyUsage(userId);

  if (type === "message") {
    if (usage.messageCount >= effectiveLimits.maxMessagesPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.messageCount}/${effectiveLimits.maxMessagesPerDay} messages today. Resets at midnight UTC.`,
        current: usage.messageCount,
        limit: effectiveLimits.maxMessagesPerDay,
      };
    }
    if (usage.estimatedTokens >= effectiveLimits.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.estimatedTokens.toLocaleString()}/${effectiveLimits.maxTokensPerDay.toLocaleString()} tokens today. Resets at midnight UTC.`,
        current: usage.estimatedTokens,
        limit: effectiveLimits.maxTokensPerDay,
      };
    }
  }

  if (type === "upload") {
    if (usage.uploadCount >= effectiveLimits.maxUploadsPerDay) {
      return {
        allowed: false,
        reason: `You've used ${usage.uploadCount}/${effectiveLimits.maxUploadsPerDay} uploads today. Resets at midnight UTC.`,
        current: usage.uploadCount,
        limit: effectiveLimits.maxUploadsPerDay,
      };
    }
    if (usage.uploadBytes >= effectiveLimits.maxUploadBytesPerDay) {
      return {
        allowed: false,
        reason: `You've used ${formatBytes(usage.uploadBytes)}/${formatBytes(effectiveLimits.maxUploadBytesPerDay)} of daily upload quota. Resets at midnight UTC.`,
        current: usage.uploadBytes,
        limit: effectiveLimits.maxUploadBytesPerDay,
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
