import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { AppError, ErrorCode } from '../utils/errors';

const log = createLogger('upload');

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── S3 config (fallback) ─────────────────────────────────────────────────────
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'eu-west-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  } : undefined,
});

// ── Types ────────────────────────────────────────────────────────────────────
export type UploadCategory = 'avatars' | 'cin' | 'gallery' | 'documents';

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

// ── Image processing ─────────────────────────────────────────────────────────
async function processImage(buffer: Buffer, maxDim = 1200): Promise<Buffer> {
  return sharp(buffer)
    .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

// ── Upload via Cloudinary ────────────────────────────────────────────────────
async function uploadToCloudinary(
  buffer: Buffer,
  category: UploadCategory,
  filename: string,
): Promise<UploadResult> {
  const publicId = `menalink/${category}/${filename}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'image', overwrite: true, folder: `menalink/${category}` },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload Cloudinary échoué'));
        resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format, bytes: result.bytes });
      },
    );
    stream.end(buffer);
  });
}

// ── Upload via S3 ────────────────────────────────────────────────────────────
async function uploadToS3(
  buffer: Buffer,
  category: UploadCategory,
  filename: string,
  mimeType: string,
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET ?? 'menalink';
  const key = `${category}/${filename}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: buffer,
    ContentType: mimeType, ACL: 'public-read' as never,
    CacheControl: 'max-age=31536000',
  }));
  const url = `https://${bucket}.s3.${process.env.AWS_REGION ?? 'eu-west-1'}.amazonaws.com/${key}`;
  return { url, publicId: key, bytes: buffer.length };
}

// ── Main upload function ─────────────────────────────────────────────────────
export async function uploadFile(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  category: UploadCategory,
): Promise<UploadResult> {
  // Validate MIME
  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (!allowedMimes.has(mimetype)) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Format non supporté. Utilisez JPG, PNG ou WebP.');
  }
  // Validate size (5 MB)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Fichier trop volumineux (max 5 Mo)');
  }

  const processed = await processImage(buffer);
  const filename = `${uuidv4()}.jpg`;

  const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
  try {
    if (useCloudinary) {
      const result = await uploadToCloudinary(processed, category, filename);
      log.info('Upload Cloudinary OK', { category, filename, bytes: result.bytes });
      return result;
    } else {
      const result = await uploadToS3(processed, category, filename, 'image/jpeg');
      log.info('Upload S3 OK', { category, filename, bytes: result.bytes });
      return result;
    }
  } catch (err) {
    log.error('Erreur upload', { error: (err as Error).message, category });
    throw new AppError(500, ErrorCode.SERVER_ERROR, 'Erreur lors de l\'upload du fichier');
  }
}

/** Supprime un fichier uploadé (Cloudinary uniquement). */
export async function deleteFile(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    log.info('Fichier supprimé', { publicId });
  } catch (err) {
    log.warn('Erreur suppression Cloudinary', { error: (err as Error).message, publicId });
  }
}

/** Génère une URL signée S3 temporaire (15 min) pour les documents sensibles (CIN). */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET ?? 'menalink';
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
