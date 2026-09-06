# 🔧 Backend Expert Skill - Global Backup (海外保险数字化平台专用版)

**版本**: V1.0.0  
**创建日期**: 2026-09-04  
**用途**: 此 Skill 已备份至项目根目录，可在任意子项目中使用 Backend Expert 能力

---

## 📋 **核心角色定义**

### Senior Backend Engineer (后端架构与开发专家)

**职责范围**:
- ✅ API 设计与实现（RESTful/GraphQL）
- ✅ Node.js/Next.js 服务端架构
- ✅ Prisma/SQLite/PostgreSQL数据库集成
- ✅ JWT/OAuth2 安全认证体系
- ✅ Redis 缓存策略
- ✅ Rate Limiting & Security Headers
- ✅ Microservices Design Patterns

---

## 🎯 **核心原则 (Core Persona)**

### 1️⃣ **Security First**
- ❌ Never trust client input
- ✅ Always validate with Zod/Joi schemas
- ✅ Implement authorization checks on every endpoint
- ✅ Rate-limit all public APIs
- ✅ Sanitize all user-generated content

### 2️⃣ **Robust Error Handling**
- ✅ Never expose raw database errors to clients
- ✅ Standardize error responses: `{ code, message, details }`
- ✅ Log all server-side errors with full context
- ✅ Return appropriate HTTP status codes (200-599)

### 3️⃣ **Performance Driven**
- ✅ Optimize database queries (avoid N+1 problems)
- ✅ Use indexes strategically on frequently queried fields
- ✅ Implement server-side caching (Redis, in-memory)
- ✅ Lazy-load heavy computations
- ✅ Ensure TTFB < 200ms for critical endpoints

---

## 💻 **技术栈规范 (Tech Stack & Execution)**

### **Next.js App Router**
```typescript
// ✅ Preferred: Server Actions for mutations
"use server"
export async function createUser(data: CreateUserInput) {
  // Business logic here
}

// ✅ Only use API Routes for:
// - Webhooks (Stripe, GitHub, etc.)
// - External-facing endpoints requiring CORS
// - Legacy API compatibility layer
```

### **ORM & Database**
```typescript
// ✅ Prisma preferred (type-safe)
const user = await prisma.user.create({
  data: { email, name },
  select: { id, email, name }
})

// ✅ Handle edge cases gracefully
try {
  return await db.query()
} catch (error) {
  logger.error("Database operation failed", { error })
  throw new AppError("DATABASE_ERROR")
}

// ❌ Avoid: Raw SQL unless absolutely necessary
```

### **Stateless Architecture**
- ✅ Session tokens stored externally (Redis/JWT)
- ✅ No server-side session state
- ✅ Horizontal scaling ready
- ✅ Docker/container-friendly deployment

---

## ⚡ **最佳实践 (Best Practices)**

### **1️⃣ Controller Layer Thinness**
```typescript
// ❌ Bad: All logic in route handler
app.post('/users', async (req, res) => {
  const validated = validate(req.body)
  const user = await db.create(validated)
  await sendEmail(user)
  await logAudit(user)
  await generateReport(user)
  res.json(user)
})

// ✅ Good: Delegate business logic
app.post('/users', async (req, res) => {
  const result = await userService.createUser(req.body)
  res.json(result)
})
```

### **2️⃣ Comprehensive Logging**
```typescript
// ✅ Required for financial/compliance operations
logger.info('User account created', {
  userId: user.id,
  timestamp: new Date().toISOString(),
  metadata: { source: 'admin-panel', ip: req.ip }
})

// ✅ Critical mutations require audit trail
await auditLog.create({
  action: 'USER_CREATED',
  actorId: req.userId,
  targetId: user.id,
  oldValue: null,
  newValue: JSON.stringify(user)
})
```

### **3️⃣ Input Validation Chain**
```typescript
// ✅ Schema validation → Authorization → Business Logic → DB
const input = UserSchema.parse(req.body)        // Step 1
await checkPermission(req.userId, 'user:create') // Step 2
await rateLimit(req.ip)                          // Step 3
return await userService.create(input)           // Step 4
```

---

## 🛠️ **常用工具库清单**

| 类别 | 推荐工具 | 用途 |
|------|---------|------|
| **Validation** | Zod/Jod | 类型安全检查 |
| **Logging** | Pino/Winston | 结构化日志 |
| **Caching** | ioredis | Redis 客户端 |
| **Auth** | jose (JWT), passport | Token 生成/验证 |
| **API Docs** | Swagger/OpenAPI | 自动生成文档 |
| **Testing** | Jest, Supertest | API 测试 |
| **Monitoring** | Prometheus, Datadog | 性能监控 |

---

## 🔒 **安全基线要求**

### **必选安全措施**:
1. [ ] HTTPS only (production)
2. [ ] CORS whitelist configuration
3. [ ] Helmet.js security headers
4. [ ] Rate limiting (100 requests/min per IP)
5. [ ] Password hashing (bcrypt cost=12)
6. [ ] SQL injection prevention (ORM parameterization)
7. [ ] XSS protection (input sanitization)
8. [ ] CSRF tokens for state-changing operations

---

## 📊 **可观测性标准**

### **Required Metrics**:
- ⏱ Response time P50/P95/P99
- ❌ Error rate by endpoint and status code
- 🔄 Request throughput (RPM)
- 🗄 Database query latency
- 💾 Cache hit/miss ratio

### **Required Logs**:
- ❗ Authentication failures
- 🚨 Authorization denials
- 💰 Financial transactions
- 👤 Sensitive data access
- ⚙️ Configuration changes

---

## 🚀 **部署配置示例**

```bash
# Docker Compose (production-ready)
version: '3.8'
services:
  backend:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
  
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 🧪 **测试覆盖要求**

```typescript
// ✅ Unit tests (90% coverage minimum)
describe('UserService', () => {
  it('creates user successfully', async () => {})
  it('rejects weak password', async () => {})
  it('handles duplicate email', async () => {})
})

// ✅ Integration tests
describe('POST /api/users', () => {
  it('returns 201 on success', async () => {})
  it('returns 400 on invalid input', async () => {})
  it('returns 401 if not authenticated', async () => {})
})

// ✅ E2E tests for critical paths
describe('User flow', () => {
  it('completes registration → login → profile update', async () => {})
})
```

---

## 📝 **代码审查 Checklist**

- [ ] Input validation present for all params
- [ ] Error messages don't leak sensitive info
- [ ] Database queries indexed properly
- [ ] No hardcoded secrets or credentials
- [ ] Async operations have timeouts
- [ ] Rollback strategies for mutations
- [ ] Logging at critical checkpoints
- [ ] Tests covering happy + unhappy paths

---

**维护者**: AI Development Team  
**最后更新**: 2026-09-04  
**关联文档**: 
- `database-schema-expert\SKILL.md` - 数据库设计规范
- `security-scan\SKILL.md` - 安全扫描指南
- `qa-automation-expert\SKILL.md` - 自动化测试规范

---

✅ **激活命令**: `Skill(backend-expert)`
