import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Lock, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  userId: string;
  navigateTo: (view: ViewId) => void;
}

// Mock data (临时数据源)
interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  roleId: string;
  status: 'enabled' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

const mockUsers: User[] = [
  { 
    id: 'u1', 
    username: 'admin', 
    email: 'admin@example.com',
    phoneNumber: '+86 138****1234',
    roleId: 'r1',
    status: 'enabled',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-30T14:30:00Z'
  },
  { 
    id: 'u2', 
    username: 'manager', 
    email: 'manager@example.com',
    phoneNumber: '+86 139****5678',
    roleId: 'r2',
    status: 'enabled',
    createdAt: '2026-01-05T00:00:00Z',
    lastLoginAt: '2026-08-29T10:20:00Z'
  },
];

export default function UserEditView({ userId, navigateTo }: Props) {
  const { t } = useTranslation('permission');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    roleId: '',
    status: 'enabled',
    mfaEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  // 模拟加载用户数据
  useEffect(() => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        roleId: user.roleId,
        status: user.status,
        mfaEnabled: true, // 示例：假设有 MFA
      });
    }
    setLoading(false);
  }, [userId]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔴 todo: 调用真实 API 更新用户
    console.log('更新用户数据:', { id: userId, ...formData });
    
    alert(t('updateSuccess') || '用户信息更新成功！');
    navigateTo('user-list');
  };

  const handleResetPassword = () => {
    if (confirm(t('confirmResetPassword') || '确定要重置此用户的密码吗？用户将收到邮件通知。')) {
      // 🔴 todo: 调用真实 API 重置密码
      console.log('重置密码:', userId);
      
      alert(t('passwordResetSuccess') || '密码重置邮件已发送！');
    }
  };

  const handleDelete = () => {
    if (confirm(t('confirmDeleteUser') || '确定要删除此用户吗？此操作不可恢复。')) {
      // 🔴 todo: 调用真实 API 删除用户
      console.log('删除用户:', userId);
      
      alert(t('deleteSuccess') || '用户已删除！');
      navigateTo('user-list');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('editUser')}</h2>
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => navigateTo('user-list')}
            >
              {t('cancel')}
            </button>
          </div>

          {/* 用户基本信息卡片 */}
          <div className="glass rounded-lg p-4 mb-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                {formData.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{formData.username}</h3>
                <p className="text-sm text-gray-600">{formData.email}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                formData.status === 'enabled' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {formData.status === 'enabled' ? t('enabled') : t('disabled')}
              </div>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* 用户名（只读） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('userName')} *
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">{t('usernameReadOnlyHint')}</p>
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
                placeholder={t('enterEmailPlaceholder') || 'example@email.com'}
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
                placeholder={t('enterPhoneNumberPlaceholder') || '+86 138****1234'}
              />
            </div>

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
                <option value="r1">超级管理员</option>
                <option value="r2">普通管理员</option>
                <option value="r3">只读用户</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('changeRoleWarning')}</p>
            </div>

            {/* 账号状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'enabled' | 'disabled' })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="enabled">{t('enabled')}</option>
                <option value="disabled">{t('disabled')}</option>
              </select>
            </div>

            {/* MFA 状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('mfaStatus')}
              </label>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  formData.mfaEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                    formData.mfaEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
                <span className="text-sm text-gray-700">
                  {formData.mfaEnabled ? t('mfaEnabled') : t('mfaDisabled')}
                </span>
              </div>
            </div>

            {/* 账户信息展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createTime')}
                </label>
                <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                  {new Date().toLocaleDateString('zh-CN')}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('lastLoginTime')}
                </label>
                <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                  2026/08/30 14:30:00
                </div>
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
                onClick={() => navigateTo('user-list')}
                className="btn-secondary w-full md:w-auto"
              >
                {t('cancel')}
              </button>

              {/* 密码管理区 */}
              <div className="pt-4 border-t border-yellow-200">
                <p className="text-sm font-medium text-yellow-700 mb-3">{t('passwordManagement')}</p>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <RefreshCw size={16} />
                  {t('resetPassword')}
                </button>
                <p className="text-xs text-yellow-600 mt-1">{t('resetPasswordHint')}</p>
              </div>

              {/* 删除按钮 - 红色警示 */}
              <div className="flex items-center justify-between pt-4 border-t border-red-200">
                <div>
                  <p className="text-sm font-medium text-red-700">{t('dangerZone')}</p>
                  <p className="text-xs text-red-600 mt-1">{t('deleteUserWarning')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  {t('deleteUser')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
