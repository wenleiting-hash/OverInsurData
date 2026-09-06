import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import type { ViewId } from '@/App';

export type Role = {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  description?: string;
  descriptionEn?: string;
  permissions: Record<string, boolean>; // 🔴 todo: complex permission structure later
  createdAt: string;
};

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data (临时数据源)
const mockRoles: Role[] = [
  {
    id: 'r1',
    name: '超级管理员',
    nameEn: 'Super Admin',
    code: 'super_admin',
    description: '拥有所有权限',
    descriptionEn: 'Has all permissions',
    permissions: { all: true },
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'r2',
    name: '普通管理员',
    nameEn: 'General Admin',
    code: 'admin',
    description: '常规管理权限',
    descriptionEn: 'Standard management permissions',
    permissions: { users: false, roles: false }, // 🔴 todo: complex permission structure later
    createdAt: '2026-01-02T00:00:00Z'
  },
  {
    id: 'r3',
    name: '只读用户',
    nameEn: 'Read-only User',
    code: 'viewer',
    description: '仅查看权限',
    descriptionEn: 'View-only permissions',
    permissions: { all: false },
    createdAt: '2026-01-03T00:00:00Z'
  },
];

export default function RoleListView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const [searchTerm, setSearchTerm] = useState('');
  const isEn = i18n.language?.startsWith?.('en') ?? false;

  const filteredRoles = mockRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.nameEn ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const roleName = (role: Role) => (isEn ? role.nameEn ?? role.name : role.name);
  const roleDesc = (role: Role) => (isEn ? role.descriptionEn ?? role.description : role.description);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('roleList')}</h2>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => navigateTo('role-create')}
        >
          <Plus size={16} />
          {t('createRole')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('searchRolePlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('roleName')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('roleCode')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('description')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('createTime')}</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRoles.map(role => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{roleName(role)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {role.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {roleDesc(role) || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(role.createdAt).toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => navigateTo('role-edit')}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => alert(`Delete role: ${roleName(role)}`)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
