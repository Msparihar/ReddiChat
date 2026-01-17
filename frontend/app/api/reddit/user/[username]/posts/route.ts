import { NextRequest, NextResponse } from "next/server";
import { getUserPosts } from "@/lib/reddit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;
    const after = searchParams.get("after") || undefined;
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const result = await getUserPosts(username, after, limit);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Reddit user posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit user posts" },
      { status: 500 }
    );
  }
}
