import { useTranslation } from 'react-i18next';
import { Plus, Search, Download, RotateCcw } from 'lucide-react';
import type { ViewId } from '@/App';
// ✅ Use real API hooks
import { 
  useGetUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser 
} from '@/services/userService';
import { userApi, type UserAccount } from '@/lib/user-api-client';

interface Props {
  navigateTo: (view: ViewId) => void;
}

type UserStatus = 'active' | 'inactive' | 'locked' | 'pending';
type RoleKey = string;
type DeptKey = string;
type AuthMethod = 'local' | 'sso' | 'ldap';

const STATUS_STYLE: Record<UserStatus, { badge: string; icon: string }> = {
  active: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '' },
  inactive: { badge: 'bg-gray-100 text-gray-600 border-gray-200', icon: '' },
  locked: { badge: 'bg-red-50 text-red-700 border-red-200', icon: '' },
  pending: { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: '' },
};

export default function UserListViewReal({ navigateTo }: Props) {
  const { t } = useTranslation('permission');

  // ✅ Real API data fetching
  const { data: usersData, isLoading, refetch } = useGetUsers();
  const users = usersData?.data || [];
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleCreate = () => {
    // TODO: Open modal for creating new user
    navigateTo('user-new');
  };

  const handleEdit = (user: UserAccount) => {
    // TODO: Open edit modal with user data
    navigateTo('user-edit', { userId: user.id });
  };

  const handleDelete = async (userId: string) => {
    if (confirm(t('common.confirm.delete'))) {
      await deleteUserMutation.mutateAsync(userId);
      showToast(t('userMgmt.toast.deleted'));
    }
  };

  const showToast = (message: string) => {
    console.log(message); // TODO: Replace with toast component
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('userMgmt.title')}</h2>
      
      {/* Toolbar */}
      <div className="card p-4 flex gap-3">
        <input
          type="text"
          placeholder={t('userMgmt.search.placeholder')}
          className="input"
          onChange={(e) => console.log(e.target.value)}
        />
        <button onClick={() => showToast(t('common.action.search'))}>
          <Search size={18} />
        </button>
        <span className="flex-1" />
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={18} /> {t('userMgmt.action.add')}
        </button>
        <button className="btn btn-secondary">
          <Download size={18} /> {t('userMgmt.action.export')}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"></div>
        </div>
      )}

      {/* User List Table */}
      {!isLoading && (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">{t('userMgmt.table.username')}</th>
              <th className="text-left py-2">{t('userMgmt.table.name')}</th>
              <th className="text-left py-2">{t('userMgmt.table.email')}</th>
              <th className="text-left py-2">{t('userMgmt.table.dept')}</th>
              <th className="text-left py-2">{t('userMgmt.table.status')}</th>
              <th className="text-right py-2">{t('userMgmt.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td>{user.username}</td>
                <td>{user.name} {user.nameEn ? `(${user.nameEn})` : ''}</td>
                <td>{user.email}</td>
                <td>{user.dept}</td>
                <td>
                  <span className={`badge ${STATUS_STYLE[user.status].badge}`}>
                    {t(`userMgmt.status.${user.status}`)}
                  </span>
                </td>
                <td className="text-right space-x-2">
                  <button 
                    className="btn btn-sm btn-icon" 
                    onClick={() => handleEdit(user)}
                  >
                    {t('common.action.edit')}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger btn-icon"
                    onClick={() => handleDelete(user.id)}
                  >
                    {t('common.action.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('userMgmt.empty')}</p>
        </div>
      )}
    </div>
  );
}
