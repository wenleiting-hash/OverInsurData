import { useState, useRef, useEffect } from 'react'
import {
  Users, Plus, Search, MoreHorizontal, Edit2, Trash2, Shield,
  UserCheck, UserX, Mail, Phone, Building2, Calendar, ChevronDown,
  X, Save, Eye, EyeOff, AlertCircle, CheckCircle2, Filter,
  RefreshCw, Download, Key, Clock, Lock, Unlock, Copy,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

interface Props { navigateTo: (view: ViewId) => void }

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  text: '#181C23', soft: '#414755', muted: '#717786', faint: '#A0A5B4',
  border: 'rgba(193,198,215,0.42)', borderMid: 'rgba(193,198,215,0.58)',
  surface: 'rgba(255,255,255,0.65)', surfaceHigh: 'rgba(255,255,255,0.88)',
  blue: '#0058BC', blueBg: 'rgba(0,88,188,0.08)', blueBorder: 'rgba(0,88,188,0.2)',
  green: '#059669', greenBg: 'rgba(5,150,105,0.08)', greenBorder: 'rgba(5,150,105,0.2)',
  red: '#BA1A1A', redBg: 'rgba(186,26,26,0.07)', redBorder: 'rgba(186,26,26,0.2)',
  amber: '#d97706', amberBg: 'rgba(217,119,6,0.08)', amberBorder: 'rgba(217,119,6,0.2)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)',
}

// ─── i18n ────────────────────────────────────────────────────────────────────

const T = {
  zh: {
    title: '用户管理', subtitle: '管理系统用户账户、角色分配及访问权限',
    btnExport: '导出', btnNew: '新增用户',
    statAll: '全部用户', statActive: '正常', statInactive: '停用', statLocked: '已锁定', statPending: '待激活',
    searchPlaceholder: '搜索姓名、用户名、邮箱…',
    filterAllStatus: '全部状态', filterAllRole: '全部角色', filterAllDept: '全部部门',
    btnReset: '重置',
    colUser: '用户', colContact: '邮箱 / 手机', colDeptRole: '部门 / 角色', colAuth: '认证', colStatus: '状态', colLastLogin: '最近登录',
    neverLogin: '从未登录', noResults: '未找到匹配的用户',
    footerCount: (n: number, total: number) => n === total ? `共 ${n} 位用户` : `共 ${n} 位用户（已过滤，总计 ${total} 位）`,
    manageRoles: '管理角色与权限',
    formEditTitle: '编辑用户', formNewTitle: '新增用户',
    formEditSub: (name: string) => `修改 ${name} 的账户信息`,
    formNewSub: '创建新的系统用户账户',
    labelName: '姓名', labelUsername: '用户名', labelEmail: '邮箱', labelPhone: '手机号',
    labelDept: '部门', labelAuth: '认证方式', labelPassword: '初始密码', labelRoles: '角色分配',
    labelStatus: '账户状态', labelRemark: '备注',
    phName: '请输入真实姓名', phUsername: '登录用户名', phEmail: 'work@example.com',
    phPhone: '+1-xxx / 138-xxxx', phSelectDept: '请选择部门',
    phPassword: '至少 8 位，含字母和数字', phRemark: '可选备注说明',
    authLocal: '本地账号', authSSO: 'SSO（集成平台）', authLDAP: 'LDAP',
    statusActive: '正常', statusInactive: '停用', statusLocked: '已锁定',
    errName: '请输入姓名', errUsername: '请输入用户名', errEmail: '请输入邮箱',
    errEmailFmt: '邮箱格式不正确', errDept: '请选择部门', errRoles: '请至少分配一个角色',
    errPassword: '请设置初始密码',
    btnCancel: '取消', btnSave: '保存更改', btnCreate: '创建用户',
    resetTitle: '重置密码', resetDone: '密码已重置',
    resetDoneDesc: '新密码已生效，请通知用户尽快登录并修改。',
    labelNewPass: '新密码', labelConfirmPass: '确认密码',
    phNewPass: '至少 8 位，含字母和数字', phConfirmPass: '再次输入新密码',
    errMismatch: '两次密码不一致', btnDone: '完成', btnConfirmReset: '确认重置',
    menuEdit: '编辑用户', menuResetPass: '重置密码', menuDisable: '停用账户', menuEnable: '启用账户', menuDelete: '删除用户',
    deleteTitle: '确认删除用户？', deleteDesc: '此操作不可撤销，该用户的所有数据将被永久删除。',
    btnConfirmDelete: '确认删除',
  },
  en: {
    title: 'User Management', subtitle: 'Manage system user accounts, role assignments, and access rights',
    btnExport: 'Export', btnNew: 'New User',
    statAll: 'Total', statActive: 'Active', statInactive: 'Inactive', statLocked: 'Locked', statPending: 'Pending',
    searchPlaceholder: 'Search name, username, email…',
    filterAllStatus: 'All Status', filterAllRole: 'All Roles', filterAllDept: 'All Depts',
    btnReset: 'Reset',
    colUser: 'User', colContact: 'Email / Phone', colDeptRole: 'Dept / Roles', colAuth: 'Auth', colStatus: 'Status', colLastLogin: 'Last Login',
    neverLogin: 'Never', noResults: 'No matching users found',
    footerCount: (n: number, total: number) => n === total ? `${n} users` : `${n} users (filtered from ${total})`,
    manageRoles: 'Manage Roles & Permissions',
    formEditTitle: 'Edit User', formNewTitle: 'New User',
    formEditSub: (name: string) => `Update account details for ${name}`,
    formNewSub: 'Create a new system user account',
    labelName: 'Full Name', labelUsername: 'Username', labelEmail: 'Email', labelPhone: 'Phone',
    labelDept: 'Department', labelAuth: 'Auth Method', labelPassword: 'Initial Password', labelRoles: 'Role Assignment',
    labelStatus: 'Account Status', labelRemark: 'Remarks',
    phName: 'Enter full name', phUsername: 'Login username', phEmail: 'work@example.com',
    phPhone: '+1-xxx or 138-xxxx', phSelectDept: 'Select department',
    phPassword: 'Min 8 chars, letters & numbers', phRemark: 'Optional notes',
    authLocal: 'Local Account', authSSO: 'SSO (Integrated)', authLDAP: 'LDAP',
    statusActive: 'Active', statusInactive: 'Inactive', statusLocked: 'Locked',
    errName: 'Please enter a name', errUsername: 'Please enter a username', errEmail: 'Please enter an email',
    errEmailFmt: 'Invalid email format', errDept: 'Please select a department', errRoles: 'Please assign at least one role',
    errPassword: 'Please set an initial password',
    btnCancel: 'Cancel', btnSave: 'Save Changes', btnCreate: 'Create User',
    resetTitle: 'Reset Password', resetDone: 'Password Reset',
    resetDoneDesc: 'The new password is active. Please notify the user to log in and change it.',
    labelNewPass: 'New Password', labelConfirmPass: 'Confirm Password',
    phNewPass: 'Min 8 chars, letters & numbers', phConfirmPass: 'Re-enter new password',
    errMismatch: 'Passwords do not match', btnDone: 'Done', btnConfirmReset: 'Confirm Reset',
    menuEdit: 'Edit User', menuResetPass: 'Reset Password', menuDisable: 'Disable Account', menuEnable: 'Enable Account', menuDelete: 'Delete User',
    deleteTitle: 'Delete this user?', deleteDesc: 'This action cannot be undone. All data for this user will be permanently deleted.',
    btnConfirmDelete: 'Delete User',
  },
} as const

type Tx = typeof T['zh'] | typeof T['en']

// ─── Types ──────────────────────────────────────────────────────────────────

type UserStatus = 'active' | 'inactive' | 'locked' | 'pending'
type AuthType = 'local' | 'sso' | 'ldap'

interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  department: string
  roleIds: string[]
  status: UserStatus
  authType: AuthType
  lastLogin: string | null
  createdAt: string
  createdBy: string
  avatar?: string
  remark?: string
}

interface Role { id: string; name: string; color: string }

// ─── Mock data ───────────────────────────────────────────────────────────────

const ROLES: Role[] = [
  { id: 'r1', name: '超级管理员', color: C.purple },
  { id: 'r2', name: '运营管理员', color: C.blue },
  { id: 'r3', name: '渠道经理', color: C.green },
  { id: 'r4', name: '财务专员', color: C.amber },
  { id: 'r5', name: '只读用户', color: C.muted },
]

const INIT_USERS: User[] = [
  { id: 'u1', name: '张国强', username: 'admin', email: 'zhang.guoqiang@insure-os.com', phone: '138-0000-0001', department: '技术部', roleIds: ['r1'], status: 'active', authType: 'local', lastLogin: '2025-09-05 09:32', createdAt: '2024-01-01', createdBy: 'system', remark: '系统超级管理员' },
  { id: 'u2', name: '李晓燕', username: 'li.xiaoyan', email: 'li.xiaoyan@insure-os.com', phone: '138-0000-0002', department: '运营部', roleIds: ['r2'], status: 'active', authType: 'local', lastLogin: '2025-09-04 16:11', createdAt: '2024-02-15', createdBy: 'u1' },
  { id: 'u3', name: 'Michael Chen', username: 'm.chen', email: 'm.chen@pacific-partner.com', phone: '+1-415-000-0003', department: '渠道部', roleIds: ['r3'], status: 'active', authType: 'sso', lastLogin: '2025-09-05 08:04', createdAt: '2024-03-10', createdBy: 'u2' },
  { id: 'u4', name: '王丽华', username: 'wang.lihua', email: 'wang.lihua@insure-os.com', phone: '138-0000-0004', department: '财务部', roleIds: ['r4'], status: 'active', authType: 'local', lastLogin: '2025-09-03 14:55', createdAt: '2024-04-01', createdBy: 'u1' },
  { id: 'u5', name: 'Sarah Thompson', username: 's.thompson', email: 's.thompson@broker.us', phone: '+1-212-000-0005', department: '渠道部', roleIds: ['r3', 'r5'], status: 'inactive', authType: 'sso', lastLogin: '2025-08-20 10:22', createdAt: '2024-05-08', createdBy: 'u2' },
  { id: 'u6', name: '陈志远', username: 'chen.zhiyuan', email: 'chen.zhiyuan@insure-os.com', phone: '138-0000-0006', department: '技术部', roleIds: ['r2', 'r3'], status: 'locked', authType: 'local', lastLogin: '2025-08-01 11:30', createdAt: '2024-06-20', createdBy: 'u1', remark: '多次登录失败已锁定' },
  { id: 'u7', name: '刘思远', username: 'liu.siyuan', email: 'liu.siyuan@insure-os.com', phone: '138-0000-0007', department: '运营部', roleIds: ['r5'], status: 'pending', authType: 'local', lastLogin: null, createdAt: '2025-09-04', createdBy: 'u2', remark: '等待邮箱验证' },
  { id: 'u8', name: 'James Wong', username: 'j.wong', email: 'j.wong@agency.hk', phone: '+852-0000-0008', department: '渠道部', roleIds: ['r3'], status: 'active', authType: 'ldap', lastLogin: '2025-09-05 07:48', createdAt: '2024-07-15', createdBy: 'u1' },
]

const DEPARTMENTS = ['技术部', '运营部', '财务部', '渠道部', '合规部', '市场部']

// ─── Status config ───────────────────────────────────────────────────────────

const statusCfg = (tx: Tx): Record<UserStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> => ({
  active:   { label: tx.statActive,   color: C.green,  bg: C.greenBg,  border: C.greenBorder,  icon: <UserCheck size={11} /> },
  inactive: { label: tx.statInactive, color: C.muted,  bg: 'rgba(113,119,134,0.08)', border: 'rgba(113,119,134,0.2)', icon: <UserX size={11} /> },
  locked:   { label: tx.statLocked,   color: C.red,    bg: C.redBg,    border: C.redBorder,    icon: <Lock size={11} /> },
  pending:  { label: tx.statPending,  color: C.amber,  bg: C.amberBg,  border: C.amberBorder,  icon: <Clock size={11} /> },
})

const authCfg = (tx: Tx): Record<AuthType, { label: string; color: string; bg: string }> => ({
  local: { label: tx.authLocal, color: C.blue,   bg: C.blueBg },
  sso:   { label: 'SSO',        color: C.purple, bg: C.purpleBg },
  ldap:  { label: 'LDAP',       color: C.green,  bg: C.greenBg },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avatarColor = (name: string) => {
  const colors = ['#0058BC', '#059669', '#7c3aed', '#d97706', '#0891b2', '#be185d']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: 'white', flexShrink: 0, letterSpacing: '-0.5px' }}>
      {name.slice(0, 1)}
    </div>
  )
}

function StatusBadge({ status, tx }: { status: UserStatus; tx: Tx }) {
  const s = statusCfg(tx)[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 7px' }}>
      {s.icon}{s.label}
    </span>
  )
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: role.color, background: `${role.color}14`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      <Shield size={10} />{role.name}
    </span>
  )
}

// ─── User Form Modal ──────────────────────────────────────────────────────────

function UserFormModal({
  user, roles, tx, onSave, onClose,
}: {
  user: User | null
  roles: Role[]
  tx: Tx
  onSave: (u: User) => void
  onClose: () => void
}) {
  const isEdit = !!user
  const [form, setForm] = useState<Omit<User, 'id' | 'createdAt' | 'createdBy' | 'lastLogin'>>({
    name: user?.name ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
    roleIds: user?.roleIds ?? [],
    status: user?.status ?? 'active',
    authType: user?.authType ?? 'local',
    remark: user?.remark ?? '',
  })
  const [showPass, setShowPass] = useState(false)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = tx.errName
    if (!form.username.trim()) e.username = tx.errUsername
    if (!form.email.trim()) e.email = tx.errEmail
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = tx.errEmailFmt
    if (!form.department) e.department = tx.errDept
    if (form.roleIds.length === 0) e.roleIds = tx.errRoles
    if (!isEdit && form.authType === 'local' && !password) e.password = tx.errPassword
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().slice(0, 10)
    onSave({
      id: user?.id ?? `u${Date.now()}`,
      ...form,
      createdAt: user?.createdAt ?? now,
      createdBy: user?.createdBy ?? 'current-user',
      lastLogin: user?.lastLogin ?? null,
    })
  }

  const toggleRole = (id: string) => {
    set('roleIds', form.roleIds.includes(id) ? form.roleIds.filter(r => r !== id) : [...form.roleIds, id])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.96)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,58,152,0.18)', border: '1px solid rgba(193,198,215,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={17} color={C.blue} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{isEdit ? tx.formEditTitle : tx.formNewTitle}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{isEdit ? tx.formEditSub(user!.name) : tx.formNewSub}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <Field label={tx.labelName} required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={tx.phName} style={inputStyle(!!errors.name)} />
            </Field>
            <Field label={tx.labelUsername} required error={errors.username}>
              <input value={form.username} onChange={e => set('username', e.target.value)} placeholder={tx.phUsername} disabled={isEdit} style={{ ...inputStyle(!!errors.username), opacity: isEdit ? 0.6 : 1 }} />
            </Field>
            <Field label={tx.labelEmail} required error={errors.email}>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder={tx.phEmail} style={inputStyle(!!errors.email)} />
            </Field>
            <Field label={tx.labelPhone} error={errors.phone}>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={tx.phPhone} style={inputStyle(false)} />
            </Field>
            <Field label={tx.labelDept} required error={errors.department}>
              <select value={form.department} onChange={e => set('department', e.target.value)} style={{ ...inputStyle(!!errors.department), appearance: 'none' }}>
                <option value="">{tx.phSelectDept}</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label={tx.labelAuth}>
              <select value={form.authType} onChange={e => set('authType', e.target.value as AuthType)} style={{ ...inputStyle(false), appearance: 'none' }}>
                <option value="local">{tx.authLocal}</option>
                <option value="sso">{tx.authSSO}</option>
                <option value="ldap">{tx.authLDAP}</option>
              </select>
            </Field>
          </div>

          {/* Password — only for new local users */}
          {!isEdit && form.authType === 'local' && (
            <div style={{ marginTop: 14 }}>
              <Field label={tx.labelPassword} required error={errors.password}>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(er => { const n = { ...er }; delete n.password; return n }) }} placeholder={tx.phPassword} style={{ ...inputStyle(!!errors.password), paddingRight: 38 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>
          )}

          {/* Roles */}
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 8 }}>
              {tx.labelRoles} <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map(r => {
                const active = form.roleIds.includes(r.id)
                return (
                  <button key={r.id} type="button" onClick={() => toggleRole(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${active ? r.color : C.border}`, background: active ? `${r.color}12` : 'transparent', color: active ? r.color : C.muted }}
                  >
                    <Shield size={11} />{r.name}
                    {active && <CheckCircle2 size={11} />}
                  </button>
                )
              })}
            </div>
            {errors.roleIds && <p style={{ fontSize: 11, color: C.red, marginTop: 5 }}>{errors.roleIds}</p>}
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 8 }}>{tx.labelStatus}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['active', 'inactive', 'locked'] as UserStatus[]).map(s => {
                  const cfg = statusCfg(tx)[s]
                  const active = form.status === s
                  return (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${active ? cfg.color : C.border}`, background: active ? cfg.bg : 'transparent', color: active ? cfg.color : C.muted }}
                    >
                      {cfg.icon}{cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Remark */}
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 6 }}>{tx.labelRemark}</label>
            <textarea value={form.remark} onChange={e => set('remark', e.target.value)} placeholder={tx.phRemark} rows={2} style={{ ...inputStyle(false), resize: 'none', width: '100%' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>{tx.btnCancel}</button>
          <button onClick={handleSave} style={btnPrimary}>
            <Save size={13} />{isEdit ? tx.btnSave : tx.btnCreate}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({ user, tx, onClose }: { user: User; tx: Tx; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const mismatch = confirm && password !== confirm

  const handleReset = () => {
    if (!password || mismatch) return
    setDone(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 420, background: 'rgba(255,255,255,0.96)', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,58,152,0.18)', border: '1px solid rgba(193,198,215,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={16} color={C.amber} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tx.resetTitle}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{user.name} · {user.username}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}><X size={17} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <CheckCircle2 size={40} color={C.green} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{tx.resetDone}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{tx.resetDoneDesc}</p>
              <button onClick={onClose} style={{ ...btnPrimary, marginTop: 16 }}>{tx.btnDone}</button>
            </div>
          ) : (
            <>
              <Field label={tx.labelNewPass} required>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={tx.phNewPass} style={{ ...inputStyle(!password && false), paddingRight: 38 }} />
                  <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <div style={{ marginTop: 12 }}>
                <Field label={tx.labelConfirmPass} required error={mismatch ? tx.errMismatch : undefined}>
                  <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={tx.phConfirmPass} style={inputStyle(!!mismatch)} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={btnSecondary}>{tx.btnCancel}</button>
                <button onClick={handleReset} disabled={!password || !!mismatch} style={{ ...btnPrimary, opacity: !password || !!mismatch ? 0.5 : 1, cursor: !password || !!mismatch ? 'not-allowed' : 'pointer' }}>
                  <Key size={13} />{tx.btnConfirmReset}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Row action menu ──────────────────────────────────────────────────────────

function ActionMenu({ user, tx, onEdit, onResetPass, onToggleStatus, onDelete, onClose }: {
  user: User; tx: Tx; onEdit: () => void; onResetPass: () => void
  onToggleStatus: () => void; onDelete: () => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items: { icon: React.ReactNode; label: string; action: () => void; danger?: boolean }[] = [
    { icon: <Edit2 size={13} />, label: tx.menuEdit, action: onEdit },
    { icon: <Key size={13} />, label: tx.menuResetPass, action: onResetPass },
    { icon: user.status === 'active' ? <Lock size={13} /> : <Unlock size={13} />, label: user.status === 'active' ? tx.menuDisable : tx.menuEnable, action: onToggleStatus },
    { icon: <Trash2 size={13} />, label: tx.menuDelete, action: onDelete, danger: true },
  ]

  return (
    <div ref={ref} style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 100, background: 'rgba(255,255,255,0.97)', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,58,152,0.12)', padding: '4px', minWidth: 150 }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.action(); onClose() }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 12.5, fontWeight: 500, color: item.danger ? C.red : C.soft, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7, textAlign: 'left', transition: 'background 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = item.danger ? C.redBg : C.blueBg }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function UserManagementView({ navigateTo }: Props) {
  const { lang } = useLang()
  const tx = T[lang === 'en' ? 'en' : 'zh']
  const [users, setUsers] = useState<User[]>(INIT_USERS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [formUser, setFormUser] = useState<User | 'new' | undefined>()
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    const matchRole = filterRole === 'all' || u.roleIds.includes(filterRole)
    const matchDept = filterDept === 'all' || u.department === filterDept
    return matchSearch && matchStatus && matchRole && matchDept
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    locked: users.filter(u => u.status === 'locked').length,
    pending: users.filter(u => u.status === 'pending').length,
  }

  const handleSave = (u: User) => {
    setUsers(prev => formUser === 'new' ? [...prev, u] : prev.map(p => p.id === u.id ? u : p))
    setFormUser(undefined)
  }

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleteConfirm(null)
  }

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
  }

  const getRoles = (ids: string[]) => ROLES.filter(r => ids.includes(r.id))

  const glass: React.CSSProperties = { background: C.surfaceHigh, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${C.border}`, borderRadius: 14 }

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: '-0.3px' }}>{tx.title}</h1>
          <p style={{ fontSize: 13, color: C.muted }}>{tx.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnSecondary}><Download size={13} />{tx.btnExport}</button>
          <button onClick={() => setFormUser('new')} style={btnPrimary}><Plus size={14} />{tx.btnNew}</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: tx.statAll, value: stats.total, color: C.blue, bg: C.blueBg },
          { label: tx.statActive, value: stats.active, color: C.green, bg: C.greenBg },
          { label: tx.statInactive, value: stats.inactive, color: C.muted, bg: 'rgba(113,119,134,0.08)' },
          { label: tx.statLocked, value: stats.locked, color: C.red, bg: C.redBg },
          { label: tx.statPending, value: stats.pending, color: C.amber, bg: C.amberBg },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ ...glass, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} style={{ width: '100%', padding: '7px 10px 7px 32px', fontSize: 13, background: 'rgba(241,243,254,0.7)', border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', color: C.text, boxSizing: 'border-box' }} />
        </div>

        <FilterSelect label={tx.colStatus} value={filterStatus} onChange={v => setFilterStatus(v as UserStatus | 'all')}
          options={[{ value: 'all', label: tx.filterAllStatus }, ...(['active', 'inactive', 'locked', 'pending'] as UserStatus[]).map(s => ({ value: s, label: statusCfg(tx)[s].label }))]}
        />
        <FilterSelect label={tx.labelRoles} value={filterRole} onChange={setFilterRole}
          options={[{ value: 'all', label: tx.filterAllRole }, ...ROLES.map(r => ({ value: r.id, label: r.name }))]}
        />
        <FilterSelect label={tx.labelDept} value={filterDept} onChange={setFilterDept}
          options={[{ value: 'all', label: tx.filterAllDept }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]}
        />

        <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRole('all'); setFilterDept('all') }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 12, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer' }}>
          <RefreshCw size={12} />{tx.btnReset}
        </button>
      </div>

      {/* Table */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 1.4fr 1fr 1fr 1fr 80px', gap: 0, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(241,243,254,0.6)' }}>
          {[tx.colUser, tx.colContact, tx.colDeptRole, tx.colAuth, tx.colStatus, tx.colLastLogin, ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', paddingRight: 8 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: C.faint, fontSize: 13 }}>
            <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
            <p>{tx.noResults}</p>
          </div>
        ) : (
          filtered.map((u, idx) => (
            <div key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 1.4fr 1fr 1fr 1fr 80px', gap: 0, padding: '12px 16px', borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', transition: 'background 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,88,188,0.025)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* User */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8 }}>
                <Avatar name={u.name} size={34} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{u.name}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{u.username}</div>
                </div>
              </div>

              {/* Contact */}
              <div style={{ paddingRight: 8 }}>
                <div style={{ fontSize: 12.5, color: C.soft, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Mail size={11} color={C.faint} />{u.email}
                </div>
                {u.phone && <div style={{ fontSize: 11.5, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={11} color={C.faint} />{u.phone}
                </div>}
              </div>

              {/* Dept + roles */}
              <div style={{ paddingRight: 8 }}>
                <div style={{ fontSize: 12, color: C.soft, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                  <Building2 size={11} color={C.faint} />{u.department}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {getRoles(u.roleIds).map(r => <RoleBadge key={r.id} role={r} />)}
                </div>
              </div>

              {/* Auth */}
              <div style={{ paddingRight: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 500, color: authCfg(tx)[u.authType].color, background: authCfg(tx)[u.authType].bg, borderRadius: 5, padding: '2px 7px' }}>
                  {authCfg(tx)[u.authType].label}
                </span>
              </div>

              {/* Status */}
              <div style={{ paddingRight: 8 }}>
                <StatusBadge status={u.status} tx={tx} />
              </div>

              {/* Last login */}
              <div style={{ paddingRight: 8 }}>
                {u.lastLogin ? (
                  <div style={{ fontSize: 11.5, color: C.muted }}>
                    <div>{u.lastLogin.slice(0, 10)}</div>
                    <div style={{ color: C.faint }}>{u.lastLogin.slice(11)}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: C.faint }}>{tx.neverLogin}</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setMenuUserId(menuUserId === u.id ? null : u.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: menuUserId === u.id ? C.blueBg : 'none', border: 'none', cursor: 'pointer', color: C.muted, transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (menuUserId !== u.id) e.currentTarget.style.background = 'rgba(0,88,188,0.06)' }}
                  onMouseLeave={e => { if (menuUserId !== u.id) e.currentTarget.style.background = 'none' }}
                >
                  <MoreHorizontal size={15} />
                </button>
                {menuUserId === u.id && (
                  <ActionMenu
                    user={u}
                    tx={tx}
                    onEdit={() => { setFormUser(u); setMenuUserId(null) }}
                    onResetPass={() => { setResetUser(u); setMenuUserId(null) }}
                    onToggleStatus={() => { handleToggleStatus(u.id); setMenuUserId(null) }}
                    onDelete={() => { setDeleteConfirm(u.id); setMenuUserId(null) }}
                    onClose={() => setMenuUserId(null)}
                  />
                )}
              </div>
            </div>
          ))
        )}

        {/* Footer count */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, background: 'rgba(241,243,254,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: C.muted }}>{tx.footerCount(filtered.length, users.length)}</span>
          <button onClick={() => navigateTo('permission')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Shield size={12} />{tx.manageRoles}
          </button>
        </div>
      </div>

      {/* Modals */}
      {formUser !== undefined && (
        <UserFormModal
          user={formUser === 'new' ? null : formUser}
          roles={ROLES}
          tx={tx}
          onSave={handleSave}
          onClose={() => setFormUser(undefined)}
        />
      )}

      {resetUser && <ResetPasswordModal user={resetUser} tx={tx} onClose={() => setResetUser(null)} />}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 380, background: 'rgba(255,255,255,0.97)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,58,152,0.18)', border: '1px solid rgba(193,198,215,0.4)', padding: '24px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={17} color={C.red} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{tx.deleteTitle}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{tx.deleteDesc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={btnSecondary}>{tx.btnCancel}</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: 'white', background: C.red, border: 'none', borderRadius: 9, cursor: 'pointer' }}>
                <Trash2 size={13} />{tx.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', padding: '6px 28px 6px 10px', fontSize: 12.5, color: value === 'all' ? C.muted : C.soft, background: value === 'all' ? 'transparent' : C.blueBg, border: `1px solid ${value === 'all' ? C.border : C.blueBorder}`, borderRadius: 8, cursor: 'pointer', outline: 'none' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} color={C.muted} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
    </div>
  )
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', padding: '8px 12px', fontSize: 13, color: C.text,
  background: 'rgba(241,243,254,0.7)', border: `1px solid ${hasError ? C.red : C.border}`,
  borderRadius: 9, outline: 'none', boxSizing: 'border-box',
})

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600,
  color: 'white', background: 'linear-gradient(135deg, #0058BC, #0070EB)',
  border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,88,188,0.28)',
}
const btnSecondary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 13, fontWeight: 500,
  color: C.soft, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 9, cursor: 'pointer',
}
