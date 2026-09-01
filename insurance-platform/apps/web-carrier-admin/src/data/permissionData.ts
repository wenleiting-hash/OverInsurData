// 🔴 todo: replace with real API later
// 🔴 todo: add TypeScript interfaces later

export const mockRoles: any[] = [
  { 
    id: 'r1', 
    name: '超级管理员', 
    code: 'super_admin', 
    description: '拥有所有权限',
    permissions: { all: true },
    createdAt: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'r2', 
    name: '普通管理员', 
    code: 'admin', 
    description: '常规管理权限',
    permissions: { users: false, roles: false },
    createdAt: '2026-01-02T00:00:00Z'
  },
];
