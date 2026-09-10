import { Injectable, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // ─── Overview ──────────────────────────────────────────────────────

  async getOverview(query: { period?: string }) {
    const { period } = query;
    // KPI aggregation from commission_bill + insurance_carrier
    const [billStats, carrierStats, trendRes] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(total_premium), 0) AS total_premium,
               COALESCE(SUM(total_commission), 0) AS total_commission,
               COALESCE(SUM(total_policies), 0) AS total_policies,
               COUNT(*) AS total_bills
        FROM commission_bill WHERE deleted = FALSE ${period ? "AND period = $1" : ""}
      `, period ? [period] : []),
      pool.query(`SELECT COUNT(*) AS total_carriers FROM insurance_carrier WHERE deleted = FALSE`),
      pool.query(`
        SELECT period, SUM(total_premium) AS premium, SUM(total_commission) AS commission, SUM(total_policies) AS policies
        FROM commission_bill WHERE deleted = FALSE GROUP BY period ORDER BY period ASC LIMIT 12
      `),
    ]);
    const b = billStats.rows[0] || {};
    return {
      kpi: {
        total_premium: parseFloat(b.total_premium || '0'),
        total_commission: parseFloat(b.total_commission || '0'),
        total_policies: parseInt(b.total_policies || '0', 10),
        total_bills: parseInt(b.total_bills || '0', 10),
        total_carriers: parseInt((carrierStats.rows[0] || {}).total_carriers || '0', 10),
      },
      trend: trendRes.rows,
    };
  }

  // ─── Products ──────────────────────────────────────────────────────

  async getProducts(query: { period?: string }) {
    // Product performance: aggregate by line_of_business from commission_bill_line
    const res = await pool.query(`
      SELECT l.line_of_business AS product,
             COUNT(*) AS policies,
             SUM(l.premium) AS premium,
             SUM(l.commission_amount) AS commission,
             AVG(l.commission_rate) AS avg_rate
      FROM commission_bill_line l
      JOIN commission_bill b ON l.bill_id = b.bill_id
      WHERE l.deleted = FALSE AND b.deleted = FALSE
      GROUP BY l.line_of_business
      ORDER BY premium DESC
    `);
    return { data: res.rows };
  }

  // ─── Regional ──────────────────────────────────────────────────────

  async getRegional(query: { period?: string }) {
    const res = await pool.query(`
      SELECT l.state,
             COUNT(*) AS policies,
             SUM(l.premium) AS premium,
             SUM(l.commission_amount) AS commission
      FROM commission_bill_line l
      JOIN commission_bill b ON l.bill_id = b.bill_id
      WHERE l.deleted = FALSE AND b.deleted = FALSE
      GROUP BY l.state
      ORDER BY premium DESC
    `);
    return { data: res.rows };
  }

  // ─── Channels ──────────────────────────────────────────────────────

  async getChannels(query: { period?: string }) {
    const res = await pool.query(`
      SELECT l.channel_id, l.channel_name,
             COUNT(*) AS policies,
             SUM(l.premium) AS premium,
             SUM(l.commission_amount) AS commission
      FROM commission_bill_line l
      JOIN commission_bill b ON l.bill_id = b.bill_id
      WHERE l.deleted = FALSE AND b.deleted = FALSE
      GROUP BY l.channel_id, l.channel_name
      ORDER BY premium DESC
    `);
    return { data: res.rows };
  }

  // ─── Loss Ratio ────────────────────────────────────────────────────

  async getLossRatio(query: { period?: string }) {
    // Loss ratio monitoring: placeholder — requires claims data table (V1.10+)
    // For now return empty with structure matching insurerAnalyticsData lossRatioTrend
    const billStats = await pool.query(`
      SELECT period, SUM(total_premium) AS premium, SUM(total_commission) AS commission
      FROM commission_bill WHERE deleted = FALSE
      GROUP BY period ORDER BY period ASC LIMIT 12
    `);
    return {
      trend: billStats.rows.map(r => ({
        period: r.period,
        premium: parseFloat(r.premium),
        commission: parseFloat(r.commission),
        loss_ratio: 0, // Claims data not available yet
      })),
      alerts: [],
    };
  }

  // ─── Renewal ───────────────────────────────────────────────────────

  async getRenewal(query: { period?: string }) {
    // Renewal analysis: placeholder — requires policy lifecycle data (V1.10+)
    // Return empty structure matching insurerAnalyticsData renewalTrend
    return {
      trend: [],
      cohorts: [],
      by_product: [],
    };
  }

  // ─── Export ────────────────────────────────────────────────────────

  async exportReport(query: { format?: string; sections?: string }) {
    // Export placeholder — actual file generation deferred to V1.10
    return {
      status: 'generating',
      format: query.format || 'Excel',
      message: 'Report generation queued. Export feature will be available in V1.10.',
    };
  }
}
