import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { paginationSchema, conversationTitleSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`reddit:${session.user.id}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const params = paginationSchema.safeParse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });
    const limit = params.success ? params.data.limit : 50;
    const offset = params.success ? params.data.offset : 0;

    const userConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, session.user.id))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      conversations: userConversations,
      total: userConversations.length,
    });
  } catch (error) {
    logger.error("Failed to fetch conversations", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
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

    const rateLimit = checkRateLimit(`reddit:${session.user.id}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const titleValidation = conversationTitleSchema.safeParse(body);
    if (!titleValidation.success) {
      return NextResponse.json({ error: titleValidation.error.errors[0]?.message || "Invalid title" }, { status: 400 });
    }

    const { title } = body;

    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId: session.user.id,
        title,
      })
      .returning();

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    logger.error("Failed to create conversation", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
