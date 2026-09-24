import {
  IsString, IsOptional, IsIn, IsInt, Min, Max, IsNotEmpty,
  IsArray, IsBoolean, IsNumber, ValidateNested, ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIntegrationAppDto {
  @IsString()
  @IsNotEmpty()
  appName: string;

  @IsOptional()
  @IsString()
  appDesc?: string;

  @IsOptional()
  @IsString()
  ipWhitelist?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimit?: number;
}

export class UpdateIntegrationAppDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  appDesc?: string;

  @IsOptional()
  @IsString()
  ipWhitelist?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimit?: number;

  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: string;
}

/**
 * I3 保单咨询匹配 — 投保人风险画像（L2 强烈建议，整体及内部字段均可选）。
 * 缺失的风险字段按 unknown 处理：不做硬排除，evaluation 对应项返回 null。
 */
export class ConsultationRiskProfileDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(120)
  age?: number;

  /** good / fair / poor；枚举合法性在 service 中校验以返回业务 code */
  @IsOptional() @IsString()
  credit_status?: string;

  @IsOptional() @IsBoolean()
  dui_history?: boolean;

  @IsOptional() @IsBoolean()
  fraud_history?: boolean;

  @IsOptional() @IsBoolean()
  misrepresentation_history?: boolean;

  /** 标的车辆当前价值（USD） */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  vehicle_value?: number;

  /** 预留：一期仅回显审计 */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  claims_count_3y?: number;

  /** personal / business / rideshare；预留：一期仅回显审计 */
  @IsOptional() @IsString()
  vehicle_usage?: string;
}

/** I3 — 保费预算区间（USD），与产品保费区间有交集即命中 */
export class PremiumBudgetDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  min?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  max?: number;
}

/**
 * I3 保单咨询匹配请求（V1.1）。
 * 必填策略：仅 L1 的 line_of_business + state 必填，其余全部可选（缺失＝该维度不限制）。
 * 枚举/互斥/语义校验在 IntegrationService 中进行，以返回带业务 code 的错误响应；
 * 此处只做结构/类型白名单（全局 ValidationPipe forbidNonWhitelisted，字段必须显式声明）。
 */
export class ConsultationMatchDto {
  // ── L1 必填 ────────────────────────────────────────────
  @IsString() @IsNotEmpty()
  line_of_business!: string;

  @IsString() @IsNotEmpty()
  state!: string;

  // ── L3 产品维度过滤 ────────────────────────────────────
  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  product_types?: string[];

  @IsOptional() @IsString()
  sub_line?: string;

  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  coverages?: string[];

  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  rate_factors?: string[];

  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  underwriting_modes?: string[];

  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  rate_types?: string[];

  /** 客户期望的保险期间（年）；按"产品最长保险期间 ≥ 期望值"匹配。产品端离散支持 1/2/3/5/10 */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  policy_term_years?: number;

  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  renewal_types?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  target_premium?: number;

  @IsOptional() @ValidateNested() @Type(() => PremiumBudgetDto)
  premium_budget?: PremiumBudgetDto;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  required_policy_limit?: number;

  /** YYYY-MM-DD；不传按当前日期 */
  @IsOptional() @IsString()
  policy_effective_date?: string;

  @IsOptional() @IsBoolean()
  instant_decision_required?: boolean;

  // ── L2 风险画像 ────────────────────────────────────────
  @IsOptional() @ValidateNested() @Type(() => ConsultationRiskProfileDto)
  risk_profile?: ConsultationRiskProfileDto;

  // ── L4 场景控制 ────────────────────────────────────────
  @IsOptional() @IsString()
  product_code?: string;

  @IsOptional() @IsString()
  keyword?: string;

  @IsOptional() @IsBoolean()
  include_rejected?: boolean;

  @IsOptional() @IsString()
  lang?: string;

  /** 已废弃（V1.0 无数据模型支撑），显式声明以避免严格管道 400，service 中忽略 */
  @IsOptional() @IsString()
  customer_type?: string;
}
