import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function UserListView({ navigateTo }: Props) {
  const { t } = useTranslation('permission');

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-center">
      <div className="glass rounded-lg p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('comingSoon')}</h2>
        <p className="text-gray-600 mb-6">{t('userListDescription') || '用户列表页面开发中'}</p>
        <button 
          className="btn-primary"
          onClick={() => navigateTo('dashboard')}
        >
          {t('backToDashboard')}
        </button>
      </div>
    </div>
  );
}
