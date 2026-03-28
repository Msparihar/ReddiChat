import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger, generateRequestId } from "@/lib/logger";
import { sendContactEmail } from "@/lib/email";

const contactSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const rateLimit = checkRateLimit(`contact:${userId}`, RATE_LIMITS.contact);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. You can send 5 contact messages per day." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { subject, message } = validation.data;

    await sendContactEmail(userEmail, subject, message);

    logger.info("Contact email sent", { requestId, userId, subject });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Contact email failed", { requestId, error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
