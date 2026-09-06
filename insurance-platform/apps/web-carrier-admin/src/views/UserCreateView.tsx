import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function UserCreateView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    roleId: '',
    status: 'enabled',
    requirePasswordChange: false,
    mfaEnabled: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 基础验证
    if (!formData.username.trim()) {
      alert(t('pleaseEnterUserName'));
      return;
    }

    if (!formData.password) {
      alert(t('pleaseEnterPassword'));
      return;
    }

    if (formData.password.length < 8) {
      alert(t('passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }

    if (!formData.email) {
      alert(t('pleaseEnterEmail'));
      return;
    }

    if (!formData.roleId) {
      alert(t('selectRole'));
      return;
    }

    // 🔴 todo: 调用真实 API 创建用户
    console.log('Create user data:', formData);

    alert(t('createSuccess'));
    navigateTo('user-list');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('createUser')}</h2>
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => navigateTo('user-list')}
            >
              {t('cancel')}
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{t('basicInfo')}</h3>
            
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('userName')} *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={t('enterUsernamePlaceholder')}
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')} *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={t('enterPasswordPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('passwordRequirement')}</p>
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword')} *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('email')} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="example@email.com"
              />
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumber')}
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="+86 138****1234"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-4">{t('roleAndPermission')}</h3>

            {/* 关联角色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('role')} *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="">{t('selectRolePlaceholder')}</option>
                <option value="r1">{t('roleSuperAdmin')}</option>
                <option value="r2">{t('roleGeneralAdmin')}</option>
                <option value="r3">{t('roleReadonlyUser')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('selectRoleHint')}</p>
            </div>

            {/* MFA 绑定 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mfa"
                checked={formData.mfaEnabled}
                onChange={(e) => setFormData({ ...formData, mfaEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="mfa" className="text-sm text-gray-700">
                {t('enableMFA')}
              </label>
            </div>

            {/* 首次登录强制改密 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="changePassword"
                checked={formData.requirePasswordChange}
                onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="changePassword" className="text-sm text-gray-700">
                {t('requirePasswordChange')}
              </label>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-4">{t('accountStatus')}</h3>

            {/* 账号状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="enabled">{t('enabled')}</option>
                <option value="disabled">{t('disabled')}</option>
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {t('createUserBtn')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('user-list')}
                className="btn-secondary flex-1"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
