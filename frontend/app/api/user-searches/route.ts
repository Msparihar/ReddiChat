import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userSearches } from "@/lib/db/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const conditions = [eq(userSearches.userId, session.user.id)];
    if (query) {
      conditions.push(ilike(userSearches.redditUsername, `${query}%`));
    }

    const results = await db
      .select({
        id: userSearches.id,
        redditUsername: userSearches.redditUsername,
        redditAvatar: userSearches.redditAvatar,
        redditKarma: userSearches.redditKarma,
        searchedAt: userSearches.searchedAt,
      })
      .from(userSearches)
      .where(and(...conditions))
      .orderBy(desc(userSearches.searchedAt))
      .limit(8);

    return NextResponse.json({ searches: results });
  } catch (error) {
    console.error("Error fetching user searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { redditUsername, redditAvatar, redditKarma } = body;

    if (!redditUsername || typeof redditUsername !== "string") {
      return NextResponse.json(
        { error: "redditUsername is required" },
        { status: 400 }
      );
    }

    const [result] = await db
      .insert(userSearches)
      .values({
        userId: session.user.id,
        redditUsername: redditUsername.trim(),
        redditAvatar: redditAvatar || null,
        redditKarma: redditKarma ?? null,
        searchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userSearches.userId, userSearches.redditUsername],
        set: {
          redditAvatar: sql`EXCLUDED.reddit_avatar`,
          redditKarma: sql`EXCLUDED.reddit_karma`,
          searchedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error recording user search:", error);
    return NextResponse.json(
      { error: "Failed to record search" },
      { status: 500 }
    );
  }
}
