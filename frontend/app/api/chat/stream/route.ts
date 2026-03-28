import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { chatMessageSchema, validateFileUpload, sanitizeFilename, ALLOWED_MIME_TYPES, MAX_FILES_PER_REQUEST, MAX_TOTAL_REQUEST_SIZE } from "@/lib/validation";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  fileAttachments,
  messageAttachments,
} from "@/lib/db/schema";
import { ModelMessage } from "ai";
import { streamChatResponse, extractSources } from "@/lib/ai/agent";
import { eq, asc } from "drizzle-orm";
import { uploadToS3, getFileType } from "@/lib/s3";
import { logger, generateRequestId } from "@/lib/logger";
import { checkDailyLimit, trackMessageUsage, trackUploadUsage } from "@/lib/usage";
import { truncateHistory, estimateMessageTokens } from "@/lib/token-budget";
import { sanitizeError } from "@/lib/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

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

    const userId = session.user.id;

    // Hourly rate limit
    const rateLimit = checkRateLimit(`chat:${userId}`, RATE_LIMITS.chat);
    if (!rateLimit.success) {
      logger.warn("Rate limit exceeded", { requestId, userId, endpoint: "/api/chat/stream", remaining: rateLimit.remaining });
      return new Response(
        createSSEMessage({ type: "error", content: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "text/event-stream",
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Daily usage limit
    const dailyCheck = await checkDailyLimit(userId, "message");
    if (!dailyCheck.allowed) {
      logger.warn("Daily limit exceeded", { requestId, userId, reason: dailyCheck.reason, current: dailyCheck.current, limit: dailyCheck.limit });
      return new Response(
        createSSEMessage({ type: "error", content: dailyCheck.reason || "Daily limit reached." }),
        {
          status: 429,
          headers: { "Content-Type": "text/event-stream" },
        }
      );
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const conversationId = formData.get("conversation_id") as string | null;
    const modelId = formData.get("model") as string | null;
    const files = formData.getAll("files") as File[];

    // Input validation
    const validation = chatMessageSchema.safeParse({
      message,
      conversationId,
      model: modelId,
    });

    if (!validation.success) {
      return new Response(
        createSSEMessage({ type: "error", content: validation.error.errors[0]?.message || "Invalid input" }),
        {
          status: 400,
          headers: { "Content-Type": "text/event-stream" },
        }
      );
    }

    // File count limit
    if (files.length > MAX_FILES_PER_REQUEST) {
      return new Response(
        createSSEMessage({ type: "error", content: `Maximum ${MAX_FILES_PER_REQUEST} files per request.` }),
        {
          status: 400,
          headers: { "Content-Type": "text/event-stream" },
        }
      );
    }

    // Total request size check
    const totalFileSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalFileSize > MAX_TOTAL_REQUEST_SIZE) {
      return new Response(
        createSSEMessage({ type: "error", content: "Total upload size exceeds 50MB limit." }),
        {
          status: 413,
          headers: { "Content-Type": "text/event-stream" },
        }
      );
    }

    // Daily upload limit check
    if (files.length > 0) {
      const uploadCheck = await checkDailyLimit(userId, "upload");
      if (!uploadCheck.allowed) {
        logger.warn("Daily upload limit exceeded", { requestId, userId, reason: uploadCheck.reason });
        return new Response(
          createSSEMessage({ type: "error", content: uploadCheck.reason || "Daily upload limit reached." }),
          {
            status: 429,
            headers: { "Content-Type": "text/event-stream" },
          }
        );
      }
    }

    logger.info("Chat request started", {
      requestId,
      userId,
      endpoint: "/api/chat/stream",
      model: modelId || "default",
      messageLength: message.length,
      fileCount: files.length,
      totalFileSize,
      conversationId: conversationId || "new",
    });

    // Process file uploads with validation
    const uploadedFiles: any[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate file content
      const fileValidation = validateFileUpload(file, buffer);
      if (!fileValidation.valid) {
        logger.warn("File rejected", { requestId, userId, filename: file.name, reason: fileValidation.error });
        continue; // Skip invalid files
      }

      const safeName = sanitizeFilename(file.name);

      const result = await uploadToS3(
        buffer,
        safeName,
        file.type,
        userId
      );

      const [attachment] = await db
        .insert(fileAttachments)
        .values({
          userId,
          filename: result.filename,
          originalFilename: safeName,
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
      logger.info("File uploaded", { requestId, userId, filename: safeName, size: result.fileSize, mimeType: file.type });
    }

    // Track upload usage
    if (uploadedFiles.length > 0) {
      await trackUploadUsage(userId, uploadedFiles.length, totalFileSize);
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      const [newConv] = await db
        .insert(conversations)
        .values({
          userId,
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
        userId,
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
    const rawHistoryMessages = history
      .slice(0, -1)
      .filter((msg) => msg.content && msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Token budgeting — truncate history if needed
    const imageCount = uploadedFiles.filter((f) => f.mimeType?.startsWith("image/")).length;
    const currentMessageTokens = estimateMessageTokens(message, imageCount);
    const truncated = truncateHistory(rawHistoryMessages, currentMessageTokens, requestId);

    const aiMessages: ModelMessage[] = truncated.messages.map((msg) => ({
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

    // Track message usage with estimated tokens
    await trackMessageUsage(userId, truncated.totalEstimatedTokens);

    // Create readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let toolUsed: string | null = null;
          let allSources: any[] = [];
          let fullContent = "";
          let streamCompleted = false;

          const result = await streamChatResponse({
            messages: aiMessages,
            modelId: modelId || undefined,
            onToolStart: (name) => {
              toolUsed = name;
              logger.info("Tool invoked", { requestId, userId, tool: name });
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({ type: "tool_start", tool: name })
                )
              );
            },
            onToolEnd: (name, toolResult) => {
              logger.info("Tool completed", { requestId, userId, tool: name });
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
          for await (const chunk of result.textStream) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(
                createSSEMessage({ type: "content", delta: chunk })
              )
            );
          }
          streamCompleted = true;

          if (!streamCompleted || !fullContent.trim()) {
            controller.enqueue(
              encoder.encode(
                createSSEMessage({
                  type: "error",
                  content: "Response was incomplete. Please try again.",
                })
              )
            );
            controller.close();
            return;
          }

          // Save assistant message
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: convId,
              userId,
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

          const duration = Date.now() - startTime;
          logger.info("Chat request completed", {
            requestId,
            userId,
            model: modelId || "default",
            inputChars: message.length,
            responseChars: fullContent.length,
            estimatedTokens: truncated.totalEstimatedTokens,
            historyMessages: truncated.messages.length,
            historyDropped: truncated.messagesDropped,
            toolUsed,
            sourceCount: allSources.length,
            fileCount: uploadedFiles.length,
            duration,
          });

          controller.close();
        } catch (error: any) {
          const sanitized = sanitizeError(error, requestId);
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                type: "error",
                content: sanitized.message,
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
    const sanitized = sanitizeError(error, requestId);
    return new Response(
      createSSEMessage({
        type: "error",
        content: sanitized.message,
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
