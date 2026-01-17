import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || "reddichat-files";

export interface UploadResult {
  filename: string;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

export async function uploadToS3(
  file: Buffer,
  filename: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  // Generate unique filename
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString("hex");
  const extension = filename.split(".").pop() || "";
  const s3Key = `uploads/${userId}/${timestamp}-${randomId}.${extension}`;

  // Calculate checksum
  const checksum = crypto.createHash("md5").update(file).digest("hex");

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        originalFilename: filename,
        userId: userId,
        checksum: checksum,
      },
    })
  );

  const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

  return {
    filename: `${timestamp}-${randomId}.${extension}`,
    s3Key,
    s3Url,
    fileSize: file.length,
    mimeType,
    checksum,
  };
}

export async function getSignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(s3Key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })
  );
}

export function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document")
  )
    return "document";
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel")
  )
    return "spreadsheet";
  return "file";
}
