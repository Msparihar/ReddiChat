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

// File upload validation
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

export const MAX_FILES_PER_REQUEST = 5;
export const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TOTAL_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB

// Magic bytes for common file types
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

export function validateFileMimeType(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime];
  if (!signatures) {
    // For text types, no magic byte check — just verify it's in the allowed list
    return ALLOWED_MIME_TYPES.has(declaredMime);
  }

  return signatures.some(sig =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal
  let sanitized = filename.replace(/[/\\]/g, "_");
  // Remove special characters except dots, dashes, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.split(".").pop() || "";
    sanitized = sanitized.substring(0, 195) + "." + ext;
  }
  // Prevent empty filename
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = "unnamed_file";
  }
  return sanitized;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  buffer: Buffer
): FileValidationResult {
  // Check MIME type is allowed
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Check size
  if (file.size > MAX_SINGLE_FILE_SIZE) {
    return { valid: false, error: `File exceeds maximum size of 10MB` };
  }

  // Validate magic bytes match declared MIME
  if (!validateFileMimeType(buffer, file.type)) {
    return { valid: false, error: `File content does not match declared type ${file.type}` };
  }

  return { valid: true };
}
