import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDailyUsage } from "@/lib/usage";
import { getTierLimits, UserRole } from "@/lib/tiers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = ((session.user as any).role || "free") as UserRole;
    const tierLimits = getTierLimits(userRole);

    const rateLimit = checkRateLimit(`usage:${userId}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const usage = await getDailyUsage(userId);

    // Calculate resetAt — midnight UTC of the next day
    const today = new Date().toISOString().split("T")[0];
    const resetAt = new Date(new Date(today + "T00:00:00Z").getTime() + 86400000).toISOString();

    logger.info("Usage data fetched", { requestId, userId });

    return NextResponse.json({
      usage: {
        messages: usage.messageCount,
        tokens: usage.estimatedTokens,
        uploads: usage.uploadCount,
        uploadBytes: usage.uploadBytes,
      },
      limits: {
        messages: tierLimits.maxMessagesPerDay,
        tokens: tierLimits.maxTokensPerDay,
        uploads: tierLimits.maxUploadsPerDay,
        uploadBytes: tierLimits.maxUploadBytesPerDay,
      },
      role: userRole,
      resetAt,
    });
  } catch (error) {
    logger.error("Failed to fetch usage", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 });
  }
}
