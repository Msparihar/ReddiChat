import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  messageAttachments,
  fileAttachments,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get conversation with messages
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      ),
      with: {
        messages: {
          orderBy: [asc(messages.timestamp)],
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Batch-fetch attachments to avoid N+1 queries
    const messageIdsWithAttachments = conversation.messages
      .filter(msg => msg.hasAttachments)
      .map(msg => msg.id);

    let attachmentsByMessage: Record<string, any[]> = {};

    if (messageIdsWithAttachments.length > 0) {
      const allAttachments = await db
        .select({
          messageId: messageAttachments.messageId,
          id: fileAttachments.id,
          filename: fileAttachments.filename,
          originalFilename: fileAttachments.originalFilename,
          fileType: fileAttachments.fileType,
          fileSize: fileAttachments.fileSize,
          mimeType: fileAttachments.mimeType,
          s3Url: fileAttachments.s3Url,
          createdAt: fileAttachments.createdAt,
        })
        .from(messageAttachments)
        .innerJoin(
          fileAttachments,
          eq(messageAttachments.fileAttachmentId, fileAttachments.id)
        )
        .where(inArray(messageAttachments.messageId, messageIdsWithAttachments));

      for (const att of allAttachments) {
        if (!attachmentsByMessage[att.messageId]) {
          attachmentsByMessage[att.messageId] = [];
        }
        attachmentsByMessage[att.messageId].push(att);
      }
    }

    const messagesWithAttachments = conversation.messages.map(message => ({
      ...message,
      file_attachments: attachmentsByMessage[message.id] || [],
    }));

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
      messages: messagesWithAttachments.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        conversation_id: msg.conversationId,
        sources: msg.sources || [],
        tool_used: msg.toolUsed,
        has_attachments: msg.hasAttachments,
        file_attachments: msg.file_attachments,
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch conversation", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and delete
    const [deleted] = await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, session.user.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete conversation", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Failed to update conversation", { error: (error as Error)?.message });
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
