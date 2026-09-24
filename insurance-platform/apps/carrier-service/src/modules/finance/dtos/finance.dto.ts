import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray,
  IsIn, IsObject, IsInt, Min, Max, MaxLength, ArrayMaxSize, ValidateNested, IsEmail,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const CATEGORIES = ['commission', 'premium'] as const;
const FILE_FORMATS = ['csv', 'xls', 'xlsx'] as const;

/** 单行金额/文本结构同时用于账单行与对账单行（行级业务校验在 service 内完成，支持部分成功）。 */
export class FinanceRowDto {
  @IsOptional() @IsString() policy_number?: string;
  @IsOptional() @IsString() insured_name?: string;
  @IsOptional() @IsString() npn?: string;
  @IsOptional() @IsString() product_code?: string;
  @IsOptional() @IsString() channel_name?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() line_of_business?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) premium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1) commission_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) commission_amount?: number;
}

export class BillImportDto {
  @IsString() @IsNotEmpty() insurer_id!: string;

  @IsString() @IsNotEmpty()
  // YYYY-MM
  period_month!: string;

  @IsOptional() @IsIn(CATEGORIES)
  category?: string;

  @IsString() @IsNotEmpty() file_name!: string;

  @IsOptional() @IsIn(FILE_FORMATS)
  file_format?: string;

  @IsOptional() @IsString() file_size?: string;

  /** 通用上传端点 POST /api/uploads 返回的访问 url。 */
  @IsOptional() @IsString() source_url?: string;

  @IsOptional() @IsString() source_stored_name?: string;

  @IsOptional() @IsString() mapping_template_id?: string;

  @IsArray() @ArrayMaxSize(20000)
  @ValidateNested({ each: true }) @Type(() => FinanceRowDto)
  rows!: FinanceRowDto[];
}

export class StatementImportDto {
  @IsString() @IsNotEmpty() insurer_id!: string;

  @IsString() @IsNotEmpty()
  period_month!: string;

  @IsOptional() @IsIn(CATEGORIES)
  category?: string;

  @IsOptional() @IsString() file_name?: string;

  @IsOptional() @IsIn(FILE_FORMATS)
  file_format?: string;

  @IsOptional() @IsString() file_size?: string;

  @IsOptional() @IsString() source_url?: string;

  @IsOptional() @IsString() source_stored_name?: string;

  @IsOptional() @IsIn(['import', 'manual'])
  source?: string;

  @IsArray() @ArrayMaxSize(20000)
  @ValidateNested({ each: true }) @Type(() => FinanceRowDto)
  rows!: FinanceRowDto[];
}

export class StatementLineAdjustDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) premium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1) commission_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) commission_amount?: number;
}

export class StatementConfirmDto {
  @IsOptional() @IsString() note?: string;
}

export class MappingTemplateUpsertDto {
  @IsString() @IsNotEmpty() insurer_id!: string;

  @IsOptional() @IsIn(CATEGORIES)
  category?: string;

  @IsString() @IsNotEmpty() template_name!: string;

  @IsIn(FILE_FORMATS)
  file_format!: string;

  @IsOptional() @IsString() sheet_name?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) header_row?: number;

  @IsObject()
  mapping_json!: Record<string, unknown>;

  @IsOptional() @IsBoolean() enabled?: boolean;
}

export class ReconcileStartDto {
  @IsString() @IsNotEmpty() insurer_id!: string;

  @IsString() @IsNotEmpty()
  period_month!: string;

  @IsOptional() @IsIn(CATEGORIES)
  category?: string;
}

export class DiffActionDto {
  /** V1.0.15：批次内联处理。resolve=标记已处理；suspend=挂起；reopen=重新打开。 */
  @IsIn(['resolve', 'suspend', 'reopen'])
  action!: string;

  /** action=resolve 时必填：五类处理结果。 */
  @IsOptional()
  @IsIn(['carrier_bill_error', 'our_calc_error', 'rate_corrected', 'mutual_agreed', 'data_confirmed'])
  resolution_result?: string;

  /** resolve 备注 / suspend 挂起原因（suspend 必填）。 */
  @IsOptional() @IsString() note?: string;
}

export class DiffFollowUpDto {
  @IsString() @IsNotEmpty() note!: string;
}

/** V1.0.15 批次封帐（确认对账）。 */
export class BillCompleteDto {
  @IsOptional() @IsString() note?: string;
}

export class FinanceProfileUpsertDto {
  @IsOptional() @IsString() next_due_date?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) next_due_amount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) ytd_settled?: number;
  @IsOptional() @IsString() bank_account?: string;
  @IsOptional() @IsString() routing_number?: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) notify_days_before?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) min_settle_amount?: number;
  @IsOptional() @IsBoolean() auto_reconcile?: boolean;
}

export class CommissionRateUpsertDto {
  @IsString() @IsNotEmpty() carrier_id!: string;

  @IsIn(['lob', 'product'])
  dimension!: string;

  @IsOptional() @IsString() line_of_business?: string;

  @IsOptional() @IsString() product_id?: string;

  /** 美国州缩写（如 CA/TX）；空串/null=全域适用（PUT 传 null 可清空）。 */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString() @MaxLength(8)
  state?: string | null;

  @Type(() => Number) @IsNumber() @Min(0) @Max(1)
  rate!: number;

  @IsString() @IsNotEmpty()
  // YYYY-MM-DD
  effective_from!: string;

  @IsOptional() @IsString() effective_to?: string;

  @IsOptional() @IsIn(['active', 'pending', 'expired'])
  status?: string;

  /** 备注（V1.0.15 新增佣金率弹窗字段）。 */
  @IsOptional() @IsString() @MaxLength(512)
  remark?: string;
}

/** 佣金率批量导入单行（模板列同构）。 */
export class CommissionRateRowDto {
  @IsIn(['lob', 'product']) dimension!: string;
  @IsOptional() @IsString() line_of_business?: string;
  @IsOptional() @IsString() product_id?: string;
  @IsOptional() @IsString() @MaxLength(8) state?: string;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) rate!: number;
  @IsString() @IsNotEmpty() effective_from!: string;
  @IsOptional() @IsString() effective_to?: string;
  @IsOptional() @IsString() @MaxLength(512) remark?: string;
}

export class CommissionRateImportDto {
  @IsString() @IsNotEmpty() carrier_id!: string;

  @IsArray() @ArrayMaxSize(5000)
  @ValidateNested({ each: true }) @Type(() => CommissionRateRowDto)
  rows!: CommissionRateRowDto[];
}

/** 试算预览：按 保司+产品/险种+州+模拟保费 命中四级回退档位。 */
export class CommissionRateTrialDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsOptional() @IsString() product_id?: string;
  @IsOptional() @IsString() line_of_business?: string;
  @IsOptional() @IsString() @MaxLength(8) state?: string;
  @Type(() => Number) @IsNumber() @Min(0) premium!: number;
  /** 生效日（默认今天）。 */
  @IsOptional() @IsString() on_date?: string;
}
