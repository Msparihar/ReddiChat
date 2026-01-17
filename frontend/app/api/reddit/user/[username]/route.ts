import { NextRequest, NextResponse } from "next/server";
import { getRedditUserInfo } from "@/lib/reddit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
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
    console.error("Error fetching Reddit user:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit user data" },
      { status: 500 }
    );
  }
}
