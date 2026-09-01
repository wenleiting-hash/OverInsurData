import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function RoleCreateView({ navigateTo }: Props) {
  const { t } = useTranslation('permission');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基础验证
    if (!formData.name.trim()) {
      alert(t('pleaseEnter') || `请输入${t('roleName')}`);
      return;
    }
    
    if (!formData.code.trim()) {
      alert(t('pleaseEnter') || `请输入${t('roleCode')}`);
      return;
    }

    // 🔴 todo: 调用真实 API 创建角色
    console.log('创建角色数据:', formData);
    
    alert(t('createSuccess') || '角色创建成功！');
    navigateTo('role-list');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('createRole')}</h2>
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
                placeholder={t('enterRoleCodePlaceholder')}
              />
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
                  onClick={() => alert(t('comingSoonPermissionConfig') || '权限配置功能开发中')}
                >
                  {t('configurePermissions')}
                </button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {t('saveAndContinue')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('role-list')}
                className="btn-secondary flex-1"
              >
                {t('saveAndClose')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
