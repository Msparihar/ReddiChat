import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDailyUsage, DEFAULT_LIMITS } from "@/lib/usage";
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
        messages: DEFAULT_LIMITS.maxMessagesPerDay,
        tokens: DEFAULT_LIMITS.maxTokensPerDay,
        uploads: DEFAULT_LIMITS.maxUploadsPerDay,
        uploadBytes: DEFAULT_LIMITS.maxUploadBytesPerDay,
      },
      resetAt,
    });
  } catch (error) {
    logger.error("Failed to fetch usage", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 });
  }
}
