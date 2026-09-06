import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Trash2 } from 'lucide-react';
import type { Role } from './RoleListView';

interface Props {
  roleId: string;
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
    permissions: { users: false, roles: false },
    createdAt: '2026-01-02T00:00:00Z'
  },
];

export default function RoleEditView({ roleId, navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);

  // 模拟加载角色数据
  useEffect(() => {
    const role = mockRoles.find(r => r.id === roleId);
    if (role) {
      setFormData({
        name: isEn ? (role.nameEn ?? role.name) : role.name,
        code: role.code,
        description: isEn ? (role.descriptionEn ?? role.description ?? '') : (role.description ?? ''),
      });
    }
    setLoading(false);
  }, [roleId, isEn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔴 todo: 调用真实 API 更新角色
    console.log('Update role data:', { id: roleId, ...formData });

    alert(t('updateSuccess'));
    navigateTo('role-list');
  };

  const handleDelete = () => {
    if (confirm(t('confirmDelete'))) {
      // 🔴 todo: 调用真实 API 删除角色
      console.log('Delete role:', roleId);

      alert(t('deleteSuccess'));
      navigateTo('role-list');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('editRole')}</h2>
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => navigateTo('role-list')}
            >
              {t('cancel')}
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 角色名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('roleName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={t('enterRoleNamePlaceholder')}
              />
            </div>

            {/* 角色编码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('roleCode')} *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled
                placeholder={t('enterRoleCodePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('codeReadOnlyHint')}</p>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                placeholder={t('enterDescriptionPlaceholder')}
              />
            </div>

            {/* 权限配置入口 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('permissions')}
              </label>
              <div className="glass rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">{t('permissionsDescription')}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => alert(t('comingSoonPermissionConfig'))}
                >
                  {t('configurePermissions')}
                </button>
              </div>
            </div>

            {/* 创建时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('createTime')}
              </label>
              <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                {new Date().toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}
              </div>
            </div>

            {/* 操作按钮区域 */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <button
                type="submit"
                className="btn-primary w-full md:w-auto"
              >
                {t('saveChanges')}
              </button>

              <button
                type="button"
                onClick={() => navigateTo('role-list')}
                className="btn-secondary w-full md:w-auto"
              >
                {t('cancel')}
              </button>

              {/* 删除按钮 - 红色警示 */}
              <div className="flex items-center justify-between pt-4 border-t border-red-200">
                <div>
                  <p className="text-sm font-medium text-red-700">{t('dangerZone')}</p>
                  <p className="text-xs text-red-600 mt-1">{t('deleteRoleWarning')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  {t('deleteRole')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
