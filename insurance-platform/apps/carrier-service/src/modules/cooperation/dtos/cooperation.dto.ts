import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCooperationDto {
  @IsString() @IsNotEmpty() carrier_id!: string;
  @IsOptional() @IsString() cooperation_type?: string;
  @IsOptional() @IsString() status?: string;
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
