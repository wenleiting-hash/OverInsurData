import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCooperationDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsOptional() @IsString() cooperation_type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() owner_name?: string;
  @IsOptional() @IsString() commission_tier?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() notes_en?: string;
  @IsOptional() @IsString() settlement_method?: string;
  @IsOptional() @Type(() => Number) @IsNumber() settlement_cycle_days?: number;
  @IsOptional() @IsString() premium_collection?: string;
  @IsOptional() @IsString() premium_settlement?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string;
  @IsOptional() product_scope?: any;
  @IsOptional() @IsArray() state_scope?: string[];
}

export class UpdateCooperationDto {
  @IsOptional() @IsString() cooperation_type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() owner_name?: string;
  @IsOptional() @IsString() commission_tier?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() notes_en?: string;
  @IsOptional() @IsString() settlement_method?: string;
  @IsOptional() @Type(() => Number) @IsNumber() settlement_cycle_days?: number;
  @IsOptional() @IsString() premium_collection?: string;
  @IsOptional() @IsString() premium_settlement?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string;
  @IsOptional() product_scope?: any;
  @IsOptional() @IsArray() state_scope?: string[];
}

export class TerminateCooperationDto {
  @IsString() @IsNotEmpty() reason!: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsIn(['immediate', 'end-of-term', 'scheduled']) effectType?: string;
  @IsOptional() @IsString() effectiveAt?: string;
}

export class CreateContractDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() title_en?: string;
  @IsOptional() @IsString() contract_type?: string;
  @IsOptional() @IsString() partnership_id?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiry_date?: string;
  @IsOptional() @IsString() signatory_us?: string;
  @IsOptional() @IsString() signatory_them?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() auto_renew?: boolean;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsArray() tags_en?: string[];
  @IsOptional() @IsString() file_url?: string;
}

export class UpdateContractDto {
  @IsOptional() @IsString() carrier_id?: string;
  // ContractModal submits partnership_id on edits too; whitelist it (service ignores it on UPDATE).
  @IsOptional() @IsString() partnership_id?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() title_en?: string;
  @IsOptional() @IsString() contract_type?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiry_date?: string;
  @IsOptional() @IsString() signatory_us?: string;
  @IsOptional() @IsString() signatory_them?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() auto_renew?: boolean;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsArray() tags_en?: string[];
  @IsOptional() @IsString() file_url?: string;
}

export class SetContractStatusDto {
  @IsString() @IsNotEmpty() status!: string;
}

export class CreateContactDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsString() @IsNotEmpty() full_name!: string;
  @IsOptional() @IsString() partnership_id?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile_phone?: string;
  @IsOptional() @IsString() office_address?: string;
  @IsOptional() @IsBoolean() is_primary?: boolean;
}

export class UpdateContactDto {
  @IsOptional() @IsString() carrier_id?: string;
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile_phone?: string;
  @IsOptional() @IsString() office_address?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsBoolean() is_primary?: boolean;
}

export class UpsertSettlementDto {
  @IsOptional() @IsString() carrier_id?: string;
  @IsOptional() @IsString() cycle?: string;
  @IsOptional() @Type(() => Number) @IsNumber() bill_cutoff_day?: number;
  @IsOptional() @Type(() => Number) @IsNumber() payment_term_days?: number;
  @IsOptional() @IsString() payment_method?: string;
  @IsOptional() @IsString() billing_format?: string;
  @IsOptional() @IsBoolean() api_enabled?: boolean;
  @IsOptional() @IsString() premium_collection?: string;
}

export class CreateRenewalDto {
  @IsOptional() @IsString() contract_id?: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() expiry_date!: string;
  @IsOptional() @IsIn(['critical', 'high', 'normal', 'low']) priority?: string;
  @IsOptional() @IsString() account_manager?: string;
  @IsOptional() @IsBoolean() auto_renew?: boolean;
  @IsOptional() @IsString() last_action?: string;
}

export class UpdateRenewalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() expiry_date?: string;
  @IsOptional() @IsIn(['critical', 'high', 'normal', 'low']) priority?: string;
  @IsOptional() @IsIn(['upcoming', 'in-negotiation', 'renewed', 'expired']) status?: string;
  @IsOptional() @IsString() account_manager?: string;
  @IsOptional() @IsBoolean() auto_renew?: boolean;
  @IsOptional() @IsString() last_action?: string;
}

export class ExecuteRenewalDto {
  @IsOptional() @IsString() new_expiry_date?: string;
}

export class CreateAccessRequestDto {
  @IsOptional() @IsString() partnership_id?: string;
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsOptional() @IsString() product_id?: string;
  @IsString() @IsNotEmpty() product_name!: string;
  @IsOptional() @IsString() product_code?: string;
  @IsOptional() @IsString() line_of_business?: string;
  @IsOptional() @IsArray() target_states?: string[];
  @IsOptional() @IsIn(['high', 'normal', 'low']) priority?: string;
  @IsOptional() @Type(() => Number) @IsNumber() estimated_premium?: number;
  @IsOptional() @IsArray() technical_reqs?: string[];
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAccessRequestStatusDto {
  // Optional: a status transition. When omitted the call only flips the
  // technical-readiness flags (api_doc / test_completed) while in 'approved'.
  @IsOptional() @IsString() @IsNotEmpty() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() api_doc?: boolean;
  @IsOptional() @IsBoolean() test_completed?: boolean;
}

// ── V1.0.15 续约直接登记（O6：无谈判/待执行中间态）──

export class RegisterRenewalDto {
  /** 续约后新到期日（必须晚于今天）。 */
  @IsString() @IsNotEmpty() new_expiry_date!: string;
  /** 续约合同（carrier_contract.contract_id，可选；传则同步延长该合同到期日）。 */
  @IsOptional() @IsString() new_contract_id?: string;
  /** 登记备注。 */
  @IsOptional() @IsString() note?: string;
}

// ── V1.0.15 合作-产品关联（取代五步接入申请）──

export class AddProductLinksDto {
  @IsArray() @IsString({ each: true }) product_ids!: string[];
  @IsOptional() @IsString() effective_from?: string;
  @IsOptional() @IsString() remark?: string;
}

export class UpdateProductLinkDto {
  /** 接入备注；传空串表示清空。 */
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() effective_from?: string;
}
