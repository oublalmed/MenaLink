import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import { AppError, ErrorCode } from '../utils/errors';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new AppError(400, ErrorCode.VALIDATION_ERROR, 'Seuls les formats JPG, PNG et WebP sont acceptés'));
    return;
  }
  cb(null, true);
}

/** Upload d'un seul fichier image (max 5 Mo). */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).single('file');

/** Upload de plusieurs fichiers images (max 3 fichiers, 5 Mo chacun). */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).array('files', 3);
