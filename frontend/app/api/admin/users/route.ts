import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getDailyUsage } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger, generateRequestId } from "@/lib/logger";
import { asc } from "drizzle-orm";

const ADMIN_RATE_LIMIT = { maxRequests: 20, windowMs: 3600000 };

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimit = checkRateLimit(`admin:${session.user.id}`, ADMIN_RATE_LIMIT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(asc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Get usage for each user
    const usersWithUsage = await Promise.all(
      allUsers.map(async (u) => {
        const usage = await getDailyUsage(u.id);
        return {
          ...u,
          usage: {
            messages: usage.messageCount,
            tokens: usage.estimatedTokens,
            uploads: usage.uploadCount,
            uploadBytes: usage.uploadBytes,
          },
        };
      })
    );

    // Get total count
    const totalResult = await db.select({ id: user.id }).from(user);
    const total = totalResult.length;

    logger.info("Admin users list fetched", { requestId, userId: session.user.id, page, limit, total });

    return NextResponse.json({
      users: usersWithUsage,
      total,
      page,
      limit,
    });
  } catch (error) {
    logger.error("Admin users list failed", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
