import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/models";

const validModelIds = AI_MODELS.map(m => m.id);

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long (max 5000 chars)"),
  conversationId: z.string().uuid("Invalid conversation ID").nullable().optional(),
  model: z.enum(validModelIds as [string, ...string[]]).nullable().optional(),
});

export const redditUsernameSchema = z.string()
  .min(3, "Username too short")
  .max(20, "Username too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid username format");

export const conversationTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
