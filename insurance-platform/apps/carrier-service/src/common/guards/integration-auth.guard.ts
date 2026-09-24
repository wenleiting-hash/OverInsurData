import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
  ForbiddenException, HttpException, Logger,
} from '@nestjs/common';
import { createHmac, createHash } from 'crypto';
import { IntegrationService } from '../../modules/integration/integration.service';

/**
 * 集成接口鉴权守卫（appKey + HMAC-SHA256 + 时间戳 + nonce + IP 白名单 + 限流）
 * 用于 /api/integration/v1/* 外部调用接口
 *
 * V1.0.16 T6：
 *  - 内存滑动窗口限流（按 appKey，60s 内不超过 app.rate_limit 次）
 *  - 注：多实例部署需替换为 Redis；当前单实例足够
 */
@Injectable()
export class IntegrationAuthGuard implements CanActivate {
  private readonly logger = new Logger(IntegrationAuthGuard.name);
  private readonly timeWindow = 300; // 秒
  private readonly rateWindowMs = 60_000; // 60s 滑动窗口
  private readonly rateBuckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly integrationService: IntegrationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const appKey = req.headers['x-app-key'];
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];
    const signature = req.headers['x-signature'];

    if (!appKey || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException({
        success: false, code: 'INVALID_SIGNATURE', message: '缺少鉴权请求头',
      });
    }

    // 1. 时间戳校验
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(String(timestamp), 10);
    if (isNaN(ts) || Math.abs(now - ts) > this.timeWindow) {
      throw new UnauthorizedException({
        success: false, code: 'TIMESTAMP_EXPIRED',
        message: '时间戳超出允许范围',
      });
    }

    // 2. 查应用
    const app = await this.integrationService.getAppByKey(String(appKey));
    if (!app || app.status !== 'active') {
      throw new UnauthorizedException({
        success: false, code: 'INVALID_SIGNATURE', message: '应用不存在或已禁用',
      });
    }

    // 2b. 限流（按 appKey 滑动窗口，rate_limit 默认 60/min）
    const limit = typeof app.rate_limit === 'number' && app.rate_limit > 0 ? app.rate_limit : 60;
    const bucket = this.rateBuckets.get(String(appKey));
    const nowMs = Date.now();
    if (!bucket || bucket.resetAt <= nowMs) {
      this.rateBuckets.set(String(appKey), { count: 1, resetAt: nowMs + this.rateWindowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > limit) {
        throw new HttpException(
          { success: false, code: 'RATE_LIMITED', message: '请求频率超出限制', retry_after: Math.ceil((bucket.resetAt - nowMs) / 1000) },
          429,
        );
      }
    }

    // 3. IP 白名单
    const clientIp = this.getClientIp(req);
    if (app.ip_whitelist && app.ip_whitelist.trim()) {
      const allowed = app.ip_whitelist.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (allowed.length > 0 && !allowed.some((cidr: string) => this.ipInCidr(clientIp, cidr))) {
        throw new ForbiddenException({
          success: false, code: 'IP_NOT_ALLOWED', message: '来源 IP 不在白名单内',
        });
      }
    }

    // 4. nonce 防重放
    const nonceOk = await this.integrationService.recordNonce(String(nonce), String(appKey));
    if (!nonceOk) {
      throw new UnauthorizedException({
        success: false, code: 'NONCE_REPLAYED', message: 'nonce 重复',
      });
    }

    // 5. 签名校验：HMAC(明文 appSecret, 签名串)
    const method = req.method.toUpperCase();
    const url = req.originalUrl || req.url;
    // V1.0.18：空对象 body（GET/无 body 时 Express 默认 {}）按空串处理，
    // 对齐接口文档「GET 无 body 时填空字符串的 SHA256」约定。
    const bodyStr = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '';
    const bodyHash = createHash('sha256').update(bodyStr, 'utf8').digest('hex');
    const signatureString = [method, url, String(timestamp), String(nonce), bodyHash].join('\n');
    const plainSecret = this.integrationService.decryptAppSecret(app.app_secret_hash);
    const actual = String(signature).toLowerCase();

    // 兼容客户端常见粘贴错误：部分客户端会把 appKey + appSecret 一起复制后用作密钥。
    // 依次尝试：纯 secret、appKey + ' ' + secret、appKey + secret（无分隔符）。
    const candidateSecrets = [
      plainSecret,
      `${appKey} ${plainSecret}`,
      `${appKey}${plainSecret}`,
    ];
    let matched = false;
    let expected = '';
    for (const cand of candidateSecrets) {
      expected = createHmac('sha256', cand).update(signatureString, 'utf8').digest('hex');
      if (actual === expected) { matched = true; break; }
    }

    if (!matched) {
      // V1.0.16 T8: 签名不匹配时打印完整诊断信息，便于客户端联调
      this.logger.warn(
        `签名校验失败 appKey=${appKey}\n` +
        `  method=${method} url=${url}\n` +
        `  timestamp=${timestamp} nonce=${nonce}\n` +
        `  bodyStr=${bodyStr}\n` +
        `  bodyHash=${bodyHash}\n` +
        `  signatureString=\n${signatureString}\n` +
        `  expected(plainSecret)=${createHmac('sha256', plainSecret).update(signatureString, 'utf8').digest('hex')}\n` +
        `  actual             =${actual}`,
      );
      throw new UnauthorizedException({
        success: false, code: 'INVALID_SIGNATURE', message: '签名校验失败',
      });
    }

    // 6. 更新最后调用时间（异步不阻塞）
    this.integrationService.touchLastCalled(String(appKey)).catch(() => {});

    req.integrationApp = app;
    return true;
  }

  private getClientIp(req: any): string {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || '';
  }

  /** 简化 CIDR 匹配（支持单个 IP 和 /8 /16 /24 /32 网段） */
  private ipInCidr(ip: string, cidr: string): boolean {
    if (ip === cidr) return true;
    if (!cidr.includes('/')) return false;
    const [net, maskStr] = cidr.split('/');
    const mask = parseInt(maskStr, 10);
    const ipNum = this.ipToNum(ip);
    const netNum = this.ipToNum(net);
    if (ipNum === null || netNum === null) return false;
    const maskNum = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;
    return (ipNum & maskNum) === (netNum & maskNum);
  }

  private ipToNum(ip: string): number | null {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let num = 0;
    for (const p of parts) {
      const n = parseInt(p, 10);
      if (isNaN(n) || n < 0 || n > 255) return null;
      num = (num << 8) + n;
    }
    return num >>> 0;
  }
}
