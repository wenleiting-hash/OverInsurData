/**
 * RoleListView - Role Management List
 *
 * Connected to real backend API via React Query hooks.
 * Displays all roles with search, create/edit modal, and delete confirmation.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Edit, Trash2, Search, X, Shield,
  AlertTriangle, Users, ShieldCheck, Lock,
} from 'lucide-react';
import type { ViewId } from '@/App';
import {
  useGetRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/services/userService';
import type { RoleInfo } from '@/lib/user-api-client';

interface Props {
  navigateTo: (view: ViewId) => void;
}

type ModalKind = 'none' | 'create' | 'edit' | 'delete';

/** @deprecated Legacy type for RoleEditView. Use RoleInfo from user-api-client instead. */
export type Role = {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  description?: string;
  descriptionEn?: string;
  permissions: Record<string, boolean>;
  createdAt: string;
};

export default function RoleListView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('permission');
  const isEn = i18n.language?.startsWith?.('en') ?? false;

  const { data: roles = [], isLoading, error, refetch } = useGetRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<ModalKind>('none');
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    roleKey: '', roleNameZh: '', roleNameEn: '', roleCode: '',
    description: '', isSystem: false, sortOrder: 0,
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r =>
      r.role_name_zh.toLowerCase().includes(q) ||
      (r.role_name_en || '').toLowerCase().includes(q) ||
      r.role_key.toLowerCase().includes(q) ||
      r.role_code.toLowerCase().includes(q)
    );
  }, [roles, searchTerm]);

  const target = roles.find(r => r.role_key === targetKey) ?? null;
  const roleName = (r: RoleInfo) => (isEn ? r.role_name_en || r.role_name_zh : r.role_name_zh);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const openCreate = () => {
    setForm({ roleKey: '', roleNameZh: '', roleNameEn: '', roleCode: '', description: '', isSystem: false, sortOrder: 0 });
    setModal('create');
  };

  const openEdit = (r: RoleInfo) => {
    setForm({
      roleKey: r.role_key,
      roleNameZh: r.role_name_zh,
      roleNameEn: r.role_name_en || '',
      roleCode: r.role_code,
      description: r.description || '',
      isSystem: r.is_system,
      sortOrder: r.sort_order,
    });
    setTargetKey(r.role_key);
    setModal('edit');
  };

  const openDelete = (r: RoleInfo) => {
    setTargetKey(r.role_key);
    setModal('delete');
  };

  // ─── Mutations ─────────────────────────────────────────────────
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const handleCreate = async () => {
    if (!form.roleKey || !form.roleNameZh || !form.roleCode) return;
    try {
      await createRoleMutation.mutateAsync({
        roleKey: form.roleKey,
        roleNameZh: form.roleNameZh,
        roleNameEn: form.roleNameEn || undefined,
        roleCode: form.roleCode,
        description: form.description || undefined,
        isSystem: form.isSystem,
        sortOrder: form.sortOrder,
      });
      showToast(t('roleMgmt.toast.created'));
      setModal('none');
      refetch();
    } catch (err) {
      console.error('Failed to create role:', err);
      showToast(t('roleMgmt.error.createFailed'));
    }
  };

  const handleUpdate = async () => {
    if (!targetKey || !form.roleNameZh || !form.roleCode) return;
    try {
      await updateRoleMutation.mutateAsync({
        roleKey: targetKey,
        dto: {
          roleNameZh: form.roleNameZh,
          roleNameEn: form.roleNameEn || undefined,
          roleCode: form.roleCode,
          description: form.description || undefined,
          sortOrder: form.sortOrder,
        },
      });
      showToast(t('roleMgmt.toast.updated'));
      setModal('none');
      refetch();
    } catch (err) {
      console.error('Failed to update role:', err);
      showToast(t('roleMgmt.error.updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!targetKey) return;
    try {
      await deleteRoleMutation.mutateAsync(targetKey);
      showToast(t('roleMgmt.toast.deleted'));
      setModal('none');
      refetch();
    } catch (err) {
      console.error('Failed to delete role:', err);
      showToast(t('roleMgmt.error.deleteFailed'));
    }
  };

  const canSave = form.roleNameZh && form.roleCode && (modal === 'create' ? form.roleKey : true);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 22px', marginBottom: 16 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>{t('roleList')}</h1>
            <p style={{ fontSize: 14, color: '#666' }}>{t('roleMgmt.description')}</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openCreate} disabled={isLoading}>
            <Plus size={16} />
            {t('createRole')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-lg p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('searchRolePlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden" style={{ background: '#F9FAFB' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead style={{ background: 'rgba(236,237,249,0.5)', borderBottom: '1px solid #C1C6D7' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('roleName')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('roleCode')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('description')}</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <Users size={14} className="inline mr-1" />{t('roleMgmt.users')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <ShieldCheck size={14} className="inline mr-1" />{t('permissions')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('createTime')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ background: '#fff' }}>
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">{t('loading')}</td></tr>
              )}
              {!isLoading && error && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-red-500">Failed to load roles</td></tr>
              )}
              {!isLoading && !error && filtered.map(role => (
                <tr key={role.role_key} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{roleName(role)}</div>
                      {role.is_system && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Lock size={10} />{t('userMgmt.view.systemBadge')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{role.role_key}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{role.role_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{role.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <Users size={12} />{role.userCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                      <Shield size={12} />{role.permissionCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(role.created_at).toLocaleDateString(isEn ? 'en-US' : 'zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={() => openEdit(role)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        onClick={() => openDelete(role)}
                        disabled={role.is_system}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">{t('roleMgmt.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">{t('roleMgmt.footer', { n: filtered.length })}</span>
        </div>
      </div>

      {/* ===== Create / Edit Role Modal ===== */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onMouseDown={() => setModal('none')}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{modal === 'create' ? t('createRole') : t('editRole')}</h3>
              </div>
              <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" onClick={() => setModal('none')}>
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('roleName')} <span className="text-red-500">*</span>
                </label>
                <input className={inputCls} value={form.roleNameZh} onChange={e => setForm(f => ({ ...f, roleNameZh: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('roleMgmt.roleNameEn')}</label>
                <input className={inputCls} value={form.roleNameEn} onChange={e => setForm(f => ({ ...f, roleNameEn: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('roleCode')} <span className="text-red-500">*</span>
                </label>
                {modal === 'create' ? (
                  <input className={inputCls} placeholder="e.g. sales_manager" value={form.roleKey} onChange={e => setForm(f => ({ ...f, roleKey: e.target.value }))} />
                ) : (
                  <input className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`} value={form.roleKey} disabled readOnly />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('description')}</label>
                <textarea className={`${inputCls} h-20 resize-none`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setModal('none')}>
                {t('cancel')}
              </button>
              <button
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSave || createRoleMutation.isPending || updateRoleMutation.isPending}
                onClick={modal === 'create' ? handleCreate : handleUpdate}
              >
                {modal === 'create' ? t('createRole') : t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
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
                <h3 className="text-lg font-bold text-gray-900">{t('deleteRole')}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{t('confirmDelete')}</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{roleName(target)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setModal('none')}>
                {t('cancel')}
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                onClick={handleDelete}
                disabled={deleteRoleMutation.isPending}
              >
                <Trash2 size={15} />
                {t('deleteRole')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl bg-gray-900/90 text-white text-sm shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
