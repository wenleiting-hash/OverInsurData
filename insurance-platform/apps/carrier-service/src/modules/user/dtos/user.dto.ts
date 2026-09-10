/**
 * User Management DTOs
 *
 * All DTOs use class-validator decorators for ValidationPipe compatibility.
 */

import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, IsIn, MinLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// Create user request DTO
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name_zh?: string;

  @IsOptional()
  @IsString()
  name_en?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  deptCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleKeys?: string[];

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['local', 'sso', 'ldap'])
  authMethod?: string;
}

// Update user request DTO (partial)
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name_zh?: string;

  @IsOptional()
  @IsString()
  name_en?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  deptCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleKeys?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'locked'])
  status?: 'active' | 'inactive' | 'locked';

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// User list query params
export class GetUserListParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  statusFilter?: string;

  @IsOptional()
  @IsString()
  roleFilter?: string;

  @IsOptional()
  @IsString()
  deptFilter?: string;
}

// Password reset request body
export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

// Toggle status request body
export class ToggleStatusDto {
  @IsString()
  @IsIn(['active', 'inactive', 'locked'])
  status!: 'active' | 'inactive' | 'locked';
}
