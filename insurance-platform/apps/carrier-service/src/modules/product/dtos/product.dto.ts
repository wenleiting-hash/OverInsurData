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
