import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, Key, FileText, LogIn, Settings } from 'lucide-react';
import type { ViewId } from '@/App';

export type SubViewType = 
  | 'role'
  | 'user'
  | 'menu'
  | 'data'
  | 'op-log'
  | 'login-log';

interface Props {
  navigateTo: (view: ViewId) => void;
}

const subViewTabs: { id: SubViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'role', label: '角色管理', icon: <Users size={14} /> },
  { id: 'user', label: '用户管理', icon: <Key size={14} /> },
  { id: 'menu', label: '菜单权限', icon: <Shield size={14} /> },
  { id: 'data', label: '数据权限', icon: <Settings size={14} /> },
  { id: 'op-log', label: '操作日志', icon: <FileText size={14} /> },
  { id: 'login-log', label: '登录日志', icon: <LogIn size={14} /> },
];

export default function PermissionView({ navigateTo }: Props) {
  const { t } = useTranslation('permission');
  const [subViewType, setSubViewType] = useState<SubViewType>('role');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
      </div>

      {/* Tabs */}
      <div className="glass rounded-lg p-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {subViewTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubViewType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                subViewType === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Placeholder for sub-components */}
      <div className="glass rounded-lg p-8 text-center" style={{ minHeight: '400px' }}>
        <div className="text-gray-500">
          <h3 className="text-xl font-semibold mb-2">子视图加载中...</h3>
          <p>Sub-view: {subViewType}</p>
          <button 
            className="btn-primary mt-6"
            onClick={() => navigateTo('dashboard')}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
