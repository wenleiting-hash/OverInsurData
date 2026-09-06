/**
 * User Management DTOs
 */

// Create user request DTO
export class CreateUserDto {
  username!: string;
  password!: string;
  name!: string;
  email!: string;
  phone?: string;
  deptCode!: string;
  roleKeys!: string[];
  remark?: string;
}

// Update user request DTO (partial)
export class UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  deptCode?: string;
  roleKeys?: string[];
  status?: string;
  remark?: string;
}

// User list query params
export class GetUserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: string;
}
