import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { AuditService } from '../../common/services/audit.service';
import { COVERAGE_ALIASES, aliasVariantsOf } from './coverage-aliases';

// ─────────────────────────────────────────────────────────────
// 险种字典服务（V1.0.18）
//  - 四表：insurance_line / insurance_sub_line / insurance_coverage / line_coverage_rel
//  - 管理端 CRUD（code 不可变，软删）+ usage 引用统计 + coverage-tree
//  - 进程内缓存：tree（前端消费）与 snapshot（集成 match 消费），
//    任一写操作后 invalidateCache()。
// ─────────────────────────────────────────────────────────────

const LINE_CODE_RE = /^[A-Z][A-Za-z&]{1,31}$/;
const COVERAGE_CODE_RE = /^[a-z][a-zA-Z]{2,63}$/;

export interface TreeItem { code: string; nameZh: string; nameEn: string; sortOrder: number }
export interface TreeLine extends TreeItem {
  subLines: TreeItem[];
  coverages: TreeItem[];
}
export interface CoverageTree {
  version: string;
  lines: TreeLine[];
  allCoverages: TreeItem[];
}

/** 集成侧（I3 match / I4 快照）消费的字典快照 */
export interface DictSnapshot {
  version: string;
  /** canonical 业务线 → active 子险种 code 列表 */
  subLineMap: Record<string, string[]>;
  /** active 承保范围 code 全集 */
  coverageSet: string[];
  /** canonical 业务线 → 适用承保范围 code 列表（无关联行 = 未配置，缺省键） */
  lineCoverageMap: Record<string, string[]>;
}

const nowVersion = () => new Date().toISOString();

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  private treeCache: CoverageTree | null = null;
  private snapshotCache: DictSnapshot | null = null;

  /** 任一写操作后调用：下次读取重建缓存 */
  invalidateCache() {
    this.treeCache = null;
    this.snapshotCache = null;
    this.hasRelRowCache.clear();
  }

  // ── coverage-tree（登录态，建品表单等消费）───────────────────
  async getTree(): Promise<CoverageTree> {
    if (this.treeCache) return this.treeCache;
    const [lines, subLines, coverages, rels] = await Promise.all([
      pool.query(`SELECT code, name_zh, name_en, sort_order FROM insurance_line WHERE deleted = FALSE AND status = 'active' ORDER BY sort_order, id`),
      pool.query(`SELECT line_code, code, name_zh, name_en, sort_order FROM insurance_sub_line WHERE deleted = FALSE AND status = 'active' ORDER BY sort_order, id`),
      pool.query(`SELECT code, name_zh, name_en, sort_order FROM insurance_coverage WHERE deleted = FALSE AND status = 'active' ORDER BY sort_order, id`),
      pool.query(`SELECT line_code, coverage_code FROM line_coverage_rel`),
    ]);
    const covByCode = new Map<string, TreeItem>(
      coverages.rows.map((c: any) => [c.code, { code: c.code, nameZh: c.name_zh, nameEn: c.name_en, sortOrder: c.sort_order }]),
    );
    const relByLine = new Map<string, string[]>();
    for (const r of rels.rows) {
      if (!relByLine.has(r.line_code)) relByLine.set(r.line_code, []);
      relByLine.get(r.line_code)!.push(r.coverage_code);
    }
    const subByLine = new Map<string, TreeItem[]>();
    for (const s of subLines.rows) {
      if (!subByLine.has(s.line_code)) subByLine.set(s.line_code, []);
      subByLine.get(s.line_code)!.push({ code: s.code, nameZh: s.name_zh, nameEn: s.name_en, sortOrder: s.sort_order });
    }
    const tree: CoverageTree = {
      version: nowVersion(),
      lines: lines.rows.map((l: any) => {
        // 关联仅保留仍在库且 active 的 coverage；未配置关联 → 空数组（消费方兜底 allCoverages）
        const relCodes = relByLine.get(l.code) ?? [];
        const lineCoverages = (coverages.rows as any[])
          .filter(c => relCodes.includes(c.code))
          .map(c => covByCode.get(c.code)!)
          .filter(Boolean);
        return {
          code: l.code, nameZh: l.name_zh, nameEn: l.name_en, sortOrder: l.sort_order,
          subLines: subByLine.get(l.code) ?? [],
          coverages: lineCoverages,
        };
      }),
      allCoverages: coverages.rows.map((c: any) => covByCode.get(c.code)!),
    };
    this.treeCache = tree;
    return tree;
  }

  /** 集成侧快照（I3 match 校验数据源 + I4 insurance-catalog 返回体） */
  async getSnapshot(): Promise<DictSnapshot> {
    if (this.snapshotCache) return this.snapshotCache;
    const tree = await this.getTree();
    const subLineMap: Record<string, string[]> = {};
    const lineCoverageMap: Record<string, string[]> = {};
    for (const l of tree.lines) {
      subLineMap[l.code] = l.subLines.map(s => s.code);
      // 注意：tree 里 coverages 为空可能是「未配置关联」也可能是「全部取消勾选」。
      // rel 表无该 line 的行 → 未配置（缺省键，match 跳过线级校验）；
      // rel 有行但全被停用/过滤 → 配置了但当前无 active 项（空数组，严格校验）。
      const hasRelRow = await this.hasRelRows(l.code);
      if (hasRelRow) lineCoverageMap[l.code] = l.coverages.map(c => c.code);
    }
    const snapshot: DictSnapshot = {
      version: tree.version,
      subLineMap,
      coverageSet: tree.allCoverages.map(c => c.code),
      lineCoverageMap,
    };
    this.snapshotCache = snapshot;
    return snapshot;
  }

  private hasRelRowCache = new Map<string, boolean>();
  private async hasRelRows(lineCode: string): Promise<boolean> {
    if (this.hasRelRowCache.has(lineCode)) return this.hasRelRowCache.get(lineCode)!;
    const r = await pool.query(`SELECT 1 FROM line_coverage_rel WHERE line_code = $1 LIMIT 1`, [lineCode]);
    const has = r.rows.length > 0;
    this.hasRelRowCache.set(lineCode, has);
    return has;
  }

  // ─────────────────────────────────────────────────────────────
  //  业务线
  // ─────────────────────────────────────────────────────────────

  async listLines(includeDisabled = false) {
    const disabled = includeDisabled ? '' : ` AND status = 'active'`;
    const r = await pool.query(
      `SELECT l.id, l.code, l.name_zh, l.name_en, l.sort_order, l.status, l.created_at, l.updated_at,
              (SELECT count(*)::int FROM insurance_sub_line s WHERE s.line_code = l.code AND s.deleted = FALSE) AS sub_line_count,
              (SELECT count(*)::int FROM insurance_product p WHERE p.deleted = FALSE AND UPPER(p.line_of_business) = UPPER(l.code)) AS product_count
         FROM insurance_line l
        WHERE l.deleted = FALSE${disabled}
        ORDER BY l.sort_order, l.id`,
    );
    return r.rows.map((x: any) => ({
      id: x.id, code: x.code, nameZh: x.name_zh, nameEn: x.name_en,
      sortOrder: x.sort_order, status: x.status,
      subLineCount: x.sub_line_count, productCount: x.product_count,
      createdAt: x.created_at, updatedAt: x.updated_at,
    }));
  }

  private async getLineRow(code: string) {
    const r = await pool.query(`SELECT id, code, name_zh, name_en, sort_order, status, deleted FROM insurance_line WHERE code = $1`, [code]);
    if (r.rows.length === 0 || r.rows[0].deleted) {
      throw new NotFoundException({ code: 'DICT_LINE_NOT_FOUND' });
    }
    return r.rows[0];
  }

  async createLine(dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    const code = String(dto.code ?? '').trim();
    if (!LINE_CODE_RE.test(code)) throw new BadRequestException({ code: 'DICT_INVALID_CODE_FORMAT' });
    if (!dto.nameZh?.trim() || !dto.nameEn?.trim()) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const exists = await pool.query(`SELECT 1 FROM insurance_line WHERE code = $1`, [code]);
    if (exists.rows.length > 0) throw new ConflictException({ code: 'DICT_CODE_EXISTS' });
    const r = await pool.query(
      `INSERT INTO insurance_line (code, name_zh, name_en, sort_order, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [code, dto.nameZh.trim(), dto.nameEn.trim(), dto.sortOrder ?? 0, operator],
    );
    this.invalidateCache();
    return this.mapLine(r.rows[0]);
  }

  async updateLine(code: string, dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    if (dto.code !== undefined && dto.code !== code) throw new BadRequestException({ code: 'DICT_CODE_IMMUTABLE' });
    const row = await this.getLineRow(code);
    const r = await pool.query(
      `UPDATE insurance_line
          SET name_zh = $1, name_en = $2, sort_order = $3, updated_by = $4, updated_at = NOW()
        WHERE id = $5 RETURNING *`,
      [
        dto.nameZh?.trim() ?? row.name_zh,
        dto.nameEn?.trim() ?? row.name_en,
        dto.sortOrder ?? row.sort_order,
        operator, row.id,
      ],
    );
    this.invalidateCache();
    return this.mapLine(r.rows[0]);
  }

  /** 启停（不阻断，返回影响数供前端确认框/黄条展示） */
  async setLineStatus(code: string, status: string, operator: string) {
    if (!['active', 'disabled'].includes(status)) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const row = await this.getLineRow(code);
    const usage = await this.usage('line', code);
    const r = await pool.query(
      `UPDATE insurance_line SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 RETURNING status`,
      [status, operator, row.id],
    );
    this.invalidateCache();
    return { code, status: r.rows[0].status, ...usage };
  }

  async deleteLine(code: string, operator: string) {
    const row = await this.getLineRow(code);
    const usage = await this.usage('line', code);
    if (usage.productCount > 0 || (usage.subLineCount ?? 0) > 0) {
      throw new ConflictException({ code: 'DICT_IN_USE', ...usage });
    }
    await pool.query(`UPDATE insurance_line SET deleted = TRUE, updated_by = $1, updated_at = NOW() WHERE id = $2`, [operator, row.id]);
    this.invalidateCache();
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────
  //  子险种
  // ─────────────────────────────────────────────────────────────

  async listSubLines(lineCode: string, includeDisabled = false) {
    await this.getLineRow(lineCode);
    const disabled = includeDisabled ? '' : ` AND status = 'active'`;
    const r = await pool.query(
      `SELECT s.id, s.line_code, s.code, s.name_zh, s.name_en, s.sort_order, s.status, s.created_at, s.updated_at,
              (SELECT count(*)::int FROM insurance_product p WHERE p.deleted = FALSE AND lower(p.sub_line) = lower(s.code)) AS product_count
         FROM insurance_sub_line s
        WHERE s.line_code = $1 AND s.deleted = FALSE${disabled}
        ORDER BY s.sort_order, s.id`,
      [lineCode],
    );
    return r.rows.map((x: any) => ({
      id: x.id, lineCode: x.line_code, code: x.code, nameZh: x.name_zh, nameEn: x.name_en,
      sortOrder: x.sort_order, status: x.status, productCount: x.product_count,
      createdAt: x.created_at, updatedAt: x.updated_at,
    }));
  }

  private async getSubLineRow(id: number) {
    const r = await pool.query(`SELECT id, line_code, code, name_zh, name_en, sort_order, status, deleted FROM insurance_sub_line WHERE id = $1`, [id]);
    if (r.rows.length === 0 || r.rows[0].deleted) {
      throw new NotFoundException({ code: 'DICT_SUB_LINE_NOT_FOUND' });
    }
    return r.rows[0];
  }

  async createSubLine(lineCode: string, dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    await this.getLineRow(lineCode);
    const code = String(dto.code ?? '').trim();
    if (!code || code.length > 64) throw new BadRequestException({ code: 'DICT_INVALID_CODE_FORMAT' });
    if (!dto.nameZh?.trim() || !dto.nameEn?.trim()) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const exists = await pool.query(`SELECT 1 FROM insurance_sub_line WHERE line_code = $1 AND code = $2`, [lineCode, code]);
    if (exists.rows.length > 0) throw new ConflictException({ code: 'DICT_CODE_EXISTS' });
    const r = await pool.query(
      `INSERT INTO insurance_sub_line (line_code, code, name_zh, name_en, sort_order, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
      [lineCode, code, dto.nameZh.trim(), dto.nameEn.trim(), dto.sortOrder ?? 0, operator],
    );
    this.invalidateCache();
    return this.mapSubLine(r.rows[0]);
  }

  async updateSubLine(id: number, dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    if (dto.code !== undefined) throw new BadRequestException({ code: 'DICT_CODE_IMMUTABLE' });
    const row = await this.getSubLineRow(id);
    const r = await pool.query(
      `UPDATE insurance_sub_line
          SET name_zh = $1, name_en = $2, sort_order = $3, updated_by = $4, updated_at = NOW()
        WHERE id = $5 RETURNING *`,
      [
        dto.nameZh?.trim() ?? row.name_zh,
        dto.nameEn?.trim() ?? row.name_en,
        dto.sortOrder ?? row.sort_order,
        operator, row.id,
      ],
    );
    this.invalidateCache();
    return this.mapSubLine(r.rows[0]);
  }

  async setSubLineStatus(id: number, status: string, operator: string) {
    if (!['active', 'disabled'].includes(status)) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const row = await this.getSubLineRow(id);
    const usage = await this.usage('sub-line', row.code);
    const r = await pool.query(
      `UPDATE insurance_sub_line SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 RETURNING status`,
      [status, operator, row.id],
    );
    this.invalidateCache();
    return { id, status: r.rows[0].status, ...usage };
  }

  async deleteSubLine(id: number, operator: string) {
    const row = await this.getSubLineRow(id);
    const usage = await this.usage('sub-line', row.code);
    if (usage.productCount > 0) throw new ConflictException({ code: 'DICT_IN_USE', ...usage });
    await pool.query(`UPDATE insurance_sub_line SET deleted = TRUE, updated_by = $1, updated_at = NOW() WHERE id = $2`, [operator, row.id]);
    this.invalidateCache();
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────
  //  承保范围
  // ─────────────────────────────────────────────────────────────

  async listCoverages(includeDisabled = false) {
    const disabled = includeDisabled ? '' : ` AND status = 'active'`;
    const r = await pool.query(
      `SELECT c.id, c.code, c.name_zh, c.name_en, c.sort_order, c.status, c.created_at, c.updated_at
         FROM insurance_coverage c
        WHERE c.deleted = FALSE${disabled}
        ORDER BY c.sort_order, c.id`,
    );
    // 每行需要自己的别名数组（PascalCase 存量值兼容）→ 逐行统计
    const out: any[] = [];
    for (const x of r.rows) {
      const cnt = await pool.query(
        `SELECT count(*)::int AS n FROM insurance_product p
          WHERE p.deleted = FALSE
            AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(
                  CASE WHEN jsonb_typeof(p.coverages) = 'array' THEN p.coverages ELSE '[]'::jsonb END) cv
                 WHERE lower(cv) = ANY($1))`,
        [aliasVariantsOf(x.code)],
      );
      out.push({
        id: x.id, code: x.code, nameZh: x.name_zh, nameEn: x.name_en,
        sortOrder: x.sort_order, status: x.status, productCount: cnt.rows[0].n,
        createdAt: x.created_at, updatedAt: x.updated_at,
      });
    }
    return out;
  }

  private async getCoverageRow(code: string) {
    const r = await pool.query(`SELECT id, code, name_zh, name_en, sort_order, status, deleted FROM insurance_coverage WHERE code = $1`, [code]);
    if (r.rows.length === 0 || r.rows[0].deleted) {
      throw new NotFoundException({ code: 'DICT_COVERAGE_NOT_FOUND' });
    }
    return r.rows[0];
  }

  async createCoverage(dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    const code = String(dto.code ?? '').trim();
    if (!COVERAGE_CODE_RE.test(code)) throw new BadRequestException({ code: 'DICT_INVALID_CODE_FORMAT' });
    if (!dto.nameZh?.trim() || !dto.nameEn?.trim()) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const exists = await pool.query(`SELECT 1 FROM insurance_coverage WHERE code = $1`, [code]);
    if (exists.rows.length > 0) throw new ConflictException({ code: 'DICT_CODE_EXISTS' });
    const r = await pool.query(
      `INSERT INTO insurance_coverage (code, name_zh, name_en, sort_order, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [code, dto.nameZh.trim(), dto.nameEn.trim(), dto.sortOrder ?? 0, operator],
    );
    this.invalidateCache();
    return this.mapCoverage(r.rows[0]);
  }

  async updateCoverage(code: string, dto: { code?: string; nameZh?: string; nameEn?: string; sortOrder?: number }, operator: string) {
    if (dto.code !== undefined && dto.code !== code) throw new BadRequestException({ code: 'DICT_CODE_IMMUTABLE' });
    const row = await this.getCoverageRow(code);
    const r = await pool.query(
      `UPDATE insurance_coverage
          SET name_zh = $1, name_en = $2, sort_order = $3, updated_by = $4, updated_at = NOW()
        WHERE id = $5 RETURNING *`,
      [
        dto.nameZh?.trim() ?? row.name_zh,
        dto.nameEn?.trim() ?? row.name_en,
        dto.sortOrder ?? row.sort_order,
        operator, row.id,
      ],
    );
    this.invalidateCache();
    return this.mapCoverage(r.rows[0]);
  }

  async setCoverageStatus(code: string, status: string, operator: string) {
    if (!['active', 'disabled'].includes(status)) throw new BadRequestException({ code: 'DICT_INVALID_PARAMS' });
    const row = await this.getCoverageRow(code);
    const usage = await this.usage('coverage', code);
    const r = await pool.query(
      `UPDATE insurance_coverage SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 RETURNING status`,
      [status, operator, row.id],
    );
    this.invalidateCache();
    return { code, status: r.rows[0].status, ...usage };
  }

  async deleteCoverage(code: string, operator: string) {
    const row = await this.getCoverageRow(code);
    const usage = await this.usage('coverage', code);
    if (usage.productCount > 0 || (usage.relCount ?? 0) > 0) {
      throw new ConflictException({ code: 'DICT_IN_USE', ...usage });
    }
    await pool.query(`UPDATE insurance_coverage SET deleted = TRUE, updated_by = $1, updated_at = NOW() WHERE id = $2`, [operator, row.id]);
    this.invalidateCache();
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────
  //  业务线 × 承保范围 关联（全量替换）
  // ─────────────────────────────────────────────────────────────

  async getLineCoverages(lineCode: string) {
    await this.getLineRow(lineCode);
    const r = await pool.query(`SELECT coverage_code FROM line_coverage_rel WHERE line_code = $1`, [lineCode]);
    return { lineCode, coverageCodes: r.rows.map((x: any) => x.coverage_code) };
  }

  async replaceLineCoverages(lineCode: string, coverageCodes: string[], operator: string) {
    const line = await this.getLineRow(lineCode);
    const codes = Array.from(new Set((coverageCodes ?? []).map((c: string) => String(c).trim()).filter(Boolean)));
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 校验所有 coverage 存在且未删除
      for (const c of codes) {
        const r = await client.query(`SELECT 1 FROM insurance_coverage WHERE code = $1 AND deleted = FALSE`, [c]);
        if (r.rows.length === 0) throw new NotFoundException({ code: 'DICT_COVERAGE_NOT_FOUND' });
      }
      await client.query(`DELETE FROM line_coverage_rel WHERE line_code = $1`, [lineCode]);
      for (let i = 0; i < codes.length; i++) {
        await client.query(
          `INSERT INTO line_coverage_rel (line_code, coverage_code, created_by) VALUES ($1, $2, $3)
           ON CONFLICT (line_code, coverage_code) DO NOTHING`,
          [lineCode, codes[i], operator],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    this.invalidateCache();
    this.logger.log(`line_coverage_rel replaced: ${line.code} → [${codes.join(', ')}] by ${operator}`);
    return { lineCode, coverageCodes: codes };
  }

  // ─────────────────────────────────────────────────────────────
  //  引用统计（删除/停用确认框）
  // ─────────────────────────────────────────────────────────────

  async usage(type: 'line' | 'sub-line' | 'coverage', key: string, line?: string): Promise<{ productCount: number; subLineCount?: number; relCount?: number }> {
    if (type === 'line') {
      // 存量数据 line_of_business 大小写混杂（'AUTO'/'Auto'），与 match 校验一致按 UPPER 比较
      const p = await pool.query(`SELECT count(*)::int AS n FROM insurance_product WHERE deleted = FALSE AND UPPER(line_of_business) = UPPER($1)`, [key]);
      const s = await pool.query(`SELECT count(*)::int AS n FROM insurance_sub_line WHERE line_code = $1 AND deleted = FALSE`, [key]);
      return { productCount: p.rows[0].n, subLineCount: s.rows[0].n };
    }
    if (type === 'sub-line') {
      const p = await pool.query(`SELECT count(*)::int AS n FROM insurance_product WHERE deleted = FALSE AND lower(sub_line) = lower($1)`, [key]);
      return { productCount: p.rows[0].n };
    }
    // coverage：coverages JSONB 按「小写化 + 别名归一化」匹配；可选 line 限定业务线（矩阵取消勾选提示）
    const variants = aliasVariantsOf(key);
    const lineFilter = line ? ` AND UPPER(p.line_of_business) = UPPER($2)` : '';
    const params = line ? [variants, line] : [variants];
    const p = await pool.query(
      `SELECT count(*)::int AS n FROM insurance_product p
        WHERE p.deleted = FALSE
          AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(
                CASE WHEN jsonb_typeof(p.coverages) = 'array' THEN p.coverages ELSE '[]'::jsonb END) cv
               WHERE lower(cv) = ANY($1))${lineFilter}`,
      params,
    );
    const rel = await pool.query(`SELECT count(*)::int AS n FROM line_coverage_rel WHERE coverage_code = $1`, [key]);
    return { productCount: p.rows[0].n, relCount: rel.rows[0].n };
  }

  // ── 行映射 ───────────────────────────────────────────────────
  private mapLine(x: any) {
    return { id: x.id, code: x.code, nameZh: x.name_zh, nameEn: x.name_en, sortOrder: x.sort_order, status: x.status, createdAt: x.created_at, updatedAt: x.updated_at };
  }
  private mapSubLine(x: any) {
    return { id: x.id, lineCode: x.line_code, code: x.code, nameZh: x.name_zh, nameEn: x.name_en, sortOrder: x.sort_order, status: x.status, createdAt: x.created_at, updatedAt: x.updated_at };
  }
  private mapCoverage(x: any) {
    return { id: x.id, code: x.code, nameZh: x.name_zh, nameEn: x.name_en, sortOrder: x.sort_order, status: x.status, createdAt: x.created_at, updatedAt: x.updated_at };
  }
}
