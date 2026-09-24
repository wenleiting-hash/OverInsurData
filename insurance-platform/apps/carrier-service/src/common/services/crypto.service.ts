import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * 对称加密服务（AES-256-GCM）
 * 用于加密存储 appSecret 等需要在服务端恢复明文的密钥型数据
 * 主密钥来自环境变量 INTEGRATION_MASTER_KEY（base64 32 字节），
 * 未配置时降级使用 JWT 密钥派生（仅开发环境）
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly key: Buffer;
  private readonly usingFallback: boolean;

  constructor() {
    const configured = process.env.INTEGRATION_MASTER_KEY;
    const master = configured || process.env.JWT_SECRET || 'dev-integration-master-key-please-change';
    this.usingFallback = !configured;
    // 取前 32 字节作 AES-256 密钥
    this.key = Buffer.alloc(32);
    Buffer.from(master).copy(this.key);
    // V1.0.16 T6：主密钥未配置告警
    if (this.usingFallback) {
      this.logger.warn(
        'INTEGRATION_MASTER_KEY not set — using JWT_SECRET fallback (dev only). Production MUST set INTEGRATION_MASTER_KEY (base64 32 bytes).',
      );
    }
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // 输出：iv(12) + tag(16) + ciphertext，base64
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(enc: string): string {
    const buf = Buffer.from(enc, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
