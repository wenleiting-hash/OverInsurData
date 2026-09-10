import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsArray,
  Matches, MaxLength, IsIn, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

const NAIC_MSG = 'NAIC Code must be exactly 5 digits (e.g. 25658)';
const NAME_MAX = 128;
const SHORT_NAME_MAX = 64;

export class CreateInsurerDto {
  @IsString({ message: 'NAIC Code must be a string' })
  @IsNotEmpty({ message: 'NAIC Code is required' })
  @Matches(/^\d{5}$/, { message: NAIC_MSG })
  naic_code!: string;

  @IsString({ message: 'Company Name must be a string' })
  @IsNotEmpty({ message: 'Company Name is required' })
  @MaxLength(NAME_MAX, { message: `Company Name cannot exceed ${NAME_MAX} characters` })
  carrier_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(SHORT_NAME_MAX, { message: `Short Name cannot exceed ${SHORT_NAME_MAX} characters` })
  carrier_name_short?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Admitted', 'Non-Admitted'], { message: 'Company Type must be "Admitted" or "Non-Admitted"' })
  carrier_type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending'], { message: 'Status must be "active", "inactive", or "pending"' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4, { message: 'State must be a 2-letter code (e.g. NY, CA)' })
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  coop_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Founded Year must be a number' })
  @Min(1800, { message: 'Founded Year must be 1800 or later' })
  @Max(new Date().getFullYear(), { message: `Founded Year cannot be later than ${new Date().getFullYear()}` })
  founded_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(256, { message: 'Website URL cannot exceed 256 characters' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8, { message: 'AM Best Rating code is too long' })
  am_best_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8, { message: 'S&P Rating code is too long' })
  sp_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8, { message: "Moody's Rating code is too long" })
  moodys_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8, { message: 'Fitch Rating code is too long' })
  fitch_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  settlement_cycle?: string;

  @IsOptional()
  @IsString()
  contract_expiry?: string;

  @IsOptional()
  @IsArray({ message: 'Business Lines must be an array' })
  @IsString({ each: true, message: 'Each Business Line must be a string' })
  lines?: string[];
}

export class UpdateInsurerDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: NAIC_MSG })
  naic_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX, { message: `Company Name cannot exceed ${NAME_MAX} characters` })
  carrier_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(SHORT_NAME_MAX, { message: `Short Name cannot exceed ${SHORT_NAME_MAX} characters` })
  carrier_name_short?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Admitted', 'Non-Admitted'], { message: 'Company Type must be "Admitted" or "Non-Admitted"' })
  carrier_type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending'], { message: 'Status must be "active", "inactive", or "pending"' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4, { message: 'State must be a 2-letter code (e.g. NY, CA)' })
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  coop_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Founded Year must be a number' })
  founded_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  am_best_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  sp_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  moodys_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  fitch_rating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  settlement_cycle?: string;

  @IsOptional()
  @IsString()
  contract_expiry?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lines?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() loss_ratio?: number;
  @IsOptional() @Type(() => Number) @IsNumber() renewal_rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() revenue?: number;
  @IsOptional() @Type(() => Number) @IsNumber() policy_count?: number;
  @IsOptional() @Type(() => Number) @IsNumber() commission_income?: number;
  @IsOptional() @Type(() => Number) @IsNumber() channel_count?: number;
  @IsOptional() @Type(() => Number) @IsNumber() product_count?: number;
}
