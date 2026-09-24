import { useState, useRef, useEffect } from 'react'
import {
  Building2, Plus, ChevronRight, ChevronDown, Users, Edit2, Trash2,
  MoreHorizontal, Search, X, Save, AlertCircle, UserCheck, Phone,
  Mail, Calendar, Layers, MoveRight, Shield, ArrowRight,
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
  green: '#059669', greenBg: 'rgba(5,150,105,0.08)',
  red: '#BA1A1A', redBg: 'rgba(186,26,26,0.07)',
  amber: '#d97706', amberBg: 'rgba(217,119,6,0.08)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)',
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Department {
  id: string
  name: string
  nameEn: string
  parentId: string | null
  headName: string
  headTitle: string
  headEmail: string
  phone: string
  location: string
  desc: string
  createdAt: string
  memberCount: number
  color: string
}

interface Member {
  id: string
  name: string
  username: string
  role: string
  email: string
  status: 'active' | 'inactive' | 'locked'
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const INIT_DEPTS: Department[] = [
  { id: 'd1', name: '总公司', nameEn: 'Headquarters', parentId: null, headName: '张国强', headTitle: 'CEO', headEmail: 'zhang.guoqiang@insure-os.com', phone: '+1-415-000-0001', location: 'San Francisco, CA', desc: '公司最高管理机构，负责全局战略与决策。', createdAt: '2024-01-01', memberCount: 3, color: C.blue },
  { id: 'd2', name: '技术部', nameEn: 'Engineering', parentId: 'd1', headName: '陈志远', headTitle: 'CTO', headEmail: 'chen.zhiyuan@insure-os.com', phone: '+1-415-000-0002', location: 'San Francisco, CA', desc: '负责平台研发、系统架构与技术基础设施。', createdAt: '2024-01-15', memberCount: 12, color: C.purple },
  { id: 'd3', name: '运营部', nameEn: 'Operations', parentId: 'd1', headName: '李晓燕', headTitle: 'COO', headEmail: 'li.xiaoyan@insure-os.com', phone: '+1-415-000-0003', location: 'Los Angeles, CA', desc: '负责日常运营管理、流程优化及跨部门协调。', createdAt: '2024-02-01', memberCount: 8, color: C.green },
  { id: 'd4', name: '财务部', nameEn: 'Finance', parentId: 'd1', headName: '王丽华', headTitle: 'CFO', headEmail: 'wang.lihua@insure-os.com', phone: '+1-415-000-0004', location: 'New York, NY', desc: '负责财务规划、结算管理与合规报告。', createdAt: '2024-02-15', memberCount: 6, color: C.amber },
  { id: 'd5', name: '渠道部', nameEn: 'Channel', parentId: 'd1', headName: 'Michael Chen', headTitle: 'VP Channel', headEmail: 'm.chen@insure-os.com', phone: '+1-415-000-0005', location: 'Seattle, WA', desc: '负责渠道伙伴管理、拓展与培训。', createdAt: '2024-03-01', memberCount: 18, color: '#0891b2' },
  { id: 'd6', name: '合规部', nameEn: 'Compliance', parentId: 'd1', headName: '刘思远', headTitle: 'Chief Compliance Officer', headEmail: 'liu.siyuan@insure-os.com', phone: '+1-415-000-0006', location: 'New York, NY', desc: '负责监管合规、风险控制及法律事务。', createdAt: '2024-03-15', memberCount: 5, color: '#be185d' },
  { id: 'd7', name: '市场部', nameEn: 'Marketing', parentId: 'd1', headName: 'Sarah Thompson', headTitle: 'VP Marketing', headEmail: 's.thompson@insure-os.com', phone: '+1-415-000-0007', location: 'Los Angeles, CA', desc: '负责品牌推广、市场策略及客户增长。', createdAt: '2024-04-01', memberCount: 7, color: '#d97706' },
  { id: 'd8', name: '前端研发组', nameEn: 'Frontend', parentId: 'd2', headName: '张文博', headTitle: 'Frontend Lead', headEmail: 'zhang.wenbo@insure-os.com', phone: '+1-415-000-0008', location: 'San Francisco, CA', desc: '负责 Web 与移动端产品研发。', createdAt: '2024-04-15', memberCount: 5, color: C.purple },
  { id: 'd9', name: '后端研发组', nameEn: 'Backend', parentId: 'd2', headName: '林浩然', headTitle: 'Backend Lead', headEmail: 'lin.haoran@insure-os.com', phone: '+1-415-000-0009', location: 'San Francisco, CA', desc: '负责服务端架构与 API 开发。', createdAt: '2024-04-15', memberCount: 4, color: C.purple },
  { id: 'd10', name: '运维与安全组', nameEn: 'DevOps & Security', parentId: 'd2', headName: '赵明宇', headTitle: 'DevOps Lead', headEmail: 'zhao.mingyu@insure-os.com', phone: '+1-415-000-0010', location: 'San Francisco, CA', desc: '负责基础设施、部署与信息安全。', createdAt: '2024-05-01', memberCount: 3, color: C.purple },
  { id: 'd11', name: '渠道拓展组', nameEn: 'Channel Expansion', parentId: 'd5', headName: 'James Wong', headTitle: 'Channel Manager', headEmail: 'j.wong@insure-os.com', phone: '+852-000-0011', location: 'Hong Kong', desc: '负责亚太区渠道拓展。', createdAt: '2024-05-15', memberCount: 8, color: '#0891b2' },
  { id: 'd12', name: '渠道培训组', nameEn: 'Channel Training', parentId: 'd5', headName: '郭晓峰', headTitle: 'Training Manager', headEmail: 'guo.xiaofeng@insure-os.com', phone: '+1-415-000-0012', location: 'Seattle, WA', desc: '负责渠道伙伴培训与认证。', createdAt: '2024-06-01', memberCount: 4, color: '#0891b2' },
]

const DEPT_MEMBERS: Record<string, Member[]> = {
  d2: [
    { id: 'u1', name: '陈志远', username: 'chen.zhiyuan', role: 'CTO', email: 'chen.zhiyuan@insure-os.com', status: 'locked' },
    { id: 'u8', name: 'James Wong', username: 'j.wong', role: '渠道经理', email: 'j.wong@insure-os.com', status: 'active' },
  ],
  d3: [
    { id: 'u2', name: '李晓燕', username: 'li.xiaoyan', role: '运营管理员', email: 'li.xiaoyan@insure-os.com', status: 'active' },
    { id: 'u7', name: '刘思远', username: 'liu.siyuan', role: '只读用户', email: 'liu.siyuan@insure-os.com', status: 'active' },
  ],
  d4: [
    { id: 'u4', name: '王丽华', username: 'wang.lihua', role: '财务专员', email: 'wang.lihua@insure-os.com', status: 'active' },
  ],
  d5: [
    { id: 'u3', name: 'Michael Chen', username: 'm.chen', role: '渠道经理', email: 'm.chen@insure-os.com', status: 'active' },
    { id: 'u5', name: 'Sarah Thompson', username: 's.thompson', role: '渠道经理', email: 's.thompson@insure-os.com', status: 'inactive' },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getChildren(depts: Department[], parentId: string | null) {
  return depts.filter(d => d.parentId === parentId)
}

function getAllDescendantIds(depts: Department[], id: string): string[] {
  const children = depts.filter(d => d.parentId === id)
  return children.flatMap(c => [c.id, ...getAllDescendantIds(depts, c.id)])
}

const avatarColor = (name: string) => {
  const colors = [C.blue, C.green, C.purple, C.amber, '#0891b2', '#be185d']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

const glass: React.CSSProperties = {
  background: C.surfaceHigh,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${C.border}`,
  borderRadius: 14,
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function DeptTreeNode({
  dept, depts, depth, selected, onSelect, onEdit, onDelete, onAdd,
}: {
  dept: Department
  depts: Department[]
  depth: number
  selected: string | null
  onSelect: (id: string) => void
  onEdit: (d: Department) => void
  onDelete: (id: string) => void
  onAdd: (parentId: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const children = getChildren(depts, dept.id)
  const hasChildren = children.length > 0
  const isSelected = selected === dept.id

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div>
      <div
        onClick={() => onSelect(dept.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `7px 12px 7px ${12 + depth * 20}px`,
          borderRadius: 8, cursor: 'pointer', marginBottom: 1,
          background: isSelected ? `${dept.color}12` : 'transparent',
          border: isSelected ? `1px solid ${dept.color}30` : '1px solid transparent',
          transition: 'all 0.14s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,88,188,0.04)' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); if (hasChildren) setExpanded(p => !p) }}
          style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: hasChildren ? 'pointer' : 'default', color: C.muted, flexShrink: 0, borderRadius: 4, padding: 0 }}
        >
          {hasChildren
            ? (expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)
            : <span style={{ width: 13 }} />}
        </button>

        {/* Icon */}
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${dept.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={13} color={dept.color} />
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? dept.color : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dept.name}
          </div>
          <div style={{ fontSize: 10.5, color: C.faint }}>{dept.nameEn}</div>
        </div>

        {/* Member count */}
        <span style={{ fontSize: 11, color: C.muted, background: 'rgba(113,119,134,0.08)', borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>
          {dept.memberCount}
        </span>

        {/* Action menu */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: menuOpen ? C.blueBg : 'none', border: 'none', cursor: 'pointer', borderRadius: 5, color: C.muted }}
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 2, zIndex: 50, background: 'rgba(255,255,255,0.97)', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,58,152,0.12)', padding: 4, minWidth: 148 }}>
              {[
                { icon: <Plus size={12} />, label: '添加子部门', action: () => onAdd(dept.id) },
                { icon: <Edit2 size={12} />, label: '编辑部门', action: () => onEdit(dept) },
                { icon: <Trash2 size={12} />, label: '删除部门', action: () => onDelete(dept.id), danger: true },
              ].map((item, i) => (
                <button key={i} onClick={() => { item.action(); setMenuOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', fontSize: 12.5, fontWeight: 500, color: item.danger ? C.red : C.soft, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7, textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? C.redBg : C.blueBg }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {children.map(child => (
            <DeptTreeNode key={child.id} dept={child} depts={depts} depth={depth + 1}
              selected={selected} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DeptDetail({
  dept, depts, onEdit, onAddChild, navigateTo,
}: {
  dept: Department
  depts: Department[]
  onEdit: () => void
  onAddChild: () => void
  navigateTo: (v: ViewId) => void
}) {
  const children = getChildren(depts, dept.id)
  const members = DEPT_MEMBERS[dept.id] ?? []
  const parent = depts.find(d => d.id === dept.parentId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header card */}
      <div style={{ ...glass, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${dept.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={24} color={dept.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.3px' }}>{dept.name}</h2>
              <span style={{ fontSize: 11, color: dept.color, background: `${dept.color}12`, padding: '2px 8px', borderRadius: 5, fontWeight: 500 }}>{dept.nameEn}</span>
            </div>
            {parent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.muted, marginBottom: 6 }}>
                <Layers size={11} />
                {parent.name}
                <ChevronRight size={10} />
                <span style={{ color: dept.color, fontWeight: 500 }}>{dept.name}</span>
              </div>
            )}
            <p style={{ fontSize: 13, color: C.soft, lineHeight: 1.6 }}>{dept.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={onAddChild} style={{ ...btnSecondary, fontSize: 12 }}><Plus size={12} />添加子部门</button>
            <button onClick={onEdit} style={{ ...btnPrimary, fontSize: 12 }}><Edit2 size={12} />编辑</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {[
            { icon: <Users size={14} />, label: '成员数', value: `${dept.memberCount} 人` },
            { icon: <Layers size={14} />, label: '子部门', value: `${children.length} 个` },
            { icon: <Calendar size={14} />, label: '创建时间', value: dept.createdAt },
            { icon: <Shield size={14} />, label: '负责人', value: dept.headName },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Head info */}
        <div style={{ ...glass, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>负责人信息</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor(dept.headName)}, ${dept.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {dept.headName.slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{dept.headName}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{dept.headTitle}</div>
            </div>
          </div>
          {[
            { icon: <Mail size={12} />, value: dept.headEmail },
            { icon: <Phone size={12} />, value: dept.phone },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.soft, marginBottom: 6 }}>
              <span style={{ color: C.faint }}>{item.icon}</span>{item.value}
            </div>
          ))}
        </div>

        {/* Sub-depts */}
        <div style={{ ...glass, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>子部门</div>
            {children.length > 0 && (
              <span style={{ fontSize: 11, color: C.muted }}>{children.length} 个</span>
            )}
          </div>
          {children.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.faint, fontSize: 12 }}>
              <Building2 size={24} style={{ margin: '0 auto 6px', opacity: 0.3 }} />
              <p>暂无子部门</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {children.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: `${c.color}08`, border: `1px solid ${c.color}20` }}>
                  <Building2 size={12} color={c.color} />
                  <span style={{ fontSize: 13, color: C.soft, fontWeight: 500, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{c.memberCount} 人</span>
                  <ArrowRight size={11} color={C.faint} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Members */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>部门成员</div>
          <button onClick={() => navigateTo('user-management')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Users size={12} />管理用户
          </button>
        </div>
        {members.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: C.faint, fontSize: 13 }}>
            <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p>暂无成员数据</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 80px', padding: '8px 20px', background: 'rgba(241,243,254,0.6)', borderBottom: `1px solid ${C.border}` }}>
              {['姓名 / 用户名', '角色', '邮箱', '状态'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
              ))}
            </div>
            {members.map((m, i) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 80px', padding: '11px 20px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor(m.name)}, ${avatarColor(m.name)}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{m.name.slice(0, 1)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>{m.username}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: C.soft }}>{m.role}</div>
                <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} color={C.faint} />{m.email}</div>
                <MemberStatus status={m.status} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function MemberStatus({ status }: { status: Member['status'] }) {
  const cfg = {
    active:   { label: '正常',   color: C.green,  bg: 'rgba(5,150,105,0.08)', icon: <UserCheck size={10} /> },
    inactive: { label: '停用',   color: C.muted,  bg: 'rgba(113,119,134,0.08)', icon: null },
    locked:   { label: '锁定',   color: C.red,    bg: C.redBg, icon: null },
  }[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: cfg.color, background: cfg.bg, borderRadius: 5, padding: '2px 7px' }}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function DeptFormModal({
  dept, depts, defaultParentId, onSave, onClose,
}: {
  dept: Department | null
  depts: Department[]
  defaultParentId?: string
  onSave: (d: Department) => void
  onClose: () => void
}) {
  const isEdit = !!dept
  const colorOptions = [C.blue, C.purple, C.green, C.amber, '#0891b2', '#be185d', '#dc2626', '#374151']

  const [form, setForm] = useState({
    name: dept?.name ?? '',
    nameEn: dept?.nameEn ?? '',
    parentId: dept?.parentId ?? defaultParentId ?? null,
    headName: dept?.headName ?? '',
    headTitle: dept?.headTitle ?? '',
    headEmail: dept?.headEmail ?? '',
    phone: dept?.phone ?? '',
    location: dept?.location ?? '',
    desc: dept?.desc ?? '',
    color: dept?.color ?? C.blue,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n })
  }

  // Exclude self and descendants from parent selector
  const forbiddenIds = dept ? [dept.id, ...getAllDescendantIds(depts, dept.id)] : []
  const parentOptions = depts.filter(d => !forbiddenIds.includes(d.id))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '请输入部门名称'
    if (!form.headName.trim()) e.headName = '请输入负责人姓名'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      id: dept?.id ?? `d${Date.now()}`,
      ...form,
      memberCount: dept?.memberCount ?? 0,
      createdAt: dept?.createdAt ?? new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.97)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,58,152,0.18)', border: `1px solid ${C.border}` }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${form.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={17} color={form.color} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{isEdit ? '编辑部门' : '新增部门'}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{isEdit ? `修改 ${dept!.name} 的信息` : '在组织架构中创建新部门'}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Color picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 8 }}>部门颜色</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {colorOptions.map(col => (
                <button key={col} onClick={() => set('color', col)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: form.color === col ? '2px solid white' : '2px solid transparent', outline: form.color === col ? `2px solid ${col}` : 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <Field label="部门名称" required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="如：技术部" style={iStyle(!!errors.name)} />
            </Field>
            <Field label="英文名称">
              <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="Engineering" style={iStyle(false)} />
            </Field>

            <Field label="上级部门" style={{ gridColumn: 'span 2' }}>
              <select value={form.parentId ?? ''} onChange={e => set('parentId', e.target.value || null)} style={{ ...iStyle(false), appearance: 'none', width: '100%' }}>
                <option value="">无上级（顶级部门）</option>
                {parentOptions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>

            <Field label="负责人姓名" required error={errors.headName}>
              <input value={form.headName} onChange={e => set('headName', e.target.value)} placeholder="负责人姓名" style={iStyle(!!errors.headName)} />
            </Field>
            <Field label="职位">
              <input value={form.headTitle} onChange={e => set('headTitle', e.target.value)} placeholder="如：CTO" style={iStyle(false)} />
            </Field>

            <Field label="负责人邮箱">
              <input value={form.headEmail} onChange={e => set('headEmail', e.target.value)} placeholder="work@example.com" style={iStyle(false)} />
            </Field>
            <Field label="联系电话">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-xxx-xxx-xxxx" style={iStyle(false)} />
            </Field>

            <Field label="办公地点" style={{ gridColumn: 'span 2' }}>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="如：San Francisco, CA" style={{ ...iStyle(false), width: '100%' }} />
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 6 }}>部门描述</label>
            <textarea value={form.desc} onChange={e => set('desc', e.target.value)} rows={3} placeholder="简要描述部门职能…" style={{ ...iStyle(false), resize: 'none', width: '100%' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>取消</button>
          <button onClick={handleSave} style={btnPrimary}>
            <Save size={13} />{isEdit ? '保存更改' : '创建部门'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function DepartmentView({ navigateTo }: Props) {
  const { lang } = useLang()
  const isEn = lang === 'en'
  const [depts, setDepts] = useState<Department[]>(INIT_DEPTS)
  const [selected, setSelected] = useState<string | null>('d1')
  const [search, setSearch] = useState('')
  const [formDept, setFormDept] = useState<Department | null | 'new' | { parentId: string }>(undefined as unknown as null)
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const selectedDept = depts.find(d => d.id === selected) ?? null

  const filteredDepts = search
    ? depts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.nameEn.toLowerCase().includes(search.toLowerCase()) || d.headName.toLowerCase().includes(search.toLowerCase()))
    : depts

  const rootDepts = getChildren(filteredDepts, null)

  const handleSave = (d: Department) => {
    setDepts(prev => {
      const exists = prev.find(p => p.id === d.id)
      return exists ? prev.map(p => p.id === d.id ? d : p) : [...prev, d]
    })
    setSelected(d.id)
    setFormDept(null as unknown as Department)
  }

  const handleDelete = (id: string) => {
    const descendantIds = getAllDescendantIds(depts, id)
    setDepts(prev => prev.filter(d => d.id !== id && !descendantIds.includes(d.id)))
    if (selected === id || descendantIds.includes(selected ?? '')) setSelected('d1')
    setDeleteConfirm(null)
  }

  const openAdd = (parentId?: string) => {
    setDefaultParentId(parentId)
    setFormDept('new' as unknown as Department)
  }

  const totalMembers = depts.reduce((s, d) => s + d.memberCount, 0)
  const deleteTarget = depts.find(d => d.id === deleteConfirm)
  const deleteChildCount = deleteConfirm ? getAllDescendantIds(depts, deleteConfirm).length : 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: '-0.3px' }}>
            {isEn ? 'Department Management' : '部门管理'}
          </h1>
          <p style={{ fontSize: 13, color: C.muted }}>
            {isEn ? 'Manage organizational structure, departments and teams' : '管理组织架构、部门层级与人员归属'}
          </p>
        </div>
        <button onClick={() => openAdd()} style={{ ...btnPrimary }}>
          <Plus size={14} />{isEn ? 'New Department' : '新增部门'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: isEn ? 'Total Departments' : '部门总数', value: depts.length, color: C.blue, bg: C.blueBg },
          { label: isEn ? 'Total Members' : '总成员数', value: totalMembers, color: C.green, bg: 'rgba(5,150,105,0.08)' },
          { label: isEn ? 'Hierarchy Levels' : '最大层级数', value: 3, color: C.purple, bg: C.purpleBg },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Tree panel */}
        <div style={{ ...glass, padding: '14px 12px', position: 'sticky', top: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color={C.muted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isEn ? 'Search departments…' : '搜索部门…'}
                style={{ width: '100%', padding: '6px 10px 6px 28px', fontSize: 12.5, background: 'rgba(241,243,254,0.7)', border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', color: C.text, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {rootDepts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.faint, fontSize: 12 }}>
                {isEn ? 'No departments found' : '未找到部门'}
              </div>
            ) : (
              rootDepts.map(d => (
                <DeptTreeNode key={d.id} dept={d} depts={filteredDepts} depth={0}
                  selected={selected}
                  onSelect={setSelected}
                  onEdit={(dept) => setFormDept(dept)}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onAdd={(pid) => openAdd(pid)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selectedDept ? (
            <DeptDetail
              dept={selectedDept}
              depts={depts}
              onEdit={() => setFormDept(selectedDept)}
              onAddChild={() => openAdd(selectedDept.id)}
              navigateTo={navigateTo}
            />
          ) : (
            <div style={{ ...glass, padding: '64px 0', textAlign: 'center' }}>
              <Building2 size={40} color={C.faint} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: C.muted }}>
                {isEn ? 'Select a department to view details' : '在左侧选择一个部门查看详情'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {(formDept === ('new' as unknown) || (formDept && formDept !== ('new' as unknown))) && (
        <DeptFormModal
          dept={typeof formDept === 'string' ? null : formDept as Department}
          depts={depts}
          defaultParentId={defaultParentId}
          onSave={handleSave}
          onClose={() => setFormDept(null as unknown as Department)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 400, background: 'rgba(255,255,255,0.97)', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,58,152,0.18)', border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={17} color={C.red} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  确认删除「{deleteTarget.name}」？
                </div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.65 }}>
                  此操作不可撤销。
                  {deleteChildCount > 0 && (
                    <><br />同时将删除其下 <strong style={{ color: C.red }}>{deleteChildCount} 个</strong>子部门。</>
                  )}
                  <br />成员归属将需要重新分配。
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={btnSecondary}>取消</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: 'white', background: C.red, border: 'none', borderRadius: 9, cursor: 'pointer' }}>
                <Trash2 size={13} />确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, required, error, children, style }: { label: string; required?: boolean; error?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const iStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', padding: '8px 12px', fontSize: 13, color: C.text,
  background: 'rgba(241,243,254,0.7)', border: `1px solid ${hasError ? C.red : C.border}`,
  borderRadius: 9, outline: 'none', boxSizing: 'border-box',
})

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
  fontSize: 13, fontWeight: 600, color: 'white',
  background: 'linear-gradient(135deg, #0058BC, #0070EB)',
  border: 'none', borderRadius: 9, cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(0,88,188,0.28)',
}
const btnSecondary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  fontSize: 13, fontWeight: 500, color: C.soft,
  background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 9, cursor: 'pointer',
}
