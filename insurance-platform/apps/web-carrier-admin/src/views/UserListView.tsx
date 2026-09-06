import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, RotateCcw, Download, Plus, X, MoreHorizontal, Eye, EyeOff,
  Shield, ShieldCheck, UserCheck, Lock, Clock3, UserX,
  Pencil, KeyRound, Trash2, AlertTriangle, Users as UsersIcon, Save,
  Mail, Phone,
} from 'lucide-react';
import type { ViewId } from '@/App';
// ✅ Use real API hooks
import { 
  useGetUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useResetPassword 
} from '@/services/userService';
import { userApi, type UserAccount } from '@/lib/user-api-client';

interface Props {
  navigateTo: (view: ViewId) => void;
}

type ModalKind = 'none' | 'create' | 'edit' | 'reset' | 'delete';
type UserStatus = 'active' | 'inactive' | 'locked' | 'pending';
type RoleKey = string;
type DeptKey = string;
type AuthMethod = 'local' | 'sso' | 'ldap';

/** 状态徽章样式（对齐 Figma:Active 绿色 #18904C / Inactive 灰色 #999/Locked 橙色 #FA8C16/Pending 黄色 #F7A600） */
const STATUS_STYLE: Record<UserStatus, { badge: string; icon: typeof UserCheck }> = {
  active: { badge: 'bg-[#E6F7EE] text-[#18904C] border-[#18904C]', icon: UserCheck },
  inactive: { badge: 'bg-gray-50 text-[#999] border-[#999]', icon: UserX },
  locked: { badge: 'bg-[#FFF7E6] text-[#FA8C16] border-[#FA8C16]', icon: Lock },
  pending: { badge: 'bg-[#FFFBE6] text-[#F7A600] border-[#F7A600]', icon: Clock3 },
};

const AVATAR_BG = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
];

export default function UserListView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const isEn = i18n.language?.startsWith?.('en') ?? false;

  // ✅ Use real API hook instead of mock data
  const { data: usersData, isLoading, error, refetch } = useGetUsers();
  const users = usersData?.data || [];
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | RoleKey>('all');

  const [modal, setModal] = useState<ModalKind>('none');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '',
    authMethod: 'local' as AuthMethod,
    password: '', roles: [] as RoleKey[], status: 'active' as UserStatus,
    remark: '',
  });
  const [resetPwd, setResetPwd] = useState({ next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ create: false, resetNext: false, resetConfirm: false });

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuId) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuId]);

  const showToast = (key: string) => {
    setToast(t(key));
    window.setTimeout(() => setToast(null), 2600);
  };

  const target = users.find(u => u.id === targetId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const names = [u.name, u.nameEn, u.username].join(' ').toLowerCase();
      const matchQ = !q || names.includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.toLowerCase().includes(q));
      const matchS = statusFilter === 'all' || u.status === statusFilter;
      const matchR = roleFilter === 'all' || u.roles.includes(roleFilter);
      return matchQ && matchS && matchR;
    });
  }, [users, search, statusFilter, roleFilter]);

  const isFiltered = Boolean(search) || statusFilter !== 'all' || roleFilter !== 'all';
  const stats = useMemo(() => {
    const s = { total: users.length, active: 0, inactive: 0, locked: 0, pending: 0 };
    for (const u of users) s[u.status] += 1;
    return s;
  }, [users]);

  const userName = (u: UserAccount) => (isEn ? u.nameEn || u.name : u.name);
  const roleName = (r: RoleKey) => t(`userMgmt.roles.${r}`);
  const deptName = (d: DeptKey) => t(`userMgmt.depts.${d}`);
  const statusName = (s: UserStatus) => t(`userMgmt.status.${s}`);

  const openCreate = () => {
    setForm({ name: '', username: '', email: '', phone: '', authMethod: 'local', password: '', roles: [], status: 'active', remark: '' });
    setModal('create');
  };

  const openEdit = (u: UserAccount) => {
    setForm({
      name: isEn ? u.nameEn || u.name : u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      authMethod: u.authMethod,
      password: '',
      roles: [...u.roles],
      status: u.status,
      remark: (isEn ? u.remarkEn || u.remark : u.remark) ?? '',
    });
    setModal('edit');
  };

  const openReset = (u: UserAccount) => {
    setResetPwd({ next: '', confirm: '' });
    setTargetId(u.id);
    setModal('reset');
  };

  const toggleRole = (r: RoleKey) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r],
    }));
  };

  // ✅ Replace mock handlers with real API mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const resetPasswordMutation = useResetPassword();

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.email || !form.password || form.roles.length === 0) return;
    
    try {
      await createUserMutation.mutateAsync({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        phone: form.phone,
        roles: form.roles,
      } as any);
      setModal('none');
      showToast('userMgmt.toast.created');
      refetch();
    } catch (err) {
      console.error('Failed to create user:', err);
      showToast('userMgmt.error.createFailed');
    }
  };

  const handleSave = async () => {
    if (!target || !form.name || !form.email || form.roles.length === 0) return;
    
    try {
      await updateUserMutation.mutateAsync({
        id: target.id,
        dto: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          roleKeys: form.roles,
          status: form.status,
          remark: form.remark,
        } as any,
      });
      setModal('none');
      showToast('userMgmt.toast.updated');
      refetch();
    } catch (err) {
      console.error('Failed to update user:', err);
      showToast('userMgmt.error.updateFailed');
    }
  };

  const handleResetPassword = async () => {
    if (!target || resetPwd.next.length < 8 || resetPwd.next !== resetPwd.confirm) return;
    
    try {
      await resetPasswordMutation.mutateAsync({
        id: target.id,
        newPassword: resetPwd.next,
      });
      setModal('none');
      showToast('userMgmt.toast.passwordReset');
    } catch (err) {
      console.error('Failed to reset password:', err);
      showToast('userMgmt.error.passwordResetFailed');
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    
    try {
      await deleteUserMutation.mutateAsync(target.id);
      setModal('none');
      showToast('userMgmt.toast.deleted');
      refetch();
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast('userMgmt.error.deleteFailed');
    }
  };

  const toggleStatus = async (u: UserAccount) => {
    const next: UserStatus = u.status === 'active' ? 'inactive' : 'active';
    
    try {
      await updateUserMutation.mutateAsync({
        id: u.id,
        dto: { status: next } as any,
      });
      setMenuId(null);
      showToast(next === 'active' ? 'userMgmt.toast.enabled' : 'userMgmt.toast.disabled');
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast('userMgmt.error.toggleStatusFailed');
    }
  };

  const handleExport = () => {
    showToast('userMgmt.toast.exported');
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    // Department filter removed
  };

  const resetDisabled = !search && statusFilter === 'all' && roleFilter === 'all';

  const canCreate = form.name && form.username && form.email && form.password.length >= 8 && form.roles.length > 0;
  const canSave = form.name && form.email && form.roles.length > 0;
  const canConfirmReset = resetPwd.next.length >= 8 && resetPwd.next === resetPwd.confirm;

  const renderStatusBadge = (s: UserStatus) => {
    // Handle unknown or invalid status safely
    const style = STATUS_STYLE[s] || STATUS_STYLE['active']; // fallback to active if unknown
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${style.badge}`} style={{ fontSize: 11 }}>
        <Icon size={14} />
        {statusName(s)}
      </span>
    );
  };

  const renderAuthBadge = (a: AuthMethod) => (
    <span className={`inline-block px-2 py-0.5 rounded-md font-medium border whitespace-nowrap ${a === 'local'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : a === 'sso'
      ? 'bg-purple-50 text-purple-700 border-purple-200'  // Purple for SSO
      : a === 'ldap'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'  // Green for LDAP
      : 'bg-gray-50 text-gray-600 border-gray-200'}`}
      style={{ fontSize: 11 }}
    >
      {t(`userMgmt.auth.${a}`)}
    </span>
  );

  const ROLE_KEYS = ['superAdmin', 'opsAdmin', 'carrierAdmin', 'agent'];

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  function Field({ label, required, children, className = '' }: {
    label: string; required?: boolean; children: React.ReactNode; className?: string;
  }) {
    return (
      <div className={className}>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
      </div>
    );
  }

  function ModalShell({ title, description, onClose, children }: {
    title: string; description: string; onClose: () => void; children: React.ReactNode;
  }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto" onMouseDown={onClose}>
        <div
          className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            </div>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  }

  function ModalFooter({ onCancel, onPrimary, primaryLabel, primaryDisabled, primaryIcon, cancelLabel }: {
    onCancel: () => void; onPrimary: () => void; primaryLabel: string; primaryDisabled?: boolean; primaryIcon?: React.ReactNode; cancelLabel: string;
  }) {
    return (
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={primaryDisabled}
          onClick={onPrimary}
        >
          {primaryIcon}
          {primaryLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* ===== 页头 ===== */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 22px', marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#181C23', marginBottom: 4, letterSpacing: '-0.3px' }}>{t('userMgmt.title')}</h1>
            <p style={{ fontSize: 14, color: '#666' }}>{t('userMgmt.description')}</p>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={handleExport}>
              <Download size={18} />
              {t('userMgmt.export')}
            </button>
            <button className="btn-primary" onClick={openCreate} disabled={isLoading}>
              <Plus size={18} />
              {t('userMgmt.newUser')}
            </button>
          </div>
        </div>
      </div>

      {/* ===== KPI 统计卡 ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563EB', lineHeight: 1.1, marginBottom: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: 0.3 }}>{t('userMgmt.stats.total')}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', lineHeight: 1.1, marginBottom: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: 0.3 }}>{t('userMgmt.stats.active')}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', lineHeight: 1.1, marginBottom: 4 }}>{stats.inactive}</div>
          <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: 0.3 }}>{t('userMgmt.stats.inactive')}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', lineHeight: 1.1, marginBottom: 4 }}>{stats.locked}</div>
          <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: 0.3 }}>{t('userMgmt.stats.locked')}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', lineHeight: 1.1, marginBottom: 4 }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: 0.3 }}>{t('userMgmt.stats.pending')}</div>
        </div>
      </div>

      {/* ===== 筛选区 ===== */}
      <div className="flex items-center justify-between" style={{ background: '#fff', borderRadius: '16px', padding: '12px 16px', marginTop: '4px' }}>
        {/* 左侧：全局搜索框 */}
        <div className="relative" style={{ flex: '0 1 280px', minWidth: 0, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            type="text"
            placeholder={t('userMgmt.filters.search')}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* 右侧：过滤器和重置按钮 */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | UserStatus)}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: 13.5 }}
          >
            <option value="all">{t('userMgmt.filters.allStatus')}</option>
            <option value="active">{statusName('active')}</option>
            <option value="inactive">{statusName('inactive')}</option>
            <option value="locked">{statusName('locked')}</option>
            <option value="pending">{statusName('pending')}</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as 'all' | RoleKey)}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: 13.5 }}
          >
            <option value="all">{t('userMgmt.filters.allRoles')}</option>
            {ROLE_KEYS.map(r => <option key={r} value={r}>{roleName(r)}</option>)}
          </select>
          <button
            disabled={resetDisabled}
            onClick={resetFilters}
            className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg"
            style={{ padding: '7px 12px', fontSize: 13 }}
          >
            <RotateCcw size={14} />
            {t('userMgmt.filters.reset')}
          </button>
        </div>
      </div>

      {/* ===== 用户表格 ===== */}
      <div className="glass rounded-xl overflow-hidden mb-4" style={{ background: '#F9FAFB' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed">
            <thead style={{ background: 'rgba(236,237,249,0.5)', borderBottom: '1px solid #C1C6D7' }}>
              <tr>
                <th className="px-3 py-2.5 text-left tracking-wide min-w-[160px] border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.user')}</th>
                <th className="px-3 py-2.5 text-left tracking-wide min-w-[220px] border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.emailPhone')}</th>
                <th className="px-3 py-2.5 text-left tracking-wide min-w-[160px] border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.deptRoles')}</th>
                <th className="px-3 py-2.5 text-left tracking-wide whitespace-nowrap border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.auth')}</th>
                <th className="px-3 py-2.5 text-left tracking-wide whitespace-nowrap border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.status')}</th>
                <th className="px-3 py-2.5 text-left tracking-wide whitespace-nowrap border-r border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}>{t('userMgmt.table.lastLogin')}</th>
                <th className="px-3 py-2.5 text-right tracking-wide whitespace-nowrap sticky-right" style={{ fontSize: 12, fontWeight: 600, color: '#414755' }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ background: '#FFFFFF' }}>
              {filtered.map((u, idx) => (
                <tr key={u.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="sticky-first px-3 py-3 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${AVATAR_BG[idx % AVATAR_BG.length]}`}>
                        {(isEn ? u.nameEn || u.name : u.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{userName(u)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: '2px' }}>{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-[220px] border-r border-gray-200">
                    <div style={{ fontSize: 12.5, color: '#374151' }}>
                      <Mail className="text-gray-400" size={14} />
                      <span className="truncate max-w-[200px] leading-tight">{u.email}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: '6px' }}>
                      ✆ {u.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-[160px] border-r border-gray-200">
                    {/* Roles only (no department filter support yet) */}
                    <div style={{ fontSize: 12.5, color: '#374151', marginBottom: '6px' }}>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Department placeholder line - will be gray dashed when backend supports it */}
                        <div style={{ fontSize: 10, color: '#D1D5DB' }}>-</div>
                        {u.roles.length > 0 ? u.roles.map((r: RoleKey) => {
                          // Color coding per role
                          const roleColors: Record<string, string> = {
                            superAdmin: 'bg-violet-50 text-violet-700 border-violet-200',      // Purple
                            opsAdmin: 'bg-blue-50 text-blue-700 border-blue-200',              // Blue
                            carrierAdmin: 'bg-emerald-50 text-emerald-700 border-emerald-200', // Green
                            finance: 'bg-amber-50 text-amber-700 border-amber-200',            // Orange
                            read: 'bg-gray-100 text-gray-600 border-gray-200',                 // Gray
                          };
                          return (
                            <span key={r} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${roleColors[r] || 'bg-blue-50 text-blue-700 border-blue-200'}`} style={{ fontSize: 10 }}>
                              <Shield size={10} />
                              {roleName(r)}
                            </span>
                          );
                        }) : (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>No roles assigned</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200" style={{ color: '#414755' }}>{renderAuthBadge(u.authMethod)}</td>
                  <td className="px-3 py-3 border-r border-gray-200" style={{ color: '#414755' }}>{renderStatusBadge(u.status)}</td>
                  <td className="px-3 py-3 border-r border-gray-200" style={{ fontSize: 13, color: '#414755', whiteSpace: 'nowrap' }}>
                    {u.lastLoginAt ? (
                      <div>
                        <div style={{ fontSize: 13 }}>{new Date(u.lastLoginAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(u.lastLoginAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                      </div>
                    ) : t('userMgmt.table.never')}
                  </td>
                  <td className="px-3 py-2 text-right relative whitespace-nowrap sticky-right">
                    <button
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuId === u.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-5 top-12 z-20 w-44 rounded-xl bg-white/95 backdrop-blur shadow-lg border border-gray-100 py-1.5 text-left"
                      >
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => { setMenuId(null); openEdit(u); }}
                        >
                          <Pencil size={14} />
                          {t('userMgmt.menu.editUser')}
                        </button>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => { setMenuId(null); openReset(u); }}
                        >
                          <KeyRound size={14} />
                          {t('userMgmt.menu.resetPassword')}
                        </button>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          {t(u.status === 'active' ? 'userMgmt.menu.disableAccount' : 'userMgmt.menu.enableAccount')}
                        </button>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => { setMenuId(null); setTargetId(u.id); setModal('delete'); }}
                        >
                          <Trash2 size={14} />
                          {t('userMgmt.menu.deleteUser')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">
                    {t('userMgmt.table.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* 页脚 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {isFiltered
              ? t('userMgmt.footer.filteredFrom', { n: filtered.length, total: users.length })
              : t('userMgmt.footer.userCount', { n: users.length })}
          </span>
          <button
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            onClick={() => navigateTo('permission-management')}
          >
            <ShieldCheck size={15} />
            {t('userMgmt.footer.manageRoles')}
          </button>
        </div>
      </div>

      {/* ===== New User Modal ===== */}
      {modal === 'create' && (
        <ModalShell title={t('userMgmt.createModal.title')} description={t('userMgmt.createModal.description')} onClose={() => setModal('none')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('userMgmt.field.fullName')} required>
              <input className={inputCls} placeholder={t('userMgmt.ph.fullName')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.username')} required>
              <input className={inputCls} placeholder={t('userMgmt.ph.username')} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.email')} required>
              <input className={inputCls} placeholder={t('userMgmt.ph.email')} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.phone')}>
              <input className={inputCls} placeholder={t('userMgmt.ph.phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.authMethod')}>
              <select className={inputCls} value={form.authMethod} onChange={e => setForm(f => ({ ...f, authMethod: e.target.value as AuthMethod }))}>
                {(['local', 'sso', 'ldap'] as AuthMethod[]).map(a => (
                  <option key={a} value={a}>{a === 'sso' ? t('userMgmt.auth.ssoFull') : t(`userMgmt.auth.${a}`)}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t('userMgmt.field.initialPassword')} required className="mt-4">
            <div className="relative">
              <input type={showPwd.create ? 'text' : 'password'} className={`${inputCls} pr-10`} placeholder={t('userMgmt.ph.initialPassword')} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(s => ({ ...s, create: !s.create }))}>
                {showPwd.create ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </Field>
          <Field label={t('userMgmt.field.roleAssignment')} required className="mt-4">
            <div className="flex flex-wrap gap-2">
              {ROLE_KEYS.map(r => {
                const on = form.roles.includes(r);
                return (
                  <button key={r} type="button" onClick={() => toggleRole(r)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-colors ${on ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <Shield size={13} />
                    {roleName(r)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={t('userMgmt.field.remarks')} className="mt-4">
            <textarea className={`${inputCls} h-20 resize-none`} placeholder={t('userMgmt.ph.remarks')} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </Field>
          <ModalFooter
            onCancel={() => setModal('none')}
            primaryLabel={t('userMgmt.createModal.create')}
            primaryDisabled={!canCreate}
            onPrimary={handleCreate}
            cancelLabel={t('userMgmt.deleteModal.cancel')}
          />
        </ModalShell>
      )}

      {/* ===== Edit User Modal ===== */}
      {modal === 'edit' && target && (
        <ModalShell title={t('userMgmt.editModal.title')} description={t('userMgmt.editModal.description', { name: userName(target) })} onClose={() => setModal('none')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('userMgmt.field.fullName')} required>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.username')} required>
              <input className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`} value={form.username} disabled readOnly />
            </Field>
            <Field label={t('userMgmt.field.email')} required>
              <input className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.phone')}>
              <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label={t('userMgmt.field.authMethod')}>
              <select className={inputCls} value={form.authMethod} onChange={e => setForm(f => ({ ...f, authMethod: e.target.value as AuthMethod }))}>
                {(['local', 'sso', 'ldap'] as AuthMethod[]).map(a => (
                  <option key={a} value={a}>{a === 'sso' ? t('userMgmt.auth.ssoFull') : t(`userMgmt.auth.${a}`)}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t('userMgmt.field.roleAssignment')} required className="mt-4">
            <div className="flex flex-wrap gap-2">
              {ROLE_KEYS.map(r => {
                const on = form.roles.includes(r);
                return (
                  <button key={r} type="button" onClick={() => toggleRole(r)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-colors ${on ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <Shield size={13} />
                    {roleName(r)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={t('userMgmt.field.accountStatus')} className="mt-4">
            <div className="flex flex-wrap gap-2">
              {(['active', 'inactive', 'locked'] as UserStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${form.status === s ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {statusName(s)}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('userMgmt.field.remarks')} className="mt-4">
            <textarea className={`${inputCls} h-20 resize-none`} placeholder={t('userMgmt.ph.remarks')} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </Field>
          <ModalFooter
            onCancel={() => setModal('none')}
            primaryLabel={t('userMgmt.editModal.saveChanges')}
            primaryDisabled={!canSave}
            onPrimary={handleSave}
            primaryIcon={<Save size={15} />}
            cancelLabel={t('userMgmt.deleteModal.cancel')}
          />
        </ModalShell>
      )}

      {/* ===== Reset Password Modal ===== */}
      {modal === 'reset' && target && (
        <ModalShell title={t('userMgmt.resetModal.title')} description={`${userName(target)} · ${target.username}`} onClose={() => setModal('none')}>
          <Field label={t('userMgmt.resetModal.newPassword')} required>
            <div className="relative">
              <input type={showPwd.resetNext ? 'text' : 'password'} className={`${inputCls} pr-10`} placeholder={t('userMgmt.ph.initialPassword')} value={resetPwd.next} onChange={e => setResetPwd(p => ({ ...p, next: e.target.value }))} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(s => ({ ...s, resetNext: !s.resetNext }))}>
                {showPwd.resetNext ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </Field>
          <Field label={t('userMgmt.resetModal.confirmPassword')} required className="mt-4">
            <div className="relative">
              <input type={showPwd.resetConfirm ? 'text' : 'password'} className={`${inputCls} pr-10`} placeholder={t('userMgmt.ph.confirmPassword')} value={resetPwd.confirm} onChange={e => setResetPwd(p => ({ ...p, confirm: e.target.value }))} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(s => ({ ...s, resetConfirm: !s.resetConfirm }))}>
                {showPwd.resetConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </Field>
          {resetPwd.confirm.length > 0 && resetPwd.next !== resetPwd.confirm && (
            <p className="mt-2 text-xs text-red-600">{t('userMgmt.resetModal.mismatch')}</p>
          )}
          <ModalFooter
            onCancel={() => setModal('none')}
            primaryLabel={t('userMgmt.resetModal.confirmReset')}
            primaryDisabled={!canConfirmReset}
            onPrimary={handleResetPassword}
            cancelLabel={t('userMgmt.deleteModal.cancel')}
          />
        </ModalShell>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {modal === 'delete' && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onMouseDown={() => setModal('none')}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">{t('userMgmt.deleteModal.title')}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{t('userMgmt.deleteModal.message', { name: userName(target) })}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setModal('none')}>
                {t('userMgmt.deleteModal.cancel')}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm" onClick={handleDelete}>
                <Trash2 size={15} />
                {t('userMgmt.menu.deleteUser')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl bg-gray-900/90 text-white text-sm shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
