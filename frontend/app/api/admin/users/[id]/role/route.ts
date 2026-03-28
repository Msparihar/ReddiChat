import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger, generateRequestId } from "@/lib/logger";

const ADMIN_RATE_LIMIT = { maxRequests: 20, windowMs: 3600000 };

const updateRoleSchema = z.object({
  role: z.enum(["free", "pro", "team", "admin"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: targetUserId } = await params;

    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid role" },
        { status: 400 }
      );
    }

    const { role: newRole } = validation.data;

    // Get current role for logging
    const [currentUser] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, targetUserId));

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldRole = currentUser.role;

    const [updated] = await db
      .update(user)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(user.id, targetUserId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

    logger.info("Admin role change", {
      requestId,
      adminId: session.user.id,
      targetUserId,
      oldRole,
      newRole,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error("Admin role change failed", { requestId, error: (error as Error)?.message });
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
