import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  UPLOAD_DIR, UPLOAD_URL_PREFIX, MAX_UPLOAD_SIZE, ALLOWED_UPLOAD_EXT,
} from './upload.config';

/**
 * Generic authenticated file-upload endpoint backing product compliance documents
 * and training-material uploads. Stores the file on local disk (UPLOAD_DIR) under a
 * unique generated name and returns metadata (original name / size / public url) that the
 * frontend persists into the relevant jsonb column or sub-table. Files are served at /uploads/<name>.
 */
@UseGuards(JwtAuthGuard)
@Controller('api/uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => {
          // Unique stored name; original (possibly non-ASCII) name is preserved in metadata only.
          const ext = extname(file.originalname).toLowerCase();
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: { fileSize: MAX_UPLOAD_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_UPLOAD_EXT.includes(ext)) {
          return cb(new BadRequestException(`Unsupported file type "${ext || '(none)'}". Allowed: ${ALLOWED_UPLOAD_EXT.join(', ')}`), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded (expected multipart field name "file")');
    // multer decodes multipart filenames as latin1 by default; re-decode as utf8 so non-ASCII
    // (e.g. Chinese) original names are preserved. No-op for pure-ASCII names.
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    this.logger.log(`Stored upload ${file.filename} (${file.size} bytes, ${file.mimetype})`);
    return {
      originalName,
      storedName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
    };
  }
}
