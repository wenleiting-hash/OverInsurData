import { mkdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Absolute path of the local upload directory (apps/carrier-service/uploads when run via `node dist/main.js`).
 * Files are stored here by the generic upload endpoint and served statically at `/uploads/<filename>`.
 * Created on module load so the directory always exists before the first upload.
 */
export const UPLOAD_DIR = resolve(process.cwd(), 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

/** Public URL prefix that main.ts also uses for express static serving. */
export const UPLOAD_URL_PREFIX = '/uploads';

/** Max upload size: 20 MB. */
export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

/** Allowed document/image extensions for product compliance files and training materials. */
export const ALLOWED_UPLOAD_EXT = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.png', '.jpg', '.jpeg', '.csv', '.txt',
];
