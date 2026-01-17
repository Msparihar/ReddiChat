import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  boolean,
  bigint,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Better Auth creates its own tables: user, session, account, verification
// We reference user.id (text) in our app tables

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Better Auth user.id
  title: varchar("title", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // Better Auth user.id
  content: text("content").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // user | assistant
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  sources: jsonb("sources").$type<RedditSource[] | null>(),
  toolUsed: varchar("tool_used", { length: 100 }),
  hasAttachments: boolean("has_attachments").default(false),
});

// File attachments table
export const fileAttachments = pgTable("file_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Better Auth user.id
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  s3Bucket: varchar("s3_bucket", { length: 100 }).notNull(),
  s3Key: varchar("s3_key", { length: 255 }).notNull(),
  s3Url: text("s3_url").notNull(),
  processingStatus: varchar("processing_status", { length: 20 }).default(
    "processed"
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  fileMetadata: jsonb("file_metadata"),
  checksum: varchar("checksum", { length: 64 }),
});

// Message attachments junction table
export const messageAttachments = pgTable("message_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  fileAttachmentId: uuid("file_attachment_id")
    .references(() => fileAttachments.id, { onDelete: "cascade" })
    .notNull(),
  attachmentOrder: integer("attachment_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  attachments: many(messageAttachments),
}));

export const messageAttachmentsRelations = relations(
  messageAttachments,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageAttachments.messageId],
      references: [messages.id],
    }),
    fileAttachment: one(fileAttachments, {
      fields: [messageAttachments.fileAttachmentId],
      references: [fileAttachments.id],
    }),
  })
);

// Types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type FileAttachment = typeof fileAttachments.$inferSelect;
export type NewFileAttachment = typeof fileAttachments.$inferInsert;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;

export interface RedditSource {
  title: string;
  url: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  permalink: string;
}
