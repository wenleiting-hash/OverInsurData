/**
 * Department Management DTOs
 *
 * All DTOs use class-validator decorators for ValidationPipe (whitelist:true) compatibility.
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Create department request DTO
export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  dept_name_zh!: string;

  @IsOptional()
  @IsString()
  dept_name_en?: string;

  @IsOptional()
  @IsString()
  dept_code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_dept_id?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  manager_name?: string;

  @IsOptional()
  @IsString()
  manager_title?: string;

  @IsOptional()
  @IsString()
  manager_email?: string;

  @IsOptional()
  @IsString()
  manager_phone?: string;

  @IsOptional()
  @IsString()
  office_location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort_order?: number;
}

// Update department request DTO (partial)
export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dept_name_zh?: string;

  @IsOptional()
  @IsString()
  dept_name_en?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_dept_id?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  manager_name?: string;

  @IsOptional()
  @IsString()
  manager_title?: string;

  @IsOptional()
  @IsString()
  manager_email?: string;

  @IsOptional()
  @IsString()
  manager_phone?: string;

  @IsOptional()
  @IsString()
  office_location?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort_order?: number;
}

// Department members query params
export class GetDepartmentMembersParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;
}
