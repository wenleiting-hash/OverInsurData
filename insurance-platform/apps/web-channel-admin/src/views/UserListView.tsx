import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, RotateCcw, Download, Plus, X, MoreHorizontal, Eye, EyeOff,
  Shield, ShieldCheck, UserCheck, Lock, Clock3, UserX,
  Pencil, KeyRound, Trash2, AlertTriangle, Save,
  Mail, Phone, Building2,
} from 'lucide-react';
import type { ViewId } from '@/App';
import { useAuth } from '@/contexts/AuthContext';
// ✅ Use real API hooks
import { 
  useGetUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useResetPassword,
  useToggleStatus,
  useGetDepartments,
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

/** 状态徽章样式（对齐设计图：正常绿 / 停用灰 / 已锁定红 / 待激活橙） */
const STATUS_STYLE: Record<UserStatus, { badge: string; icon: typeof UserCheck }> = {
  active: { badge: 'bg-[#E6F7EE] text-[#18904C] border-[#B7E4C7]', icon: UserCheck },
  inactive: { badge: 'bg-[#F3F4F6] text-[#9CA3AF] border-[#E5E7EB]', icon: UserX },
  locked: { badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]', icon: Lock },
  pending: { badge: 'bg-[#FFF7ED] text-[#F97316] border-[#FED7AA]', icon: Clock3 },
};

/** 认证方式徽章样式（本地账号蓝 / SSO 紫 / LDAP 绿） */
const AUTH_STYLE: Record<AuthMethod, string> = {
  local: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  sso: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
  ldap: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
};

/** 角色胶囊样式（超级管理员紫 / 运营管理员蓝 / 渠道经理绿 / 财务专员琥珀 / 只读灰） */
const ROLE_STYLE: Record<string, string> = {
  super_admin: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
  ops_manager: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  channel_manager: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  finance_staff: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  readonly_user: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
};

/** 头像配色（对齐设计图：技术部绿色，其余橙色纯色圆） */
const avatarBg = (u: UserAccount) => (u.dept_code === 'TECH' ? '#0FA968' : '#F2994A');

/** 最近登录时间格式化为 设计图样式：2025-09-05 / 09:32 */
function formatLogin(iso?: string | null): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

/** 输入框样式（对齐 Figma 浅紫灰底色） */
const inputCls = 'w-full px-3.5 py-2.5 rounded-lg bg-[#F8F9FC] border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

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

export default function UserListView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | RoleKey>('all');
  const [deptFilter, setDeptFilter] = useState<'all' | DeptKey>('all');

  // ✅ Pass filter params to backend API for server-side filtering
  const apiParams = useMemo(() => ({
    page: 1,
    pageSize: 100,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter !== 'all' ? { statusFilter } : {}),
    ...(roleFilter !== 'all' ? { roleFilter } : {}),
    ...(deptFilter !== 'all' ? { deptFilter } : {}),
  }), [search, statusFilter, roleFilter, deptFilter]);

  const { data: usersData, isLoading, error, refetch } = useGetUsers(apiParams);
  const users = usersData?.data || [];

  const [modal, setModal] = useState<ModalKind>('none');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; openUp: boolean }>({ top: 0, right: 0, openUp: false });
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', deptCode: '',
    authMethod: 'local' as AuthMethod,
    password: '', roles: [] as RoleKey[], status: 'active' as UserStatus,
    remark: '',
  });
  const [resetPwd, setResetPwd] = useState({ next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ create: false, resetNext: false, resetConfirm: false });

  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMenu = (e: React.MouseEvent, userId: string, totalRows: number, rowIndex: number) => {
    if (menuId === userId) { setMenuId(null); return; }
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const openUp = rowIndex >= totalRows - 2;
    setMenuPos({ top: openUp ? rect.top : rect.bottom + 4, right: window.innerWidth - rect.right, openUp });
    setMenuId(userId);
  };

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

  // Server-side filtering via API params; client-side as fallback
  const filtered = useMemo(() => {
    if (usersData?.total !== undefined && (search || statusFilter !== 'all' || roleFilter !== 'all' || deptFilter !== 'all')) {
      // Backend already filtered, use API result directly
      return users;
    }
    // Fallback: client-side filter
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const names = [u.name_zh, u.name_en, u.username].filter(Boolean).join(' ').toLowerCase();
      const matchQ = !q || names.includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.toLowerCase().includes(q));
      const matchS = statusFilter === 'all' || u.status === statusFilter;
      const matchR = roleFilter === 'all' || u.roles.includes(roleFilter);
      const matchD = deptFilter === 'all' || u.dept_code === deptFilter;
      return matchQ && matchS && matchR && matchD;
    });
  }, [users, usersData?.total, search, statusFilter, roleFilter, deptFilter]);

  const isFiltered = Boolean(search) || statusFilter !== 'all' || roleFilter !== 'all' || deptFilter !== 'all';
  const stats = useMemo(() => {
    const s = { total: users.length, active: 0, inactive: 0, locked: 0, pending: 0 };
    for (const u of users) s[u.status] += 1;
    return s;
  }, [users]);

  const userName = (u: UserAccount) => (isEn ? u.name_en || u.name_zh || u.username : u.name_zh || u.name_en || u.username);
  const roleName = (r: RoleKey) => t(`userMgmt.roles.${r}`);
  const deptName = (d: DeptKey) => t(`userMgmt.depts.${d}`);
  const statusName = (s: UserStatus) => t(`userMgmt.status.${s}`);

  const openCreate = () => {
    setForm({ name: '', username: '', email: '', phone: '', deptCode: '', authMethod: 'local', password: '', roles: [], status: 'active', remark: '' });
    setModal('create');
  };

  const openEdit = (u: UserAccount) => {
    setTargetId(u.id);
    setForm({
      name: isEn ? u.name_en || u.name_zh || '' : u.name_zh || u.name_en || '',
      username: u.username,
      email: u.email,
      phone: u.phone || '',
      deptCode: u.dept_code || '',
      authMethod: u.auth_method,
      password: '',
      roles: [...u.roles],
      status: u.status,
      remark: u.remark ?? '',
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
  const toggleStatusMutation = useToggleStatus();
  const { data: departments = [] } = useGetDepartments();

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.email || !form.password || form.roles.length === 0) return;
    
    try {
      await createUserMutation.mutateAsync({
        username: form.username,
        password: form.password,
        name_zh: form.name,
        email: form.email,
        phone: form.phone,
        deptCode: form.deptCode,
        authMethod: form.authMethod,
        roleKeys: form.roles,
        remark: form.remark,
      });
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
          name_zh: form.name,
          email: form.email,
          phone: form.phone,
          deptCode: form.deptCode,
          roleKeys: form.roles,
          status: form.status as 'active' | 'inactive' | 'locked',
          remark: form.remark,
        },
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
    // Prevent disabling the current logged-in user
    if (currentUser && u.id === currentUser.userId) {
      showToast('userMgmt.error.cannotDisableSelf');
      setMenuId(null);
      return;
    }
    const next: UserStatus = u.status === 'active' ? 'inactive' : 'active';
    
    try {
      await toggleStatusMutation.mutateAsync({
        id: u.id,
        status: next,
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
    try {
      const exportData = filtered.length > 0 ? filtered : users;
      const headers = [
        t('userMgmt.table.user'), t('userMgmt.table.emailPhone'),
        t('userMgmt.table.deptRoles'), t('userMgmt.table.auth'),
        t('userMgmt.table.status'), t('userMgmt.table.lastLogin'),
      ];
      const rows = exportData.map(u => [
        userName(u),
        u.email,
        [u.dept_name_zh, u.roles.map(r => roleName(r)).join('/')].filter(Boolean).join(' - '),
        t(`userMgmt.auth.${u.auth_method}`),
        statusName(u.status),
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : t('userMgmt.table.never'),
      ]);
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('userMgmt.toast.exported');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setDeptFilter('all');
  };

  const resetDisabled = !search && statusFilter === 'all' && roleFilter === 'all' && deptFilter === 'all';

  const canCreate = form.name && form.username && form.email && form.password.length >= 8 && form.roles.length > 0;
  const canSave = form.name && form.email && form.roles.length > 0;
  const canConfirmReset = resetPwd.next.length >= 8 && resetPwd.next === resetPwd.confirm;

  const renderStatusBadge = (s: UserStatus) => {
    // Handle unknown or invalid status safely
    const style = STATUS_STYLE[s] || STATUS_STYLE['active']; // fallback to active if unknown
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border whitespace-nowrap ${style.badge}`} style={{ fontSize: 12 }}>
        <Icon size={13} />
        {statusName(s)}
      </span>
    );
  };

  const renderAuthBadge = (a: AuthMethod) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium border whitespace-nowrap ${AUTH_STYLE[a] || AUTH_STYLE.local}`}
      style={{ fontSize: 12 }}
    >
      {t(`userMgmt.auth.${a}`)}
    </span>
  );

  const ROLE_KEYS = ['super_admin', 'ops_manager', 'channel_manager', 'finance_staff', 'readonly_user'];

  const kpiCards = [
    { key: 'total', value: stats.total, color: '#2563EB', label: t('userMgmt.stats.total') },
    { key: 'active', value: stats.active, color: '#16A34A', label: t('userMgmt.stats.active') },
    { key: 'inactive', value: stats.inactive, color: '#9CA3AF', label: t('userMgmt.stats.inactive') },
    { key: 'locked', value: stats.locked, color: '#DC2626', label: t('userMgmt.stats.locked') },
    { key: 'pending', value: stats.pending, color: '#F0932B', label: t('userMgmt.stats.pending') },
  ];

  const cardStyle = {
    background: '#fff',
    border: '1px solid rgba(193,198,215,0.45)',
    borderRadius: 16,
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
  } as const;

  const avatarChar = (u: UserAccount) =>
    (isEn ? (u.name_en || u.name_zh || u.username) : (u.name_zh || u.name_en || u.username)).charAt(0).toUpperCase();

  const deptDisplay = (u: UserAccount) => {
    const direct = isEn ? (u.dept_name_en || u.dept_name_zh) : u.dept_name_zh;
    if (direct) return direct;
    if (u.dept_code) return t(`userMgmt.depts.${u.dept_code}`);
    return '—';
  };

  return (
    <div>
      {/* ===== 页头（间距由 Layout main 的 p-6 提供，与原型 24px 内容边距一致） ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 2, lineHeight: 1.35, letterSpacing: '-0.2px' }}>{t('userMgmt.title')}</h1>
          <p style={{ fontSize: 12.5, color: '#717786', lineHeight: 1.5 }}>{t('userMgmt.description')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ height: 40, padding: '0 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}
          >
            <Download size={16} />
            {t('userMgmt.export')}
          </button>
          <button
            className="btn-primary"
            style={{ height: 40, padding: '0 18px' }}
            onClick={openCreate}
            disabled={isLoading}
          >
            <Plus size={16} />
            {t('userMgmt.newUser')}
          </button>
        </div>
      </div>

      {/* ===== KPI 统计卡（一行 5 卡） ===== */}
      <div className="grid grid-cols-5 gap-3" style={{ marginBottom: 14 }}>
        {kpiCards.map(card => (
          <div
            key={card.key}
            style={{ ...cardStyle, padding: '14px 18px', minWidth: 0 }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: card.color, lineHeight: 1.15 }}>{card.value}</div>
            <div style={{ fontSize: 12.5, color: '#717786', marginTop: 6, whiteSpace: 'nowrap' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ===== 筛选区 ===== */}
      <div className="flex items-center gap-3 flex-wrap" style={{ ...cardStyle, background: '#fff', padding: '14px 16px', marginBottom: 16 }}>
        {/* 左侧：全局搜索框（占主宽） */}
        <div className="relative" style={{ flex: '1 1 280px', minWidth: 240 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder={t('userMgmt.filters.search')}
            className="w-full pl-9 pr-4 bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ height: 40, borderRadius: 10 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* 右侧：过滤器和重置按钮（不收缩、不竖排） */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | UserStatus)}
            className="px-3 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
            style={{ height: 40, borderRadius: 10 }}
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
            className="px-3 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
            style={{ height: 40, borderRadius: 10 }}
          >
            <option value="all">{t('userMgmt.filters.allRoles')}</option>
            {ROLE_KEYS.map(r => <option key={r} value={r}>{roleName(r)}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value as 'all' | DeptKey)}
            className="px-3 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
            style={{ height: 40, borderRadius: 10 }}
          >
            <option value="all">{t('userMgmt.filters.allDepts')}</option>
            {departments.map(d => (
              <option key={d.dept_code} value={d.dept_code}>
                {isEn ? d.dept_name_en || d.dept_name_zh : d.dept_name_zh}
              </option>
            ))}
          </select>
          <button
            disabled={resetDisabled}
            onClick={resetFilters}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13 }}
          >
            <RotateCcw size={14} />
            {t('userMgmt.filters.reset')}
          </button>
        </div>
      </div>

      {/* ===== 用户表格（纯白卡片，无列竖线） ===== */}
      <div className="overflow-hidden mb-4" style={{ ...cardStyle, background: '#fff' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 1080 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F1F5' }}>
                <th className="px-5 py-3.5 text-left whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.user')}</th>
                <th className="px-5 py-3.5 text-left" style={{ minWidth: 230, fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.emailPhone')}</th>
                <th className="px-5 py-3.5 text-left whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.deptRoles')}</th>
                <th className="px-5 py-3.5 text-left whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.auth')}</th>
                <th className="px-5 py-3.5 text-left whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.status')}</th>
                <th className="px-5 py-3.5 text-left whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: '#717786' }}>{t('userMgmt.table.lastLogin')}</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody style={{ borderTop: 'none' }}>
              {filtered.map((u, idx) => {
                const login = formatLogin(u.lastLoginAt);
                return (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50/70" style={{ borderBottom: '1px solid #F5F6F8' }}>
                    {/* 用户 */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ width: 40, height: 40, background: avatarBg(u), fontSize: 15, fontWeight: 600 }}
                        >
                          {avatarChar(u)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', lineHeight: 1.35 }}>{userName(u)}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{u.username}</div>
                        </div>
                      </div>
                    </td>
                    {/* 邮箱 / 手机 */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2" style={{ fontSize: 13, color: '#374151' }}>
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{u.phone || '—'}</span>
                      </div>
                    </td>
                    {/* 部门 / 角色 */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: '#374151' }}>
                        <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{deptDisplay(u)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 6 }}>
                        {u.roles.length > 0 ? u.roles.map((r: RoleKey) => (
                          <span
                            key={r}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${ROLE_STYLE[r] || ROLE_STYLE.readonly_user}`}
                            style={{ fontSize: 11.5 }}
                          >
                            <Shield size={11} />
                            {roleName(r)}
                          </span>
                        )) : (
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{t('userMgmt.table.noRoles')}</span>
                        )}
                      </div>
                    </td>
                    {/* 认证 */}
                    <td className="px-5 py-3.5 whitespace-nowrap">{renderAuthBadge(u.auth_method)}</td>
                    {/* 状态 */}
                    <td className="px-5 py-3.5 whitespace-nowrap">{renderStatusBadge(u.status)}</td>
                    {/* 最近登录 */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {login ? (
                        <div>
                          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>{login.date}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.45 }}>{login.time}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{t('userMgmt.table.never')}</span>
                      )}
                    </td>
                    {/* 行操作 */}
                    <td className="px-4 py-3.5 text-right relative whitespace-nowrap">
                      <button
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        onClick={(e) => openMenu(e, u.id, filtered.length, idx)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>
                    {isLoading ? t('common:loading') : t('userMgmt.table.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* 页脚 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" style={{ borderTop: '1px solid #F0F1F5' }}>
          <span className="text-sm" style={{ color: '#717786' }}>
            {isFiltered
              ? t('userMgmt.footer.filteredFrom', { n: filtered.length, total: users.length })
              : t('userMgmt.footer.userCount', { n: users.length })}
          </span>
          <button
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#0058BC' }}
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
            <Field label={t('userMgmt.field.department')}>
              <select className={inputCls} value={form.deptCode} onChange={e => setForm(f => ({ ...f, deptCode: e.target.value }))}>
                <option value="">{t('userMgmt.ph.selectDepartment')}</option>
                {departments.map(d => (
                  <option key={d.dept_code} value={d.dept_code}>
                    {isEn ? d.dept_name_en || d.dept_name_zh : d.dept_name_zh}
                  </option>
                ))}
              </select>
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
            <Field label={t('userMgmt.field.department')}>
              <select className={inputCls} value={form.deptCode} onChange={e => setForm(f => ({ ...f, deptCode: e.target.value }))}>
                <option value="">{t('userMgmt.ph.selectDepartment')}</option>
                {departments.map(d => (
                  <option key={d.dept_code} value={d.dept_code}>
                    {isEn ? d.dept_name_en || d.dept_name_zh : d.dept_name_zh}
                  </option>
                ))}
              </select>
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

      {/* ===== Action Dropdown (fixed position, outside table) ===== */}
      {menuId && (() => {
        const menuUser = users.find(u => u.id === menuId);
        if (!menuUser) return null;
        return (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setMenuId(null)} />
            <div
              ref={menuRef}
              className="fixed z-[60] w-44 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 text-left"
              style={{
                top: menuPos.openUp ? undefined : menuPos.top,
                bottom: menuPos.openUp ? window.innerHeight - menuPos.top : undefined,
                right: menuPos.right,
              }}
            >
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { setMenuId(null); openEdit(menuUser); }}
              >
                <Pencil size={14} />
                {t('userMgmt.menu.editUser')}
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { setMenuId(null); openReset(menuUser); }}
              >
                <KeyRound size={14} />
                {t('userMgmt.menu.resetPassword')}
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => toggleStatus(menuUser)}
              >
                {menuUser.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                {t(menuUser.status === 'active' ? 'userMgmt.menu.disableAccount' : 'userMgmt.menu.enableAccount')}
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { setMenuId(null); setTargetId(menuUser.id); setModal('delete'); }}
              >
                <Trash2 size={14} />
                {t('userMgmt.menu.deleteUser')}
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
