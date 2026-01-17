import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { fileAttachments } from "@/lib/db/schema";
import { uploadToS3, getFileType } from "@/lib/s3";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }

      // Convert to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      const result = await uploadToS3(
        buffer,
        file.name,
        file.type,
        session.user.id
      );

      // Save to database
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

      uploadedFiles.push({
        id: attachment.id,
        filename: attachment.filename,
        originalFilename: attachment.originalFilename,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        s3Url: attachment.s3Url,
        createdAt: attachment.createdAt,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
