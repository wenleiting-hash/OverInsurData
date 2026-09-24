import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One persisted product compliance/training document (metadata only — the file bytes live on the
 * server under /uploads). Must be an explicit class: with the global ValidationPipe's
 * `enableImplicitConversion`, a bare `any[]` property has `Array` as its only reflected type, so
 * class-transformer converts each element to an empty array and silently destroys the objects.
 */
export class ProductDocumentDto {
  @IsString() @IsNotEmpty() key!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @Type(() => Number) @IsNumber() size?: number;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() mimetype?: string;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsString() @IsNotEmpty() product_name!: string;
  @IsString() @IsNotEmpty() product_code!: string;
  @IsString() @IsNotEmpty() line_of_business!: string;
  @IsOptional() @IsString() short_name?: string;
  @IsOptional() @IsString() naic_code?: string;
  @IsOptional() @IsString() naic_form_number?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() description_en?: string;
  @IsOptional() @IsArray() coverages?: string[];
  @IsOptional() @IsString() sub_line?: string;
  @IsOptional() @IsString() product_type?: string;
  @IsOptional() @IsString() insurer_name?: string;
  @IsOptional() @IsString() underwriting_mode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() max_policy_limit?: number;
  @IsOptional() @IsBoolean() mga_negotiation?: boolean;
  @IsOptional() @IsString() renewal_type?: string;
  @IsOptional() @Type(() => Number) @IsNumber() policy_term_years?: number;
  @IsOptional() @IsArray() available_states?: string[];
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string;
  @IsOptional() @IsString() rate_type?: string;
  @IsOptional() @Type(() => Number) @IsNumber() base_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() min_premium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() max_premium?: number;
  @IsOptional() @IsArray() rate_factors?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() age_min?: number;
  @IsOptional() @Type(() => Number) @IsNumber() age_max?: number;
  @IsOptional() @IsBoolean() exclude_dui?: boolean;
  @IsOptional() @IsBoolean() refer_high_value?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() refer_threshold?: number;
  @IsOptional() @IsArray() blacklist_conditions?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductDocumentDto) documents?: ProductDocumentDto[];
  @IsOptional() @IsString() @IsIn(['Active', 'Inactive', 'Paused', 'Incomplete']) status?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

/**
 * Payload for PATCH /api/products/:id/toggle-status.
 *
 * 上下架必须携带原因（写入 status_reason 并记审计日志）；scope=selected 时必须带 states。
 * effectiveAt 为空/过去时间 => 立即生效；为未来时间 => 写入 pending_change 定时生效。
 */
export class ToggleProductStatusDto {
  /** 缺省时按当前状态推断：Active -> delist，其余 -> list。 */
  @IsOptional() @IsIn(['list', 'delist']) action?: string;
  /** 稳定原因码（如 rate-file-expired / risk-control），不随界面语言变化，便于审计检索。 */
  @IsString() @IsNotEmpty() reason!: string;
  @IsOptional() @IsString() remark?: string;
  /** all=全部可售州下架（产品整体 Paused）；selected=仅暂停指定州（产品仍 Active）。 */
  @IsOptional() @IsIn(['all', 'selected']) scope?: string;
  /** scope=selected 时必填：州代码数组，如 ['CA','NY']。 */
  @IsOptional() @IsArray() @IsString({ each: true }) states?: string[];
  /** ISO 8601 计划生效时间；空/null 表示立即生效。 */
  @IsOptional() @IsString() effectiveAt?: string | null;
}

export class SetProductStateStatusDto {
  /** 单州只允许 已开通(active) ↔ 已暂停(suspended)；not-available 的州不能在此开通。 */
  @IsIn(['active', 'suspended']) status!: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() carrier_id?: string;
  @IsOptional() @IsString() product_name?: string;
  @IsOptional() @IsString() short_name?: string;
  @IsOptional() @IsString() product_code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() description_en?: string;
  @IsOptional() @IsArray() coverages?: string[];
  @IsOptional() @IsString() line_of_business?: string;
  @IsOptional() @IsString() sub_line?: string;
  @IsOptional() @IsString() product_type?: string;
  @IsOptional() @IsString() underwriting_mode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() max_policy_limit?: number;
  @IsOptional() @IsBoolean() mga_negotiation?: boolean;
  @IsOptional() @IsString() renewal_type?: string;
  @IsOptional() @Type(() => Number) @IsNumber() policy_term_years?: number;
  @IsOptional() @IsArray() available_states?: string[];
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsString() rate_type?: string;
  @IsOptional() @Type(() => Number) @IsNumber() base_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() min_premium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() max_premium?: number;
  @IsOptional() @IsArray() rate_factors?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() premium_ytd?: number;
  @IsOptional() @Type(() => Number) @IsNumber() policy_count?: number;
  @IsOptional() @Type(() => Number) @IsNumber() avg_premium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() loss_ratio?: number;
  @IsOptional() @Type(() => Number) @IsNumber() renewal_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() age_min?: number;
  @IsOptional() @Type(() => Number) @IsNumber() age_max?: number;
  @IsOptional() @IsBoolean() exclude_dui?: boolean;
  @IsOptional() @IsBoolean() refer_high_value?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() refer_threshold?: number;
  @IsOptional() @IsArray() blacklist_conditions?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductDocumentDto) documents?: ProductDocumentDto[];
}
