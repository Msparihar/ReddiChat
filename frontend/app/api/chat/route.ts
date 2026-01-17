import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { CoreMessage } from "ai";
import { streamChatResponse, extractSources } from "@/lib/ai/agent";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, attachments } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      const [newConv] = await db
        .insert(conversations)
        .values({
          userId: session.user.id,
          title,
        })
        .returning();
      convId = newConv.id;
    }

    // Save user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        userId: session.user.id,
        content: message,
        role: "user",
        hasAttachments: attachments && attachments.length > 0,
      })
      .returning();

    // Build messages array for AI
    const aiMessages: CoreMessage[] = [
      {
        role: "user",
        content: message,
      },
    ];

    // If there are attachments, include them
    if (attachments && attachments.length > 0) {
      const content: any[] = [{ type: "text", text: message }];
      for (const attachment of attachments) {
        if (attachment.mimeType.startsWith("image/")) {
          content.push({
            type: "image",
            image: attachment.s3Url,
          });
        }
      }
      aiMessages[0] = {
        role: "user",
        content,
      };
    }

    // Stream AI response
    let toolUsed: string | null = null;
    let allSources: any[] = [];

    const result = await streamChatResponse({
      messages: aiMessages,
      onToolStart: (name) => {
        toolUsed = name;
      },
      onToolEnd: (name, result) => {
        if (result) {
          const sources = extractSources([{ toolName: name, result }]);
          allSources.push(...sources);
        }
      },
    });

    // Collect full response
    let fullContent = "";
    for await (const chunk of result.textStream) {
      fullContent += chunk;
    }

    // Save assistant message
    const [assistantMessage] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        userId: session.user.id,
        content: fullContent,
        role: "assistant",
        sources: allSources.length > 0 ? allSources : null,
        toolUsed,
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));

    return NextResponse.json({
      conversationId: convId,
      message: {
        id: assistantMessage.id,
        content: fullContent,
        role: "assistant",
        sources: allSources,
        toolUsed,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
