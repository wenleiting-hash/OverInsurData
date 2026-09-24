import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for POST /api/products/:id/underwriting-rules.
 *
 * category / action / status are constrained to exactly the enums the ProductDetail view already
 * maps (ruleCatLabels[category].cls and RULE_ACTION_COLOR[action]); an unknown value would make the
 * rule card throw while rendering, so the API rejects it up front instead.
 */
export class CreateUnderwritingRuleDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsIn(['eligibility', 'rating', 'exclusion', 'referral']) category!: string;
  @IsOptional() @Type(() => Number) @IsNumber() priority?: number;
  @IsString() @IsNotEmpty() condition!: string;
  @IsOptional() @IsString() conditionEn?: string;
  @IsOptional() @IsString() conditionDetail?: string;
  @IsOptional() @IsString() conditionDetailEn?: string;
  @IsIn(['approve', 'decline', 'refer', 'surcharge', 'discount']) action!: string;
  @IsOptional() @IsString() actionValue?: string;
  @IsOptional() @IsString() actionValueEn?: string;
  @IsOptional() @IsIn(['active', 'inactive', 'testing']) status?: string;
}

/**
 * Payload for POST /api/products/:id/training-materials.
 *
 * `type` is constrained to the keys of MATERIAL_TYPE_ICON in ProductDetail (unknown types fall back
 * to a default icon there, but constraining keeps the material list consistent). uploadDate /
 * uploadedBy / downloads are server-assigned, so they are deliberately not accepted from the client.
 */
export class CreateTrainingMaterialDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() titleEn?: string;
  @IsIn(['product-guide', 'rate-manual', 'underwriting-guide', 'compliance', 'training-deck', 'faq', 'video']) type!: string;
  @IsOptional() @IsString() fileName?: string;
  /** Human-readable size label (DB column is varchar, e.g. "4.2 MB"). */
  @IsOptional() @IsString() fileSize?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsArray() requiredFor?: string[];
  @IsOptional() @IsString() expiryDate?: string;
  /** Public url of the uploaded file (from POST /api/uploads), stored alongside the metadata. */
  @IsOptional() @IsString() url?: string;
}

/**
 * Payload for PATCH /api/products/:id/underwriting-rules/:ruleId.
 *
 * Every field is optional so the edit dialog can send only what the user touched; the service builds
 * the SET clause from the keys actually present. Enums mirror CreateUnderwritingRuleDto.
 */
export class UpdateUnderwritingRuleDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsIn(['eligibility', 'rating', 'exclusion', 'referral']) category?: string;
  @IsOptional() @Type(() => Number) @IsNumber() priority?: number;
  @IsOptional() @IsString() @IsNotEmpty() condition?: string;
  @IsOptional() @IsString() conditionEn?: string;
  @IsOptional() @IsString() conditionDetail?: string;
  @IsOptional() @IsString() conditionDetailEn?: string;
  @IsOptional() @IsIn(['approve', 'decline', 'refer', 'surcharge', 'discount']) action?: string;
  @IsOptional() @IsString() actionValue?: string;
  @IsOptional() @IsString() actionValueEn?: string;
  @IsOptional() @IsIn(['active', 'inactive', 'testing']) status?: string;
}

/** Payload for PATCH .../underwriting-rules/:ruleId/status — the 生效/失效 entries of the "更多" menu. */
export class SetRuleStatusDto {
  @IsIn(['active', 'inactive', 'testing']) status!: string;
}

/** Payload for PATCH .../training-materials/:materialId/status — 置为有效/置为无效. */
export class SetMaterialStatusDto {
  @IsIn(['active', 'inactive']) status!: string;
}

/**
 * Payload for PATCH .../training-materials/:materialId — 编辑材料元数据/替换文件。
 * 所有字段可选；下载次数、上传日期、上传人由服务端维护，不在此接受。
 */
export class UpdateTrainingMaterialDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() titleEn?: string;
  @IsOptional() @IsIn(['product-guide', 'rate-manual', 'underwriting-guide', 'compliance', 'training-deck', 'faq', 'video']) type?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() fileSize?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsArray() requiredFor?: string[];
  @IsOptional() @IsString() expiryDate?: string;
  /** 替换文件后的新下载地址；不传则保留原文件。 */
  @IsOptional() @IsString() url?: string;
}

/** One rating factor of a rate plan; declared as a class so ValidateNested can check each element. */
export class RatingFactorDto {
  @IsString() @IsNotEmpty() factor!: string;
  @IsOptional() @Type(() => Number) @IsNumber() weight?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionEn?: string;
}

/**
 * Payload for POST /api/products/:id/rate-plans.
 *
 * tier / status are constrained to the keys ProductDetail already maps to a label and colour
 * (rpStatusLabels[status].cls would fall back to a gray badge on an unknown status). sort_order is
 * assigned server-side so the new plan lands at the end of the list.
 *
 * 本系统没有审批流程，所以费率方案不存在「待审批(pending)」态，也没有监管备案(filingStatus)概念：
 * 方案只有 生效中 / 草稿 / 已到期 三种状态。DB 里的 filing_status 列保留但不再读写。
 */
export class CreateRatePlanDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsIn(['Standard', 'Enhanced', 'Premium', 'Basic']) tier!: string;
  @Type(() => Number) @IsNumber() baseRate!: number;
  @IsOptional() @Type(() => Number) @IsNumber() minPremium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPremium?: number;
  @IsOptional() @IsString() effectiveDate?: string;
  @IsOptional() @IsString() expiryDate?: string;
  @IsOptional() @IsIn(['active', 'draft', 'expired']) status?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RatingFactorDto) ratingFactors?: RatingFactorDto[];
}

/**
 * Payload for PATCH /api/products/:id/rate-plans/:planId — the 编辑 dialog of the rate-plans tab.
 *
 * Every field is optional so the dialog can send only what the user touched; the service builds the
 * SET clause from the keys actually present. Enums mirror CreateRatePlanDto. Note that an omitted
 * optional number/date means "leave as stored", not "clear" — clearing a column to NULL is not
 * reachable from this endpoint because ProductDetail renders NULL premiums as $0 anyway (mapRatePlan
 * coerces with num()), so there would be no observable difference.
 */
export class UpdateRatePlanDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsIn(['Standard', 'Enhanced', 'Premium', 'Basic']) tier?: string;
  @IsOptional() @Type(() => Number) @IsNumber() baseRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() minPremium?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPremium?: number;
  @IsOptional() @IsString() effectiveDate?: string;
  @IsOptional() @IsString() expiryDate?: string;
  @IsOptional() @IsIn(['active', 'draft', 'expired']) status?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RatingFactorDto) ratingFactors?: RatingFactorDto[];
}

/** Payload for PATCH .../rate-plans/:planId/status (kept for symmetry with rules/materials). */
export class SetRatePlanStatusDto {
  @IsIn(['active', 'draft', 'expired']) status!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
