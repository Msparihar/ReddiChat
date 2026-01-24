import { NextRequest, NextResponse } from "next/server";
import { getUserComments, SortOption, TimeFilter } from "@/lib/reddit";

const validSorts: SortOption[] = ["new", "hot", "top", "controversial"];
const validTimes: TimeFilter[] = ["hour", "day", "week", "month", "year", "all"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
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

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const result = await getUserComments(username, after, limit, sort, time);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Reddit user comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit user comments" },
      { status: 500 }
    );
  }
}
