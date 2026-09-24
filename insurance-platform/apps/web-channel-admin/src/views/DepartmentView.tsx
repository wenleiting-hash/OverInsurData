/**
 * Department Management View
 *
 * Master-Detail layout with department tree (left) and detail panel (right).
 * Supports CRUD: create, edit, delete departments with color picker and hierarchy.
 * Aligned with Figma V1.5 prototype.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, X, MoreHorizontal, ChevronRight, ChevronDown,
  Building2, Users, Layers, Calendar, User, Mail, Phone, MapPin,
  Pencil, Trash2, AlertTriangle, Save, FolderTree, Briefcase,
} from 'lucide-react';
import type { ViewId } from '@/App';
import {
  useGetDepartmentTree,
  useGetDepartmentDetail,
  useGetDepartmentMembers,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/services/departmentService';
import type {
  DepartmentTreeNode,
  DepartmentDetail,
  CreateDepartmentDto,
} from '@/lib/user-api-client';

interface Props { navigateTo: (view: ViewId) => void; }

// ─── Color palette (8 preset colors) ──────────────────────────────────
const PRESET_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0891B2', '#E11D48', '#DC2626', '#4B5563'];

// ─── Helper: flatten tree for search/parent-select ────────────────────
function flattenTree(nodes: DepartmentTreeNode[], depth = 0): Array<{ node: DepartmentTreeNode; depth: number }> {
  const result: Array<{ node: DepartmentTreeNode; depth: number }> = [];
  for (const n of nodes) {
    result.push({ node: n, depth });
    if (n.children?.length) result.push(...flattenTree(n.children, depth + 1));
  }
  return result;
}

function countAllDepts(nodes: DepartmentTreeNode[]): number {
  let count = 0;
  for (const n of nodes) { count++; if (n.children?.length) count += countAllDepts(n.children); }
  return count;
}

function countAllMembers(nodes: DepartmentTreeNode[]): number {
  let count = 0;
  for (const n of nodes) { count += n.member_count || 0; if (n.children?.length) count += countAllMembers(n.children); }
  return count;
}

function maxDepth(nodes: DepartmentTreeNode[], current = 1): number {
  let max = current;
  for (const n of nodes) {
    if (n.children?.length) max = Math.max(max, maxDepth(n.children, current + 1));
  }
  return max;
}

function getDescendantIds(node: DepartmentTreeNode): number[] {
  const ids: number[] = [];
  if (node.children) for (const c of node.children) { ids.push(c.dept_id); ids.push(...getDescendantIds(c)); }
  return ids;
}

// ─── Input style ─────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 rounded-lg bg-[#F8F9FC] border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// ─── Field component (module-level for stable refs) ───────────────────
function Field({ label, required, children, className = '' }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── ModalShell (module-level) ────────────────────────────────────────
function ModalShell({ title, description, onClose, children }: {
  title: string; description: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div><h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23' }}>{title}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{description}</p>
          </div>
          <button onClick={onClose} style={{ padding: 4, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '16px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Tree Node Component ──────────────────────────────────────────────
function TreeNode({ node, depth, selectedId, onSelect, onAction, expandedIds, toggleExpand }: {
  node: DepartmentTreeNode; depth: number; selectedId: number | null;
  onSelect: (id: number) => void;
  onAction: (action: 'addSub' | 'edit' | 'delete', node: DepartmentTreeNode) => void;
  expandedIds: Set<number>; toggleExpand: (id: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasChildren = !!node.children?.length;
  const isExpanded = expandedIds.has(node.dept_id);
  const isSelected = selectedId === node.dept_id;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', paddingLeft: 12 + depth * 20,
          borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
          background: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
          borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
        }}
        onClick={() => onSelect(node.dept_id)}
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); toggleExpand(node.dept_id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#9CA3AF' }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <span style={{ width: 20 }} />}
        <div style={{ width: 28, height: 28, borderRadius: 8, background: node.color || '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={14} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.dept_name_zh}</div>
          {node.dept_name_en && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{node.dept_name_en}</div>}
        </div>
        <span style={{ fontSize: 11, color: '#6B7280', background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>{node.member_count}</span>
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#9CA3AF' }}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 30, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)', minWidth: 160, padding: 4 }}>
              {(['addSub', 'edit', 'delete'] as const).map(action => (
                <button key={action} onClick={e => { e.stopPropagation(); setMenuOpen(false); onAction(action, node); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: action === 'delete' ? '#DC2626' : '#374151', borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  {action === 'addSub' && <Plus size={14} />}
                  {action === 'edit' && <Pencil size={14} />}
                  {action === 'delete' && <Trash2 size={14} />}
                  {action === 'addSub' ? '添加子部门' : action === 'edit' ? '编辑部门' : '删除部门'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeNode key={child.dept_id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onAction={onAction} expandedIds={expandedIds} toggleExpand={toggleExpand} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function DepartmentView({ navigateTo }: Props) {
  const { t } = useTranslation('department');

  // Data
  const { data: tree = [], isLoading: treeLoading } = useGetDepartmentTree();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail } = useGetDepartmentDetail(selectedId);
  const { data: membersData } = useGetDepartmentMembers(selectedId, { pageSize: 20 });

  // Mutations
  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();

  // UI state
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit' | 'addSub'>('none');
  const [formTarget, setFormTarget] = useState<DepartmentTreeNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentTreeNode | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Auto-expand first node on initial load
  useEffect(() => {
    if (tree.length > 0 && expandedIds.size === 0) {
      const first = tree[0];
      setExpandedIds(new Set([first.dept_id]));
      if (!selectedId) setSelectedId(first.dept_id);
    }
  }, [tree]);

  // Toast auto-dismiss
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // Stats
  const stats = useMemo(() => ({
    totalDepts: countAllDepts(tree),
    totalMembers: countAllMembers(tree),
    maxLevel: maxDepth(tree),
  }), [tree]);

  // Filtered tree for search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.trim().toLowerCase();
    const filterNode = (nodes: DepartmentTreeNode[]): DepartmentTreeNode[] => {
      const result: DepartmentTreeNode[] = [];
      for (const n of nodes) {
        const match = n.dept_name_zh?.toLowerCase().includes(q) || n.dept_name_en?.toLowerCase().includes(q) || n.dept_code?.toLowerCase().includes(q);
        const filteredChildren = n.children ? filterNode(n.children) : [];
        if (match || filteredChildren.length > 0) {
          result.push({ ...n, children: filteredChildren.length > 0 ? filteredChildren : n.children });
        }
      }
      return result;
    };
    return filterNode(tree);
  }, [tree, search]);

  // Flat list for parent select dropdown
  const flatList = useMemo(() => flattenTree(tree), [tree]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type }), []);

  // Tree action handler
  const handleTreeAction = useCallback((action: 'addSub' | 'edit' | 'delete', node: DepartmentTreeNode) => {
    if (action === 'delete') { setDeleteTarget(node); return; }
    if (action === 'edit') { setFormMode('edit'); setFormTarget(node); return; }
    setFormMode('addSub'); setFormTarget(node);
  }, []);

  // ─── Form Dialog ────────────────────────────────────────────────────
  const FormDialog = () => {
    const isEdit = formMode === 'edit';
    const isAddSub = formMode === 'addSub';
    const [form, setForm] = useState(() => ({
      dept_name_zh: isEdit ? formTarget!.dept_name_zh : '',
      dept_name_en: isEdit ? (formTarget!.dept_name_en || '') : '',
      parent_dept_id: isAddSub ? formTarget!.dept_id : isEdit ? (formTarget!.parent_dept_id ?? 0) : 0,
      color: isEdit ? (formTarget!.color || '#2563EB') : '#2563EB',
      description: isEdit ? (formTarget!.description || '') : '',
      manager_name: isEdit ? (formTarget!.manager_name || '') : '',
      manager_title: isEdit ? (formTarget!.manager_title || '') : '',
      manager_email: isEdit ? (formTarget!.manager_email || '') : '',
      manager_phone: isEdit ? (formTarget!.manager_phone || '') : '',
      office_location: isEdit ? (formTarget!.office_location || '') : '',
    }));

    const excludeIds = useMemo(() => {
      if (!isEdit || !formTarget) return [];
      return [formTarget.dept_id, ...getDescendantIds(formTarget)];
    }, [isEdit, formTarget]);

    const title = isEdit ? t('form.editTitle') : isAddSub ? t('form.addSubTitle') : t('form.createTitle');
    const desc = isEdit ? t('form.editDesc', { name: formTarget!.dept_name_zh }) : isAddSub ? t('form.addSubDesc', { parent: formTarget!.dept_name_zh }) : t('form.createDesc');

    const handleSubmit = async () => {
      if (!form.dept_name_zh.trim()) return;
      try {
        if (isEdit) {
          await updateMut.mutateAsync({
            id: formTarget!.dept_id,
            dto: { ...form, parent_dept_id: form.parent_dept_id || null } as any,
          });
          showToast(t('messages.updateSuccess'));
        } else {
          await createMut.mutateAsync({ ...form, parent_dept_id: form.parent_dept_id || undefined } as CreateDepartmentDto);
          showToast(t('messages.createSuccess'));
        }
        setFormMode('none'); setFormTarget(null);
      } catch { showToast(isEdit ? t('messages.updateError') : t('messages.createError'), 'error'); }
    };

    return (
      <ModalShell title={title} description={desc} onClose={() => { setFormMode('none'); setFormTarget(null); }}>
        {/* Color picker */}
        <Field label={t('form.color')}>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', cursor: 'pointer' }} />
            ))}
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label={t('form.name')} required>
            <input className={inputCls} value={form.dept_name_zh} onChange={e => setForm(f => ({ ...f, dept_name_zh: e.target.value }))} placeholder="如：技术部" />
          </Field>
          <Field label={t('form.nameEn')}>
            <input className={inputCls} value={form.dept_name_en} onChange={e => setForm(f => ({ ...f, dept_name_en: e.target.value }))} placeholder="Engineering" />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label={t('form.parent')}>
            <select className={inputCls} value={form.parent_dept_id} onChange={e => setForm(f => ({ ...f, parent_dept_id: Number(e.target.value) }))}>
              <option value={0}>{t('form.parentNone')}</option>
              {flatList.filter(({ node }) => !excludeIds.includes(node.dept_id)).map(({ node, depth }) => (
                <option key={node.dept_id} value={node.dept_id}>{' '.repeat(depth)}{node.dept_name_zh}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label={t('form.managerName')} required>
            <input className={inputCls} value={form.manager_name} onChange={e => setForm(f => ({ ...f, manager_name: e.target.value }))} placeholder="负责人姓名" />
          </Field>
          <Field label={t('form.managerTitle')}>
            <input className={inputCls} value={form.manager_title} onChange={e => setForm(f => ({ ...f, manager_title: e.target.value }))} placeholder="如：CTO" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label={t('form.managerEmail')}>
            <input className={inputCls} value={form.manager_email} onChange={e => setForm(f => ({ ...f, manager_email: e.target.value }))} placeholder="work@example.com" />
          </Field>
          <Field label={t('form.managerPhone')}>
            <input className={inputCls} value={form.manager_phone} onChange={e => setForm(f => ({ ...f, manager_phone: e.target.value }))} placeholder="+1-xxx-xxx-xxxx" />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label={t('form.officeLocation')}>
            <input className={inputCls} value={form.office_location} onChange={e => setForm(f => ({ ...f, office_location: e.target.value }))} placeholder="如：San Francisco, CA" />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label={t('form.deptDescription')}>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="简要描述部门职能…" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={() => { setFormMode('none'); setFormTarget(null); }}
            style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>{t('form.cancel')}</button>
          <button onClick={handleSubmit} disabled={!form.dept_name_zh.trim() || !form.manager_name.trim() || createMut.isPending || updateMut.isPending}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: !form.dept_name_zh.trim() ? 0.5 : 1 }}>
            {isEdit ? <><Save size={14} />{t('form.save')}</> : <><Plus size={14} />{t('form.create')}</>}
          </button>
        </div>
      </ModalShell>
    );
  };

  // ─── Delete Confirm Dialog ──────────────────────────────────────────
  const DeleteDialog = () => {
    if (!deleteTarget) return null;
    const subCount = deleteTarget.sub_department_count || 0;
    const handleDelete = async () => {
      try {
        await deleteMut.mutateAsync(deleteTarget.dept_id);
        showToast(t('messages.deleteSuccess'));
        setDeleteTarget(null);
        if (selectedId === deleteTarget.dept_id) setSelectedId(null);
      } catch { showToast(t('messages.deleteError'), 'error'); }
    };
    return (
      <ModalShell title={t('delete.title', { name: deleteTarget.dept_name_zh })} description="" onClose={() => setDeleteTarget(null)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} style={{ color: '#DC2626' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t('delete.warning')}</p>
            {subCount > 0 && <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, marginTop: 4 }}>{t('delete.subWarning', { count: subCount })}</p>}
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{t('delete.memberWarning')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: 13 }}>{t('delete.cancel')}</button>
          <button onClick={handleDelete} disabled={deleteMut.isPending}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={14} />{t('delete.confirm')}
          </button>
        </div>
      </ModalShell>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 60, padding: '10px 20px', borderRadius: 10, background: toast.type === 'success' ? '#059669' : '#DC2626', color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#181C23' }}>{t('title')}</h1>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{t('description')}</p>
        </div>
        <button onClick={() => { setFormMode('create'); setFormTarget(null); }}
          style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />{t('newDepartment')}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { value: stats.totalDepts, label: t('stats.totalDepartments'), color: '#2563EB', icon: <Building2 size={18} /> },
          { value: stats.totalMembers, label: t('stats.totalMembers'), color: '#059669', icon: <Users size={18} /> },
          { value: stats.maxLevel, label: t('stats.maxLevel'), color: '#2563EB', icon: <Layers size={18} /> },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px', height: 76, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left: Tree Panel */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: 500 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input className={inputCls} style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} />
          </div>
          {/* Tree */}
          {treeLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>{t('messages.loading')}</div>
          ) : filteredTree.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>{t('messages.empty')}</div>
          ) : (
            filteredTree.map(node => (
              <TreeNode key={node.dept_id} node={node} depth={0} selectedId={selectedId} onSelect={setSelectedId} onAction={handleTreeAction} expandedIds={expandedIds} toggleExpand={toggleExpand} />
            ))
          )}
        </div>

        {/* Right: Detail Panel */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: 500 }}>
          {!detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: '#9CA3AF' }}>
              <FolderTree size={48} strokeWidth={1.5} />
              <p style={{ marginTop: 16, fontSize: 14 }}>{t('detail.empty')}</p>
            </div>
          ) : (
            <div>
              {/* Department Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: detail.color || '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{detail.dept_name_zh}</h2>
                      {detail.dept_name_en && <span style={{ fontSize: 13, color: '#9CA3AF', background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '2px 8px' }}>{detail.dept_name_en}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                      {detail.ancestor_path?.map((p, i) => <span key={p.dept_id}>{i > 0 ? ' > ' : ''}{p.dept_name_zh}</span>)}
                    </div>
                    {detail.description && <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, maxWidth: 500 }}>{detail.description}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setFormMode('addSub'); setFormTarget(tree.length ? findNode(tree, detail.dept_id) || tree[0] : tree[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, color: '#374151' }}>
                    <Plus size={14} />{t('detail.addSub')}
                  </button>
                  <button onClick={() => { const node = findNode(tree, detail.dept_id); if (node) { setFormMode('edit'); setFormTarget(node); } }}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Pencil size={14} />{t('detail.edit')}
                  </button>
                </div>
              </div>

              {/* Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20, padding: '14px 0', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {[
                  { icon: <Users size={15} />, label: t('detail.info.members'), value: `${detail.member_count} ${t('detail.unit.people')}` },
                  { icon: <FolderTree size={15} />, label: t('detail.info.subDepartments'), value: `${detail.sub_department_count} ${t('detail.unit.count')}` },
                  { icon: <Calendar size={15} />, label: t('detail.info.createdAt'), value: detail.created_at ? new Date(detail.created_at).toLocaleDateString() : '-' },
                  { icon: <User size={15} />, label: t('detail.info.manager'), value: detail.manager_name || '-' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#9CA3AF' }}>{item.icon}</span>
                    <div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.label}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.value}</div></div>
                  </div>
                ))}
              </div>

              {/* Manager Card */}
              {detail.manager_name && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#F8F9FC', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: detail.color || '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                    {(detail.manager_name || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{detail.manager_name}</div>
                    {detail.manager_title && <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.manager_title}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
                    {detail.manager_email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}><Mail size={12} />{detail.manager_email}</div>}
                    {detail.manager_phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}><Phone size={12} />{detail.manager_phone}</div>}
                  </div>
                </div>
              )}

              {/* Sub-department List */}
              {detail.children && detail.children.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 10 }}>{t('detail.subDeptList')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.children.map(sub => (
                      <div key={sub.dept_id} onClick={() => setSelectedId(sub.dept_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color || '#2563EB' }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#374151' }}>{sub.dept_name_zh}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{sub.member_count} {t('detail.unit.people')}</span>
                        <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Table */}
              {membersData && membersData.data.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{t('detail.memberTable.title')}</h3>
                    <button onClick={() => navigateTo('user-list')} style={{ fontSize: 12, color: '#2563EB', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>{t('detail.manageUsers')}</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(236,237,249,0.35)' }}>
                      <tr>
                        {[t('detail.memberTable.name'), t('detail.memberTable.role'), t('detail.memberTable.email'), t('detail.memberTable.status')].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#717786', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {membersData.data.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13 }}>
                            <div style={{ fontWeight: 500, color: '#181C23' }}>{m.name_zh || m.name_en || m.username}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{m.username}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#6B7280' }}>{(m as any).roles?.join(', ') || '-'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#6B7280' }}>{m.email}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 6,
                              background: m.status === 'active' ? 'rgba(5,150,105,0.1)' : m.status === 'inactive' ? 'rgba(107,114,128,0.1)' : m.status === 'locked' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                              color: m.status === 'active' ? '#059669' : m.status === 'inactive' ? '#6B7280' : m.status === 'locked' ? '#DC2626' : '#D97706',
                            }}>
                              {t(`status.${m.status}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {formMode !== 'none' && <FormDialog />}
      {deleteTarget && <DeleteDialog />}
    </div>
  );
}

// ─── Utility: find node in tree ──────────────────────────────────────
function findNode(nodes: DepartmentTreeNode[], id: number): DepartmentTreeNode | null {
  for (const n of nodes) {
    if (n.dept_id === id) return n;
    if (n.children) { const found = findNode(n.children, id); if (found) return found; }
  }
  return null;
}
