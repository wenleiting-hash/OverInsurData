# ─── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/domain-models/package.json packages/domain-models/
COPY apps/carrier-service/package.json apps/carrier-service/

# 安装依赖（frozen lockfile）
RUN pnpm install --frozen-lockfile

# 复制源码
COPY packages/domain-models/ packages/domain-models/
COPY apps/carrier-service/ apps/carrier-service/

# 构建共享包 (domain-models) 然后构建后端 (依赖顺序)
RUN pnpm --filter @overinsur/domain-models build && pnpm --filter carrier-service build

# ─── Stage 2: Production ────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/domain-models/package.json packages/domain-models/
COPY apps/carrier-service/package.json apps/carrier-service/

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /build/apps/carrier-service/dist ./apps/carrier-service/dist
COPY --from=builder /build/packages/domain-models/dist ./packages/domain-models/dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1

EXPOSE 8080

CMD ["node", "apps/carrier-service/dist/main.js"]
