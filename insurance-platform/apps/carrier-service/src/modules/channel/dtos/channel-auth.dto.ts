import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, Min, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** V1.0.11 doc 10.2: issuance operation permissions & premium limits. */
export class UpsertIssuancePermissionDto {
  @IsOptional() @IsBoolean() can_quote?: boolean;
  @IsOptional() @IsBoolean() can_bind?: boolean;
  @IsOptional() @IsBoolean() can_endorse?: boolean;
  @IsOptional() @IsBoolean() can_renew?: boolean;
  @IsOptional() @IsBoolean() can_surrender?: boolean;
  @IsOptional() @IsBoolean() can_claim_report?: boolean;
  @IsOptional() @IsIn(['direct', 'underwrite', 'forbidden']) bind_mode?: string;
  @IsOptional() @Type(() => Number) @Min(0) limit_per_policy?: number;
  @IsOptional() @Type(() => Number) @Min(0) limit_monthly?: number;
  @IsOptional() @Type(() => Number) @Min(0) limit_quarterly?: number;
  @IsOptional() @IsIn(['manual', 'forbidden', 'approval']) over_limit_rule?: string;
}

/** V1.0.11 doc 10.1: grant an integrated carrier product to a downstream channel. */
export class CreateChannelAuthorizationDto {
  @IsString() @IsNotEmpty() channel_id!: string;
  @IsString() @IsNotEmpty() product_id!: string;
  // States the channel may sell. Must be a subset of the product's available_states.
  @IsOptional() @IsArray() @IsString({ each: true }) authorized_states?: string[];
  @IsOptional() @IsIn(['permanent', 'fixed', 'trial']) grant_type?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string;

  // Optional issuance permissions created together with the grant (doc 10.2).
  @IsOptional() @ValidateNested() @Type(() => UpsertIssuancePermissionDto)
  permissions?: UpsertIssuancePermissionDto;
}

export class UpdateChannelAuthorizationDto {
  @IsOptional() @IsArray() @IsString({ each: true }) authorized_states?: string[];
  @IsOptional() @IsIn(['permanent', 'fixed', 'trial']) grant_type?: string;
  @IsOptional() @IsString() effective_date?: string;
  @IsOptional() @IsString() expiration_date?: string | null;
}

export class SetAuthorizationStatusDto {
  @IsIn(['revoke', 'renew']) action!: 'revoke' | 'renew';
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() expiration_date?: string;
}
