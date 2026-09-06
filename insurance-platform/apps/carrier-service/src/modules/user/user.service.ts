/**
 * User Service - Business Logic for User Management (Simplified Version)
 * Uses mock data as fallback until backend API is ready
 */

import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, GetUserListParams } from './dtos/user.dto';

// TODO: Replace with real database query when UserService is properly configured
const MOCK_USERS = [
  {
    id: 'usr_1',
    username: 'admin',
    name: 'System Admin',
    email: 'admin@example.com',
    phone: '555-0100',
    status: 'active',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_2',
    username: 'operator',
    name: 'Operations Manager',
    email: 'ops@example.com',
    phone: '555-0101',
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class UserService {
  
  // ✅ Removed constructor dependency on database instance
  // For now, using mock data. Will add Drizzle/Prisma integration later.

  async getUserList(params: GetUserListParams) {
    const { page = 1, pageSize = 20 } = params;
    
    return {
      data: MOCK_USERS,
      total: MOCK_USERS.length,
      page,
      pageSize,
    };
  }

  async getUserById(id: string) {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const newUser = {
      id: `usr_${Date.now()}`,
      username: dto.username,
      name: dto.name,
      email: dto.email,
      phone: dto.phone || 'N/A',
      status: 'active' as any,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    return newUser;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }
    MOCK_USERS[index] = { ...MOCK_USERS[index], ...dto };
    return MOCK_USERS[index];
  }

  async deleteUser(id: string) {
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }
    MOCK_USERS.splice(index, 1);
  }

  async resetPassword(userId: string, newPassword: string) {
    // TODO: Implement password reset logic
  }
}
