import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  fileAttachments,
  messageAttachments,
} from "@/lib/db/schema";
import { CoreMessage } from "ai";
import { streamChatResponse, extractSources } from "@/lib/ai/agent";
import { eq, asc } from "drizzle-orm";
import { uploadToS3, getFileType } from "@/lib/s3";
import { appendFileSync } from "fs";
import { join } from "path";

const LOG_FILE = join(process.cwd(), "chat-stream.log");

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`
    : `[${timestamp}] ${message}\n`;
  appendFileSync(LOG_FILE, logLine);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response(
        createSSEMessage({ type: "error", content: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const conversationId = formData.get("conversation_id") as string | null;
    const files = formData.getAll("files") as File[];

    if (!message) {
      return new Response(
        createSSEMessage({ type: "error", content: "Message is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
          },
        }
      );
    }

    // Process file uploads
    const uploadedFiles: any[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue; // Skip files > 10MB

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToS3(
        buffer,
        file.name,
        file.type,
        session.user.id
      );

      const [attachment] = await db
        .insert(fileAttachments)
        .values({
          userId: session.user.id,
          filename: result.filename,
          originalFilename: file.name,
          fileType: getFileType(file.type),
          fileSize: result.fileSize,
          mimeType: file.type,
          s3Bucket: process.env.S3_BUCKET || "reddichat-files",
          s3Key: result.s3Key,
          s3Url: result.s3Url,
          checksum: result.checksum,
        })
        .returning();

      uploadedFiles.push(attachment);
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
        hasAttachments: uploadedFiles.length > 0,
      })
      .returning();

    // Link attachments to message
    for (const file of uploadedFiles) {
      await db.insert(messageAttachments).values({
        messageId: userMessage.id,
        fileAttachmentId: file.id,
      });
    }

    // Get conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(asc(messages.timestamp))
      .limit(20);

    // Build messages array for AI (filter out empty messages)
    const aiMessages: CoreMessage[] = history
      .slice(0, -1)
      .filter((msg) => msg.content && msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Add current message with any image attachments
    const currentMessageContent: any[] = [{ type: "text", text: message }];
    for (const file of uploadedFiles) {
      if (file.mimeType.startsWith("image/")) {
        currentMessageContent.push({
          type: "image",
          image: file.s3Url,
        });
      }
    }

    aiMessages.push({
      role: "user",
      content:
        currentMessageContent.length > 1 ? currentMessageContent : message,
    });

    // Create readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let toolUsed: string | null = null;
          let allSources: any[] = [];
          let fullContent = "";

          log("Starting stream with messages", aiMessages);

          const result = await streamChatResponse({
            messages: aiMessages,
            onToolStart: (name) => {
              log(`Tool started: ${name}`);
              toolUsed = name;
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({ type: "tool_start", tool: name })
                )
              );
            },
            onToolEnd: (name, toolResult) => {
              log(`Tool ended: ${name}`, toolResult);
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({ type: "tool_end", tool: name })
                )
              );
              if (toolResult) {
                const sources = extractSources([{ toolName: name, result: toolResult }]);
                allSources.push(...sources);
              }
            },
          });

          // Stream content chunks
          log("Starting to consume textStream...");
          let chunkCount = 0;
          try {
            for await (const chunk of result.textStream) {
              chunkCount++;
              fullContent += chunk;
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({ type: "content", delta: chunk })
                )
              );
            }
          } catch (streamError: any) {
            log("Error during stream consumption", { message: streamError.message, stack: streamError.stack });
            throw streamError;
          }

          // Log completion
          log("Stream consumption complete");

          log(`Stream finished. Chunks: ${chunkCount}, Content length: ${fullContent.length}`);

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

          // Send done event
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                type: "done",
                conversation_id: convId,
                message_id: assistantMessage.id,
                content: fullContent,
                sources: allSources,
                tool_used: toolUsed,
                file_attachments: uploadedFiles.map((f) => ({
                  id: f.id,
                  filename: f.filename,
                  original_filename: f.originalFilename,
                  file_type: f.fileType,
                  file_size: f.fileSize,
                  mime_type: f.mimeType,
                  s3_url: f.s3Url,
                  created_at: f.createdAt,
                })),
              })
            )
          );

          controller.close();
        } catch (error: any) {
          log("Stream error", { message: error.message, stack: error.stack });
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                type: "error",
                content: error.message || "An error occurred",
              })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Chat stream error:", error);
    return new Response(
      createSSEMessage({
        type: "error",
        content: error.message || "Failed to process request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
        },
      }
    );
  }
}
