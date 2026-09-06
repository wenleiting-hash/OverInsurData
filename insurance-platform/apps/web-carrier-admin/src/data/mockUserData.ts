// 🔴 todo: replace with real API later
// 用户管理模块 mock 数据（原型 V1.3 用户管理模块还原）
// 规范：枚举 → 稳定英文 key（视图内用 t() 映射）；自由文本 → 平行 xxxEn 字段

export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending';
export type AuthMethod = 'local' | 'sso' | 'ldap';

/** 角色 key（permission 命名空间 userMgmt.roles.* 映射） */
export type RoleKey = 'superAdmin' | 'opsAdmin' | 'channelManager' | 'financeSpecialist' | 'readonly';

/** 部门 key（permission 命名空间 userMgmt.depts.* 映射） */
export type DeptKey = 'tech' | 'ops' | 'finance' | 'channel' | 'compliance' | 'marketing';

export const ROLE_KEYS: RoleKey[] = ['superAdmin', 'opsAdmin', 'channelManager', 'financeSpecialist', 'readonly'];
export const DEPT_KEYS: DeptKey[] = ['tech', 'ops', 'finance', 'channel', 'compliance', 'marketing'];
export const STATUS_KEYS: UserStatus[] = ['active', 'inactive', 'locked', 'pending'];

export interface UserAccount {
  id: string;
  /** 姓名（自由文本，中文正本） */
  name: string;
  /** 姓名平行英文 */
  nameEn: string;
  username: string;
  email: string;
  phone: string;
  dept: DeptKey;
  roles: RoleKey[];
  auth: AuthMethod;
  status: UserStatus;
  /** 最后登录时间；null 表示从未登录（显示 Never） */
  lastLogin: string | null;
  remark?: string;
  remarkEn?: string;
}

export const mockUsers: UserAccount[] = [
  {
    id: 'u1',
    name: '张国强',
    nameEn: 'Zhang Guoqiang',
    username: 'admin',
    email: 'zhang.guoqiang@insure-os.com',
    phone: '138-0000-0001',
    dept: 'tech',
    roles: ['superAdmin'],
    auth: 'local',
    status: 'active',
    lastLogin: '2025-09-05 09:32',
  },
  {
    id: 'u2',
    name: '李晓燕',
    nameEn: 'Li Xiaoyan',
    username: 'li.xiaoyan',
    email: 'li.xiaoyan@insure-os.com',
    phone: '138-0000-0002',
    dept: 'ops',
    roles: ['opsAdmin'],
    auth: 'local',
    status: 'active',
    lastLogin: '2025-09-04 16:11',
  },
  {
    id: 'u3',
    name: 'Michael Chen',
    nameEn: 'Michael Chen',
    username: 'm.chen',
    email: 'm.chen@pacific-partner.com',
    phone: '+1-415-000-0003',
    dept: 'channel',
    roles: ['channelManager'],
    auth: 'sso',
    status: 'active',
    lastLogin: '2025-09-05 08:04',
  },
  {
    id: 'u4',
    name: '王丽华',
    nameEn: 'Wang Lihua',
    username: 'wang.lihua',
    email: 'wang.lihua@insure-os.com',
    phone: '138-0000-0004',
    dept: 'finance',
    roles: ['financeSpecialist'],
    auth: 'local',
    status: 'active',
    lastLogin: '2025-09-03 14:55',
  },
  {
    id: 'u5',
    name: 'Sarah Thompson',
    nameEn: 'Sarah Thompson',
    username: 's.thompson',
    email: 's.thompson@broker.us',
    phone: '+1-212-000-0005',
    dept: 'channel',
    roles: ['channelManager', 'readonly'],
    auth: 'sso',
    status: 'inactive',
    lastLogin: '2025-08-20 10:22',
  },
  {
    id: 'u6',
    name: '陈志远',
    nameEn: 'Chen Zhiyuan',
    username: 'chen.zhiyuan',
    email: 'chen.zhiyuan@insure-os.com',
    phone: '138-0000-0006',
    dept: 'tech',
    roles: ['opsAdmin', 'channelManager'],
    auth: 'local',
    status: 'locked',
    lastLogin: '2025-08-01 11:30',
  },
  {
    id: 'u7',
    name: '刘思远',
    nameEn: 'Liu Siyuan',
    username: 'liu.siyuan',
    email: 'liu.siyuan@insure-os.com',
    phone: '138-0000-0007',
    dept: 'ops',
    roles: ['readonly'],
    auth: 'local',
    status: 'pending',
    lastLogin: null,
  },
  {
    id: 'u8',
    name: 'James Wong',
    nameEn: 'James Wong',
    username: 'j.wong',
    email: 'j.wong@agency.hk',
    phone: '+852-0000-0008',
    dept: 'channel',
    roles: ['channelManager'],
    auth: 'ldap',
    status: 'active',
    lastLogin: '2025-09-05 07:48',
  },
];

/** 深拷贝工具（会话内可变数据源用） */
export function cloneUsers(): UserAccount[] {
  return mockUsers.map(u => ({ ...u, roles: [...u.roles] }));
}
