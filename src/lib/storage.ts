import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

export class UploadError extends Error {}

let s3: S3Client | undefined;
function s3Client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  return s3;
}

/** True when the form field holds an actual file (browsers send an empty one otherwise). */
export function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && value.size > 0;
}

/**
 * Resizes and compresses an uploaded image to WebP (posters from phones are
 * often several MB; this keeps the app fast on mobile data) and stores it.
 * Returns the public URL.
 */
export async function saveImage(file: File, folder: string, maxSize = 1200): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image is too large (max 8 MB).");
  if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
    throw new UploadError("Please upload a JPG, PNG or WebP image.");
  }

  let data: Buffer;
  try {
    data = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    throw new UploadError("That file doesn't look like an image we can read.");
  }

  const key = `${folder}/${randomUUID()}.webp`;

  if (process.env.STORAGE_DRIVER === "s3") {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${process.env.S3_PUBLIC_URL?.replace(/\/$/, "")}/${key}`;
  }

  const target = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return `/uploads/${key}`;
}
