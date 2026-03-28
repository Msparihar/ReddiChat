import { NextRequest, NextResponse } from "next/server";
import { searchReddit } from "@/lib/reddit";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { redditUsernameSchema } from "@/lib/validation";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subreddit: string }> }
) {
  const requestId = generateRequestId();

  try {
    const { subreddit } = await params;

    // Validate subreddit name (same pattern as username)
    const validation = redditUsernameSchema.safeParse(subreddit);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid subreddit name" }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`subreddit:${subreddit}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    logger.info("Subreddit data request", { requestId, subreddit });

    const result = await searchReddit("*", [subreddit], 10, "day");

    return NextResponse.json({
      subreddit,
      posts: result.posts.map((p) => ({
        title: p.title,
        text: p.text,
        score: p.score,
        numComments: p.numComments,
        permalink: p.permalink,
        subreddit: p.subreddit,
        createdUtc: p.createdUtc,
      })),
      error: result.error || null,
    });
  } catch (error) {
    logger.error("Subreddit data fetch failed", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to fetch subreddit data" }, { status: 500 });
  }
}
