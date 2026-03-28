import { NextRequest, NextResponse } from "next/server";
import { getRedditUserInfo } from "@/lib/reddit";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { redditUsernameSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    logger.info("Reddit user request", { endpoint: `/api/reddit/user/${username}`, username });

    // Validate username
    const usernameValidation = redditUsernameSchema.safeParse(username);
    if (!usernameValidation.success) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Rate limit by IP or username
    const rateLimit = checkRateLimit(`reddit:${username}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const result = await getRedditUserInfo(username);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to fetch Reddit user", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to fetch Reddit user data" },
      { status: 500 }
    );
  }
}
