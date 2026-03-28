import { NextRequest, NextResponse } from "next/server";
import { getUserPosts, SortOption, TimeFilter } from "@/lib/reddit";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { redditUsernameSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

const validSorts: SortOption[] = ["new", "hot", "top", "controversial"];
const validTimes: TimeFilter[] = ["hour", "day", "week", "month", "year", "all"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    logger.info("Reddit user posts request", { endpoint: `/api/reddit/user/${username}/posts`, username });

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

    const searchParams = request.nextUrl.searchParams;
    const after = searchParams.get("after") || undefined;
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const sortParam = searchParams.get("sort") || "new";
    const timeParam = searchParams.get("time") || undefined;

    // Validate sort
    const sort: SortOption = validSorts.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : "new";

    // Validate time (only relevant for top/controversial)
    const time: TimeFilter | undefined =
      timeParam && validTimes.includes(timeParam as TimeFilter)
        ? (timeParam as TimeFilter)
        : undefined;

    const result = await getUserPosts(username, after, limit, sort, time);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to fetch Reddit user posts", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to fetch Reddit user posts" },
      { status: 500 }
    );
  }
}
