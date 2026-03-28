import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger, generateRequestId } from "@/lib/logger";

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(50, "Name too long (max 50 chars)"),
});

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rateLimit = checkRateLimit(`profile:${userId}`, RATE_LIMITS.reddit);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { displayName } = validation.data;

    const [updated] = await db
      .update(user)
      .set({ name: displayName, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("Profile updated", { requestId, userId });

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error("Profile update failed", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
