import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Network, Plus, Edit2, XCircle, Link, ArrowRightLeft, Palette,
  BarChart2, ChevronRight, ChevronDown, Check, X, AlertTriangle,
  Users, Layers, Eye, Search, Settings, Loader2, ArrowUpRight,
  ArrowDownRight, Copy, Globe, Smartphone, FileText, Zap,
  ToggleLeft, ToggleRight, CheckCircle2, Clock,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'
import {
  channelNodes, hierarchyRelations, pendingChanges, whiteLabelConfigs, teamPerfSummary,
  buildChildrenMap, getNodeById,
  NODE_TYPE_LABEL, NODE_TYPE_LABEL_EN, NODE_TYPE_COLOR, STATUS_STYLE, CHANGE_TYPE_LABEL, CHANGE_TYPE_LABEL_EN,
  type ChannelNode, type NodeType, type WhiteLabelConfig,
} from '../data/channelHierarchyData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>{children}</span>
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>{children}</div>
}
function fmt(n: number) { return '$' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString()) }
function pct(n: number) { return (n * 100).toFixed(1) + '%' }

const tooltipStyle = {
  contentStyle: { background: 'rgba(255,255,255,0.94)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 10, fontSize: 12, backdropFilter: 'blur(8px)' },
}

// ── Tree Node Component ───────────────────────────────────────────────────────

function TreeNode({
  node, childrenMap, depth, onSelect, selectedId, expanded, onToggle,
}: {
  node: ChannelNode
  childrenMap: Record<string, string[]>
  depth: number
  onSelect: (n: ChannelNode) => void
  selectedId: string | null
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const { lang } = useLang()
  const children = (childrenMap[node.id] || []).map(id => getNodeById(id)).filter(Boolean) as ChannelNode[]
  const hasChildren = children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const typeColor = NODE_TYPE_COLOR[node.type]
  const statusSt = STATUS_STYLE[node.status]
  const isMultiParent = node.parentIds.length > 1
  const typeLabel = lang === 'en' ? NODE_TYPE_LABEL_EN[node.type] : NODE_TYPE_LABEL[node.type]

  return (
    <div>
      <div
        onClick={() => { onSelect(node); if (hasChildren) onToggle(node.id) }}
        style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: depth * 20, marginBottom: 2, cursor: 'pointer' }}
      >
        {/* Expand toggle */}
        <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#C1C6D7' }}>
          {hasChildren ? (isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : null}
        </div>

        {/* Node pill */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, background: isSelected ? `${typeColor}10` : 'rgba(255,255,255,0.45)', border: isSelected ? `1.5px solid ${typeColor}` : '1px solid rgba(193,198,215,0.3)', transition: 'all 0.12s' }}>
          {/* Type dot */}
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: typeColor, boxShadow: isSelected ? `0 0 8px ${typeColor}` : `0 0 4px ${typeColor}60`, flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
              {isMultiParent && <span title={lang === 'en' ? 'Multi-parent node' : '多上级节点'} style={{ fontSize: 9.5, background: 'rgba(0,88,188,0.12)', color: '#0058BC', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>{lang === 'en' ? 'Multi-parent' : '多上级'}</span>}
              {node.status !== 'active' && <Badge bg={statusSt.bg} color={statusSt.color}>{lang === 'en' ? statusSt.labelEn : statusSt.label}</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, background: `${typeColor}12`, color: typeColor, borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>{typeLabel}</span>
            {node.ytdPremium > 0 && <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#717786' }}>{fmt(node.ytdPremium)}</span>}
            {hasChildren && <span style={{ fontSize: 11, color: '#A0A5B1' }}>{children.length}</span>}
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && children.map(child => (
        <TreeNode key={child.id} node={child} childrenMap={childrenMap} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  )
}

// ── Tab 1 — 组织架构树 ─────────────────────────────────────────────────────────

function OrgTreeTab() {
  const { lang } = useLang()
  const childrenMap = buildChildrenMap()
  const roots = channelNodes.filter(n => n.depth === 0)
  const [selected, setSelected] = useState<ChannelNode | null>(channelNodes.find(n => n.id === 'c1') ?? null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root', 'r-west', 'r-south', 'r-northeast', 'r-midwest', 'c1']))
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all')

  const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const matchSearch = (n: ChannelNode) => !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.shortName.toLowerCase().includes(search.toLowerCase())
  const matchType = (n: ChannelNode) => filterType === 'all' || n.type === filterType
  const displayNodes = channelNodes.filter(n => n.depth === 0 || (matchSearch(n) && matchType(n)))

  const multiParentNodes = channelNodes.filter(n => n.parentIds.length > 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, minHeight: 620 }}>
      {/* Tree panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search + filter */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'en' ? 'Search nodes…' : '搜索节点名称…'} className="input-glass" style={{ paddingLeft: 30, width: '100%', fontSize: 12.5 }} />
          </div>
          <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
            {(['all', 'region', 'agency', 'branch', 'agent'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding: '3px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: filterType === t ? `1.5px solid ${t === 'all' ? '#0058BC' : NODE_TYPE_COLOR[t]}` : '1px solid rgba(193,198,215,0.4)', background: filterType === t ? `${t === 'all' ? '#0058BC' : NODE_TYPE_COLOR[t]}10` : 'rgba(255,255,255,0.5)', color: filterType === t ? (t === 'all' ? '#0058BC' : NODE_TYPE_COLOR[t]) : '#717786', cursor: 'pointer' }}>
                {t === 'all' ? (lang === 'en' ? 'All' : '全部') : (lang === 'en' ? NODE_TYPE_LABEL_EN[t] : NODE_TYPE_LABEL[t])}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3" style={{ fontSize: 10.5, color: '#A0A5B1', flexWrap: 'wrap' }}>
          {(['region','agency','branch','agent'] as NodeType[]).map(t => (
            <span key={t} className="flex items-center gap-1">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[t], display: 'inline-block' }} />
              {lang === 'en' ? NODE_TYPE_LABEL_EN[t] : NODE_TYPE_LABEL[t]}
            </span>
          ))}
        </div>

        {/* Tree */}
        <div className="glass-card" style={{ borderRadius: 14, padding: '14px 8px', flex: 1, overflowY: 'auto', maxHeight: 520 }}>
          {roots.map(root => (
            <TreeNode key={root.id} node={root} childrenMap={childrenMap} depth={0} onSelect={setSelected} selectedId={selected?.id ?? null} expanded={expanded} onToggle={toggle} />
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-3" style={{ fontSize: 11.5, color: '#717786' }}>
          {lang === 'en' ? (
            <>
              <span><strong style={{ color: '#181C23' }}>{channelNodes.length - 1}</strong> {channelNodes.length - 1 === 1 ? 'node' : 'nodes'}</span>
              <span>·</span>
              <span><strong style={{ color: '#0058BC' }}>{multiParentNodes.length}</strong> multi-parent</span>
              <span>·</span>
              <span><strong style={{ color: '#C0392B' }}>{channelNodes.filter(n => n.status === 'suspended').length}</strong> suspended</span>
            </>
          ) : (
            <>
              <span>共 <strong style={{ color: '#181C23' }}>{channelNodes.length - 1}</strong> 个节点</span>
              <span>·</span>
              <span>多上级 <strong style={{ color: '#0058BC' }}>{multiParentNodes.length}</strong> 个</span>
              <span>·</span>
              <span>暂停 <strong style={{ color: '#C0392B' }}>{channelNodes.filter(n => n.status === 'suspended').length}</strong> 个</span>
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div>
        {selected ? (
          <div className="flex flex-col gap-4">
            {/* Node header */}
            <Card style={{ padding: '16px 18px' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${NODE_TYPE_COLOR[selected.type]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${NODE_TYPE_COLOR[selected.type]}30` }}>
                    <Network size={20} color={NODE_TYPE_COLOR[selected.type]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#181C23' }}>{selected.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge bg={`${NODE_TYPE_COLOR[selected.type]}12`} color={NODE_TYPE_COLOR[selected.type]}>{lang === 'en' ? NODE_TYPE_LABEL_EN[selected.type] : NODE_TYPE_LABEL[selected.type]}</Badge>
                      <Badge bg={STATUS_STYLE[selected.status].bg} color={STATUS_STYLE[selected.status].color}>{lang === 'en' ? STATUS_STYLE[selected.status].labelEn : STATUS_STYLE[selected.status].label}</Badge>
                      {selected.parentIds.length > 1 && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? `Multi-parent (${selected.parentIds.length})` : `多上级 (${selected.parentIds.length})`}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Edit2 size={12} />{lang === 'en' ? 'Edit' : '编辑'}</button>
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} />{lang === 'en' ? 'Terminate' : '终止'}</button>
                </div>
              </div>
            </Card>

            {/* Two-column info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Basic Info' : '基本信息'}</div>
                {[
                  { key: 'join', label: lang === 'en' ? 'Join Date' : '加入日期', value: selected.joinDate },
                  { key: 'state', label: lang === 'en' ? 'Primary State' : '主营州', value: selected.primaryState },
                  ...(selected.npn ? [{ key: 'npn', label: lang === 'en' ? 'NPN' : 'NPN 编号', value: selected.npn, mono: true }] : []),
                  ...(selected.contractId ? [{ key: 'contract', label: lang === 'en' ? 'Contract ID' : '合同编号', value: selected.contractId, mono: true }] : []),
                  ...(selected.managerName ? [{ key: 'manager', label: lang === 'en' ? 'Manager' : '负责人', value: selected.managerName }] : []),
                  ...(selected.email ? [{ key: 'email', label: lang === 'en' ? 'Email' : '邮箱', value: selected.email }] : []),
                ].map((row) => {
                  return (
                    <div key={row.key} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', padding: '6px 0', fontSize: 12 }}>
                      <span style={{ color: '#717786' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#181C23', fontFamily: row.mono ? "'JetBrains Mono', monospace" : undefined }}>{row.value}</span>
                    </div>
                  )
                })}
              </Card>

              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Performance Metrics' : '业绩指标'}</div>
                {[
                  { key: 'premium', label: lang === 'en' ? 'YTD Premium' : 'YTD 保费', value: fmt(selected.ytdPremium), color: '#0058BC' },
                  { key: 'commission', label: lang === 'en' ? 'YTD Commission' : 'YTD 佣金', value: fmt(selected.ytdCommission), color: '#1E8033' },
                  { key: 'loss', label: lang === 'en' ? 'Loss Ratio' : '赔付率', value: pct(selected.lossRatio), color: selected.lossRatio > 0.65 ? '#C0392B' : selected.lossRatio > 0.62 ? '#B06000' : '#1E8033' },
                  { key: 'renewal', label: lang === 'en' ? 'Renewal Rate' : '续保率', value: pct(selected.renewalRate), color: selected.renewalRate > 0.9 ? '#1E8033' : '#B06000' },
                  { key: 'team', label: lang === 'en' ? 'Team Size' : '团队规模', value: selected.teamSize.toString(), color: '#181C23' },
                ].map((row) => (
                  <div key={row.key} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', padding: '6px 0', fontSize: 12 }}>
                    <span style={{ color: '#717786' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* Parent relations */}
            {selected.parentIds.length > 0 && (
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Parent Relations' : '上级关系'}</div>
                {selected.parentIds.map((pid, i) => {
                  const parent = getNodeById(pid)
                  if (!parent) return null
                  const rel = hierarchyRelations.find(r => r.childId === selected.id && r.parentId === pid)
                  return (
                    <div key={pid} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: i < selected.parentIds.length - 1 ? '0.5px solid rgba(193,198,215,0.25)' : 'none' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[parent.type] }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{parent.name}</span>
                        {pid === selected.primaryParentId && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? 'Primary Parent' : '主上级'}</Badge>}
                      </div>
                      {rel && (
                        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#717786' }}>
                          {lang === 'en' ? 'Revenue Split ' : '收入分配 '}<strong style={{ color: '#0058BC' }}>{pct(rel.revenueShare)}</strong>
                        </span>
                      )}
                    </div>
                  )
                })}
              </Card>
            )}

            {/* Sub-nodes */}
            {(childrenMap[selected.id] || []).length > 0 && (
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{lang === 'en' ? `Child Nodes (${(childrenMap[selected.id] || []).length})` : `下级节点 (${(childrenMap[selected.id] || []).length})`}</div>
                <div className="flex flex-col gap-1">
                  {(childrenMap[selected.id] || []).map(cid => {
                    const child = getNodeById(cid)
                    if (!child) return null
                    return (
                      <div key={cid} className="flex items-center justify-between" style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(249,249,255,0.6)', cursor: 'pointer' }} onClick={() => setSelected(child)}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[child.type] }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{child.name}</span>
                          <Badge bg={`${NODE_TYPE_COLOR[child.type]}12`} color={NODE_TYPE_COLOR[child.type]}>{lang === 'en' ? NODE_TYPE_LABEL_EN[child.type] : NODE_TYPE_LABEL[child.type]}</Badge>
                        </div>
                        <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: '#717786' }}>{fmt(child.ytdPremium)}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#A0A5B1', gap: 10 }}>
            <Network size={36} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'en' ? 'Click a node on the left to view details' : '点击左侧节点查看详情'}</span>
          </Card>
        )}
      </div>
    </div>
  )
}

// ── Tab 2 — 层级关系管理（新增/调整/终止）──────────────────────────────────────

function RelationManagementTab() {
  const { lang } = useLang()
  const [subTab, setSubTab] = useState<'add' | 'adjust' | 'terminate'>('add')
  const [addForm, setAddForm] = useState({ childId: '', parentId: '', isPrimary: true, revenueShare: 100 })
  const [adjustForm, setAdjustForm] = useState({ nodeId: '', currentParentId: '', newParentId: '', reason: '', effectiveDate: '' })
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const activeRelations = hierarchyRelations.filter(r => r.status === 'active')

  const doSubmit = () => {
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 1400)
  }

  const nodeOptions = channelNodes.filter(n => n.type !== 'platform').map(n => ({ id: n.id, name: n.name, type: n.type }))
  const parentOptions = channelNodes.filter(n => n.type !== 'agent' && n.type !== 'sub-agent').map(n => ({ id: n.id, name: n.name, type: n.type }))

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {([['add', lang === 'en' ? 'Add Relation' : '新增层级关系'], ['adjust', lang === 'en' ? 'Adjust Relation' : '调整层级关系'], ['terminate', lang === 'en' ? 'Terminate Relation' : '终止层级关系']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: subTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: subTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: subTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{lang === 'en' ? 'Add Hierarchy Relation' : '新增层级关系'}</div>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Child Node (Subordinate)' : '子节点（下级）'}</label>
                <select value={addForm.childId} onChange={e => setAddForm(f => ({ ...f, childId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{lang === 'en' ? 'Select a node…' : '请选择节点…'}</option>
                  {nodeOptions.map(n => <option key={n.id} value={n.id}>{n.name} [{lang === 'en' ? NODE_TYPE_LABEL_EN[n.type] : NODE_TYPE_LABEL[n.type]}]</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Parent Node (Superior)' : '父节点（上级）'}</label>
                <select value={addForm.parentId} onChange={e => setAddForm(f => ({ ...f, parentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{lang === 'en' ? 'Select a parent…' : '请选择上级…'}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name} [{lang === 'en' ? NODE_TYPE_LABEL_EN[n.type] : NODE_TYPE_LABEL[n.type]}]</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Revenue Split (%)' : '收入分配比例（%）'}</label>
                <input type="number" min={0} max={100} value={addForm.revenueShare} onChange={e => setAddForm(f => ({ ...f, revenueShare: parseInt(e.target.value) }))} className="input-glass" style={{ width: '100%', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 4 }}>{lang === 'en' ? 'For multi-parent nodes, the sum of all parent splits must equal 100%' : '多上级时各上级分配之和需等于 100%'}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={addForm.isPrimary} onChange={e => setAddForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                <label htmlFor="isPrimary" style={{ fontSize: 13, color: '#181C23', cursor: 'pointer' }}>{lang === 'en' ? 'Set as Primary Parent' : '设为主上级（Primary Parent）'}</label>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5, color: '#4A6A9C' }}>
                {lang === 'en' ? 'The primary parent determines the commission contract version, product authorization scope, and compliance ownership; secondary parents only receive their revenue split.' : '主上级决定佣金合同版本、产品授权范围和合规归属；次上级仅享有收入分配权。'}
              </div>
              <button onClick={doSubmit} disabled={!addForm.childId || !addForm.parentId || submitting} style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: addForm.childId && addForm.parentId ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', border: 'none', cursor: addForm.childId && addForm.parentId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" />{lang === 'en' ? 'Submitting…' : '提交中…'}</> : <><Check size={13} />{lang === 'en' ? 'Submit Request' : '提交申请'}</>}
              </button>
            </div>
          </Card>

          {/* Preview */}
          <Card style={{ background: 'rgba(0,88,188,0.03)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{lang === 'en' ? 'Relation Preview' : '关系预览'}</div>
            {addForm.childId && addForm.parentId ? (() => {
              const child = getNodeById(addForm.childId)
              const parent = getNodeById(addForm.parentId)
              if (!child || !parent) return null
              return (
                <div className="flex flex-col gap-3">
                  <div style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${NODE_TYPE_COLOR[parent.type]}`, background: `${NODE_TYPE_COLOR[parent.type]}08` }}>
                    <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 3 }}>{lang === 'en' ? 'Parent · ' : '上级 · '}{lang === 'en' ? NODE_TYPE_LABEL_EN[parent.type] : NODE_TYPE_LABEL[parent.type]}</div>
                    <div style={{ fontWeight: 700, color: '#181C23' }}>{parent.name}</div>
                  </div>
                  <div className="flex justify-center"><div style={{ width: 2, height: 20, background: '#C1C6D7', borderRadius: 1 }} /></div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${NODE_TYPE_COLOR[child.type]}`, background: `${NODE_TYPE_COLOR[child.type]}08` }}>
                    <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 3 }}>{lang === 'en' ? 'Child · ' : '下级 · '}{lang === 'en' ? NODE_TYPE_LABEL_EN[child.type] : NODE_TYPE_LABEL[child.type]}</div>
                    <div style={{ fontWeight: 700, color: '#181C23' }}>{child.name}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 12.5 }}>
                    <div className="flex justify-between"><span style={{ color: '#717786' }}>{lang === 'en' ? 'Revenue Split' : '收入分配'}</span><span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#1E8033' }}>{addForm.revenueShare}%</span></div>
                    <div className="flex justify-between mt-1"><span style={{ color: '#717786' }}>{lang === 'en' ? 'Relation Type' : '关系类型'}</span><span style={{ fontWeight: 700, color: '#0058BC' }}>{addForm.isPrimary ? (lang === 'en' ? 'Primary Parent' : '主上级') : (lang === 'en' ? 'Secondary Parent' : '次上级')}</span></div>
                  </div>
                </div>
              )
            })() : <div style={{ textAlign: 'center', color: '#C1C6D7', paddingTop: 40, fontSize: 13 }}>{lang === 'en' ? 'Please select nodes first' : '请先选择节点'}</div>}
          </Card>
        </div>
      )}

      {subTab === 'adjust' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{lang === 'en' ? 'Adjust Hierarchy Relation' : '调整层级关系'}</div>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Select Node' : '选择节点'}</label>
                <select value={adjustForm.nodeId} onChange={e => setAdjustForm(f => ({ ...f, nodeId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{lang === 'en' ? 'Select the node to adjust…' : '请选择要调整的节点…'}</option>
                  {nodeOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Current Parent' : '当前上级'}</label>
                <select value={adjustForm.currentParentId} onChange={e => setAdjustForm(f => ({ ...f, currentParentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{lang === 'en' ? 'Select current parent…' : '选择当前上级…'}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#A0A5B1' }}>
                <ArrowRightLeft size={16} />
                <span style={{ fontSize: 12 }}>{lang === 'en' ? 'Change to' : '调整为'}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'New Parent' : '新上级'}</label>
                <select value={adjustForm.newParentId} onChange={e => setAdjustForm(f => ({ ...f, newParentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{lang === 'en' ? 'Select new parent…' : '选择新上级…'}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Effective Date' : '生效日期'}</label>
                <input type="date" value={adjustForm.effectiveDate} onChange={e => setAdjustForm(f => ({ ...f, effectiveDate: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Reason for Adjustment *' : '调整原因 *'}</label>
                <textarea value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder={lang === 'en' ? 'Explain the reason for this adjustment (recorded in change history)…' : '请说明调整原因（将记录至变更历史）…'} className="input-glass" style={{ width: '100%', fontSize: 13, resize: 'vertical' }} />
              </div>
              <button onClick={doSubmit} disabled={submitting} style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" />{lang === 'en' ? 'Submitting…' : '提交中…'}</> : <><ArrowRightLeft size={13} />{lang === 'en' ? 'Submit Adjustment' : '提交调整申请'}</>}
              </button>
            </div>
          </Card>

          {/* Pending changes list */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{lang === 'en' ? 'Pending Change Requests' : '待处理变更申请'}</div>
            <div className="flex flex-col gap-3">
              {pendingChanges.filter(c => c.changeType === 'move-parent' || c.changeType === 'add-parent').map(c => {
                const statusS = c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: lang === 'en' ? 'Pending Approval' : '待审批' } : c.status === 'approved' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: lang === 'en' ? 'Approved' : '已批准' } : { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: lang === 'en' ? 'Rejected' : '已拒绝' }
                return (
                  <Card key={c.id} style={{ padding: '12px 14px' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? CHANGE_TYPE_LABEL_EN[c.changeType] : CHANGE_TYPE_LABEL[c.changeType]}</Badge>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.nodeName}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#717786' }}>{c.fromParentName} → {c.toParentName}</div>
                        <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 3 }}>{lang === 'en' ? `Requested by: ${c.requestedBy} · Effective: ${c.effectiveDate}` : `申请人：${c.requestedBy} · 生效日：${c.effectiveDate}`}</div>
                      </div>
                      <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    </div>
                    {c.status === 'pending-approval' && (
                      <div className="flex gap-2 mt-3">
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#1E8033', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} />{lang === 'en' ? 'Approve' : '批准'}</button>
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}><X size={11} />{lang === 'en' ? 'Reject' : '拒绝'}</button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {subTab === 'terminate' && (
        <div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', fontSize: 12.5, color: '#7A2020', marginBottom: 18 }}>
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><AlertTriangle size={13} />{lang === 'en' ? 'Termination Notice' : '终止须知'}</div>
            {lang === 'en' ? 'After terminating the relation, the child node will be detached from this parent, and the associated revenue split and product authorization will stop. If this is the child’s only parent, a new parent must be assigned before writing authority can be restored.' : '终止层级关系后，子节点将脱离该上级，相关收入分配及产品授权将停止。如子节点仅有此一个上级，终止后须重新指定上级方可恢复出单。'}
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                  {(lang === 'en' ? ['Child Node', 'Parent Node', 'Relation Type', 'Effective', 'Revenue Split', 'Status', 'Actions'] : ['子节点', '上级节点', '关系类型', '生效日', '收入分配', '状态', '操作']).map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRelations.map((r, i) => {
                  const child = getNodeById(r.childId)
                  const parent = getNodeById(r.parentId)
                  if (!child || !parent) return null
                  return (
                    <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#181C23' }}>{child.name}</div>
                        <div style={{ fontSize: 11, color: '#717786' }}><span style={{ background: `${NODE_TYPE_COLOR[child.type]}12`, color: NODE_TYPE_COLOR[child.type], borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>{lang === 'en' ? NODE_TYPE_LABEL_EN[child.type] : NODE_TYPE_LABEL[child.type]}</span></div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23', fontSize: 12.5 }}>{parent.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {r.isPrimary ? <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? 'Primary Parent' : '主上级'}</Badge> : <Badge bg="rgba(180,180,180,0.15)" color="#717786">{lang === 'en' ? 'Secondary Parent' : '次上级'}</Badge>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{r.startDate}</td>
                      <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', fontSize: 12.5 }}>{pct(r.revenueShare)}</td>
                      <td style={{ padding: '10px 14px' }}><Badge bg="rgba(52,199,89,0.1)" color="#1E8033">{lang === 'en' ? 'Active' : '生效中'}</Badge></td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => setTerminateId(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>{lang === 'en' ? 'Terminate' : '终止'}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {terminateId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-strong" style={{ borderRadius: 18, width: 480, padding: '28px 30px' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{lang === 'en' ? 'Confirm Terminate Relation' : '确认终止层级关系'}</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Effective Date' : '生效日期'}</label>
                    <input type="date" className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Termination Reason' : '终止原因'}</label>
                    {(lang === 'en' ? [['合作到期', 'Contract expired'], ['渠道主动申请', 'Channel requested'], ['合规违规处理', 'Compliance violation'], ['架构重组', 'Reorganization'], ['其他', 'Other']] : [['合作到期', '合作到期'], ['渠道主动申请', '渠道主动申请'], ['合规违规处理', '合规违规处理'], ['架构重组', '架构重组'], ['其他', '其他']] as const).map(([r, l]) => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="term-reason" />{l}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setTerminateId(null)}>{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <button onClick={() => setTerminateId(null)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#C0392B', color: '#fff', border: 'none', cursor: 'pointer' }}>{lang === 'en' ? 'Confirm Terminate' : '确认终止'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab 3 — 多上级配置 ─────────────────────────────────────────────────────────

function MultiParentTab() {
  const { lang } = useLang()
  const multiNodes = channelNodes.filter(n => n.parentIds.length > 1)
  const [editNodeId, setEditNodeId] = useState<string | null>(null)

  return (
    <div>
      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5, color: '#3A5A8C', marginBottom: 20 }}>
        <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 3 }}><Link size={13} />{lang === 'en' ? 'About Multi-parent Configuration' : '多上级配置说明'}</div>
        {lang === 'en' ? 'When a channel node collaborates across regions or agencies, multiple parent nodes can be configured. The revenue split across all parents must sum to 100%. The Primary Parent determines compliance ownership, product authorization, and the commission contract version; secondary parents only receive their premium revenue split.' : '当渠道节点跨区域或跨机构合作时，可配置多个上级节点。各上级的收入分配比例之和必须等于 100%。主上级（Primary Parent）决定合规归属、产品授权和佣金合同版本；次上级仅享有保费收入分配权。'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{lang === 'en' ? `Nodes with Multi-parent Configured (${multiNodes.length})` : `已配置多上级的节点（${multiNodes.length}）`}</div>
        {multiNodes.length === 0 ? (
          <Card style={{ textAlign: 'center', color: '#A0A5B1', padding: '40px 20px' }}>{lang === 'en' ? 'No multi-parent nodes' : '暂无多上级节点'}</Card>
        ) : multiNodes.map(node => {
          const relations = hierarchyRelations.filter(r => r.childId === node.id)
          const total = relations.reduce((s, r) => s + r.revenueShare, 0)
          const isEditing = editNodeId === node.id
          return (
            <Card key={node.id} style={{ marginBottom: 12, border: isEditing ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.35)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${NODE_TYPE_COLOR[node.type]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color={NODE_TYPE_COLOR[node.type]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{node.name}</div>
                    <div style={{ fontSize: 11.5, color: '#717786' }}>{lang === 'en' ? NODE_TYPE_LABEL_EN[node.type] : NODE_TYPE_LABEL[node.type]} · {node.parentIds.length} {lang === 'en' ? (node.parentIds.length === 1 ? 'parent' : 'parents') : '个上级'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: total === 1 ? '#1E8033' : '#C0392B', fontWeight: 700, background: total === 1 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', padding: '3px 9px', borderRadius: 7 }}>
                    {lang === 'en' ? 'Total split ' : '分配合计 '}{pct(total)}
                    {total !== 1 && (lang === 'en' ? ' ⚠ Adjustment needed' : ' ⚠ 需调整')}
                  </span>
                  <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditNodeId(isEditing ? null : node.id)}>{isEditing ? (lang === 'en' ? 'Collapse' : '收起') : (lang === 'en' ? 'Edit Split' : '编辑分配')}</button>
                </div>
              </div>

              {/* Parent rows */}
              <div className="flex flex-col gap-2">
                {relations.map(rel => {
                  const parent = getNodeById(rel.parentId)
                  if (!parent) return null
                  return (
                    <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: rel.isPrimary ? 'rgba(0,88,188,0.04)' : 'rgba(249,249,255,0.6)', border: rel.isPrimary ? '1px solid rgba(0,88,188,0.15)' : '1px solid rgba(193,198,215,0.3)' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[parent.type], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{parent.name}</div>
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{lang === 'en' ? NODE_TYPE_LABEL_EN[parent.type] : NODE_TYPE_LABEL[parent.type]}</div>
                      </div>
                      {rel.isPrimary && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? 'Primary Parent' : '主上级'}</Badge>}
                      {isEditing ? (
                        <input type="number" min={0} max={100} defaultValue={Math.round(rel.revenueShare * 100)} className="input-glass" style={{ width: 80, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC', minWidth: 50, textAlign: 'right' }}>{pct(rel.revenueShare)}</span>
                      )}
                      <span style={{ fontSize: 11, color: '#A0A5B1', minWidth: 20 }}>{lang === 'en' ? 'split' : '分配'}</span>
                    </div>
                  )
                })}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 mt-3">
                  <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setEditNodeId(null)}>{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <button style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setEditNodeId(null)}>{lang === 'en' ? 'Save Split' : '保存分配'}</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Pending multi-parent change */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{lang === 'en' ? 'Pending Multi-parent Changes' : '待审批的多上级变更'}</div>
        <div className="flex flex-col gap-3">
          {pendingChanges.filter(c => c.changeType === 'add-parent' || c.changeType === 'remove-parent').map(c => {
            const statusS = c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: lang === 'en' ? 'Pending Approval' : '待审批' } : { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: lang === 'en' ? 'Approved' : '已批准' }
            return (
              <Card key={c.id} style={{ padding: '12px 14px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{lang === 'en' ? CHANGE_TYPE_LABEL_EN[c.changeType] : CHANGE_TYPE_LABEL[c.changeType]}</Badge>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.nodeName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786' }}>{lang === 'en' ? `New parent: ${c.toParentName} · Revenue split: ${c.newRevenueShare ? pct(c.newRevenueShare) : '—'}` : `新增上级：${c.toParentName} · 分配比例：${c.newRevenueShare ? pct(c.newRevenueShare) : '—'}`}</div>
                    <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 2 }}>{lang === 'en' ? `Reason: ${c.reasonEn ?? c.reason}` : `原因：${c.reason}`}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    {c.status === 'pending-approval' && (
                      <>
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#1E8033' }}><Check size={11} /></button>
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#C0392B' }}><X size={11} /></button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab 4 — White-label 品牌配置 ──────────────────────────────────────────────

function WhiteLabelTab() {
  const { lang } = useLang()
  const [editing, setEditing] = useState<WhiteLabelConfig | null>(null)
  const [showNew, setShowNew] = useState(false)

  const statusS = (s: string) => s === 'active' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: lang === 'en' ? 'Enabled' : '已启用' } : s === 'draft' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: lang === 'en' ? 'Draft' : '草稿' } : { bg: 'rgba(180,180,180,0.15)', color: '#717786', label: lang === 'en' ? 'Disabled' : '已停用' }

  const featureIcons: Record<string, React.ReactNode> = {
    '自定义报价页面': <Globe size={12} />, '白标移动 APP': <Smartphone size={12} />, '品牌化保单文档': <FileText size={12} />,
    '自定义报告封面': <FileText size={12} />, 'API 接入': <Zap size={12} />, '客户门户': <Globe size={12} />,
  }

  // 中文 feature 串为逻辑 key（features.includes），显示层做英文映射
  const featureLabelEn: Record<string, string> = {
    '自定义报价页面': 'Custom Quote Page', '白标移动 APP': 'White-label Mobile App', '品牌化保单文档': 'Branded Policy Documents',
    '自定义报告封面': 'Custom Report Covers', 'API 接入': 'API Integration', '客户门户': 'Customer Portal',
  }
  const featureLabel = (f: string) => lang === 'en' ? (featureLabelEn[f] ?? f) : f

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{lang === 'en' ? `White-label Brand Configurations (${whiteLabelConfigs.length})` : `White-label 品牌配置（${whiteLabelConfigs.length}）`}</div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> {lang === 'en' ? 'New Brand Configuration' : '新增品牌配置'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {whiteLabelConfigs.map(wl => {
          const ss = statusS(wl.status)
          return (
            <Card key={wl.id} style={{ border: `1.5px solid ${wl.primaryColor}25` }}>
              {/* Brand header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${wl.primaryColor}, ${wl.secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{wl.brandName.slice(0, 2)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#181C23' }}>{wl.brandName}</div>
                    <div style={{ fontSize: 11.5, color: '#717786', marginTop: 1 }}>{wl.channelName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                  <button className="btn-ghost" style={{ padding: 5 }} onClick={() => setEditing(wl)}><Edit2 size={13} /></button>
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-2 mb-3">
                <div style={{ width: 24, height: 24, borderRadius: 6, background: wl.primaryColor, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} title={lang === 'en' ? `Primary ${wl.primaryColor}` : `主色 ${wl.primaryColor}`} />
                <div style={{ width: 24, height: 24, borderRadius: 6, background: wl.secondaryColor, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} title={lang === 'en' ? `Secondary ${wl.secondaryColor}` : `辅色 ${wl.secondaryColor}`} />
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{wl.primaryColor} / {wl.secondaryColor}</span>
              </div>

              {/* Domain / email */}
              <div className="flex flex-col gap-1 mb-3" style={{ fontSize: 12 }}>
                {wl.domain && <div><span style={{ color: '#717786' }}>{lang === 'en' ? 'Portal domain: ' : '门户域名：'}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0058BC' }}>{wl.domain}</span></div>}
                {wl.emailDomain && <div><span style={{ color: '#717786' }}>{lang === 'en' ? 'Email domain: ' : '邮件域名：'}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>@{wl.emailDomain}</span></div>}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {([['portal', lang === 'en' ? 'Portal' : '门户', wl.portalEnabled], ['mobile', lang === 'en' ? 'Mobile App' : '移动 APP', wl.mobileAppEnabled], ['docs', lang === 'en' ? 'Doc Templates' : '文档模板', wl.customDocTemplates], ['reports', lang === 'en' ? 'Branded Reports' : '品牌报告', wl.reportingBranded], ['api', 'API', wl.apiEnabled]] as const).map(([k, label, enabled]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, background: enabled ? 'rgba(52,199,89,0.1)' : 'rgba(180,180,180,0.12)', color: enabled ? '#1E8033' : '#A0A5B1', borderRadius: 6, padding: '2px 8px' }}>
                    {enabled ? <CheckCircle2 size={10} /> : <X size={10} />}{label}
                  </span>
                ))}
              </div>

              {/* Features */}
              <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.3)', paddingTop: 10 }}>
                <div style={{ fontSize: 10.5, color: '#A0A5B1', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang === 'en' ? 'Enabled Features' : '已配置功能'}</div>
                <div className="flex flex-wrap gap-1">
                  {wl.features.map(f => (
                    <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, background: `${wl.primaryColor}12`, color: wl.primaryColor, borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                      {featureIcons[f]}{featureLabel(f)}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 10.5, color: '#C1C6D7' }}>{lang === 'en' ? `Last modified: ${wl.lastModified}` : `最后修改：${wl.lastModified}`}</div>
            </Card>
          )
        })}

        {/* Add placeholder */}
        <button onClick={() => setShowNew(true)} style={{ borderRadius: 14, border: '2px dashed rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A0A5B1', minHeight: 220 }}>
          <Plus size={22} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'New Brand Configuration' : '新增品牌配置'}</span>
        </button>
      </div>

      {/* Edit / New modal */}
      {(editing || showNew) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 20, width: 560, padding: '28px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>{editing ? (lang === 'en' ? 'Edit Brand Configuration' : '编辑品牌配置') : (lang === 'en' ? 'New Brand Configuration' : '新增品牌配置')}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => { setEditing(null); setShowNew(false) }}><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: 'channel', label: lang === 'en' ? 'Channel' : '渠道', type: 'select' as const },
                { key: 'brand', label: lang === 'en' ? 'Brand Name' : '品牌名称', type: 'text' as const, placeholder: lang === 'en' ? 'e.g. Pacific Coast Pro' : '例：Pacific Coast Pro', value: editing?.brandName },
                { key: 'portal', label: lang === 'en' ? 'Portal Domain' : '门户域名', type: 'text' as const, placeholder: 'portal.channelname.com', value: editing?.domain },
                { key: 'email', label: lang === 'en' ? 'Email Domain' : '邮件域名', type: 'text' as const, placeholder: 'channelname.com', value: editing?.emailDomain },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                      {channelNodes.filter(n => n.type === 'agency').map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" defaultValue={f.value ?? ''} placeholder={f.placeholder} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                  )}
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Primary Color' : '主色调'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue={editing?.primaryColor ?? '#0058BC'} style={{ width: 36, height: 36, padding: 2, borderRadius: 8, border: '1px solid rgba(193,198,215,0.4)', cursor: 'pointer' }} />
                    <input type="text" defaultValue={editing?.primaryColor ?? '#0058BC'} className="input-glass" style={{ flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Secondary Color' : '辅色调'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue={editing?.secondaryColor ?? '#60CDFF'} style={{ width: 36, height: 36, padding: 2, borderRadius: 8, border: '1px solid rgba(193,198,215,0.4)', cursor: 'pointer' }} />
                    <input type="text" defaultValue={editing?.secondaryColor ?? '#60CDFF'} className="input-glass" style={{ flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 8 }}>{lang === 'en' ? 'Feature Modules' : '功能模块'}</label>
                <div className="flex flex-col gap-2">
                  {['客户门户', '白标移动 APP', '品牌化保单文档', '自定义报告封面', 'API 接入', '自定义报价页面'].map(f => (
                    <label key={f} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" defaultChecked={editing?.features.includes(f)} />{featureLabel(f)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => { setEditing(null); setShowNew(false) }}>{lang === 'en' ? 'Cancel' : '取消'}</button>
              <button style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setEditing(null); setShowNew(false) }}>{lang === 'en' ? 'Save Configuration' : '保存配置'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 5 — 变更历史 ────────────────────────────────────────────────────────────

function ChangeHistoryTab() {
  const { lang } = useLang()
  // typeLabel 保留中文作为 changeTypeColor 的查找 key；显示用 typeLabelEn
  const allChanges = [
    ...pendingChanges.map(c => ({ ...c, date: c.requestDate, typeLabel: CHANGE_TYPE_LABEL[c.changeType], typeLabelEn: CHANGE_TYPE_LABEL_EN[c.changeType], node: c.nodeName, actor: c.requestedBy, desc: c.reason, descEn: c.reasonEn ?? c.reason })),
    { id: 'ch1', date: '2026-07-12', typeLabel: '新增层级', typeLabelEn: 'New Relation', node: 'Rocky Mountain Insurance Advisors', actor: 'Admin', desc: '新渠道加入 West Region', descEn: 'New channel joined West Region', status: 'approved', changeType: 'add-relation' as const },
    { id: 'ch2', date: '2026-06-10', typeLabel: '合规暂停', typeLabelEn: 'Compliance Suspension', node: 'NE Professional Services', actor: 'Zhang Wei', desc: '赔付率持续超标，合规委员会决议暂停出单', descEn: 'Persistent loss-ratio exceedance; the compliance committee resolved to suspend writing authority', status: 'approved', changeType: 'adjust-share' as const },
    { id: 'ch3', date: '2026-05-20', typeLabel: '增加上级', typeLabelEn: 'Add Parent', node: 'Ryan Chen', actor: 'Marcus Lee', desc: 'Ryan Chen 承接 SF 分支业务，新增 PC SF 分支为次上级', descEn: 'Ryan Chen takes on the SF Branch book of business; PC SF Branch added as secondary parent', status: 'approved', changeType: 'add-parent' as const },
    { id: 'ch4', date: '2026-03-01', typeLabel: '新增层级', typeLabelEn: 'New Relation', node: 'PC Seattle Branch', actor: 'Sarah Chen', desc: '西雅图市场扩张，新增 Seattle 分支', descEn: 'Seattle market expansion; Seattle branch added', status: 'approved', changeType: 'add-relation' as const },
  ]

  const changeTypeColor: Record<string, string> = {
    '新增层级': '#1E8033', '调整上级': '#0058BC', '增加上级': '#7B3FCA', '移除上级': '#B06000', '终止关系': '#C0392B', '分成调整': '#717786', '合规暂停': '#C0392B',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{lang === 'en' ? 'Hierarchy Change History' : '层级变更记录'}</div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Search size={12} /> {lang === 'en' ? 'Search' : '搜索'}
          </button>
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRightLeft size={12} /> {lang === 'en' ? 'Filter' : '筛选'}
          </button>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 0, position: 'relative' }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: 11, top: 8, bottom: 0, width: 2, background: 'rgba(193,198,215,0.35)', borderRadius: 1 }} />

        {allChanges.sort((a, b) => b.date.localeCompare(a.date)).map((c, i) => {
          const color = changeTypeColor[c.typeLabel] ?? '#717786'
          const statusS = c.status === 'approved' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: lang === 'en' ? 'Approved' : '已批准' } : c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: lang === 'en' ? 'Pending Approval' : '待审批' } : { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: lang === 'en' ? 'Rejected' : '已拒绝' }
          return (
            <div key={c.id} style={{ display: 'flex', gap: 16, paddingBottom: i < allChanges.length - 1 ? 16 : 0, position: 'relative' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, marginTop: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              </div>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(193,198,215,0.3)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 11.5, fontWeight: 700, background: `${color}12`, color, borderRadius: 5, padding: '2px 7px' }}>{lang === 'en' ? c.typeLabelEn : c.typeLabel}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.node}</span>
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                  </div>
                  <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{c.date}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: '#717786' }}>{lang === 'en' ? c.descEn : c.desc}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, color: '#A0A5B1' }}>{lang === 'en' ? `By: ${c.actor}` : `操作人：${c.actor}`}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 6 — 团队业绩汇总 ──────────────────────────────────────────────────────

function TeamPerformanceTab() {
  const { lang } = useLang()
  const [viewLevel, setViewLevel] = useState<'region' | 'agency'>('region')
  const data = teamPerfSummary.filter(t => viewLevel === 'region' ? t.nodeType === 'region' : t.nodeType === 'agency')

  const topTeam = data.reduce((best, t) => (!best || t.ytdPremium > best.ytdPremium ? t : best), data[0])
  const avgAchievement = data.reduce((s, t) => s + t.achievementRate, 0) / data.length
  const avgRenewal = data.reduce((s, t) => s + t.renewalRate, 0) / data.length

  const chartData = data.map(t => ({
    name: t.nodeName.length > 14 ? t.nodeName.slice(0, 14) + '…' : t.nodeName,
    actual: Math.round(t.ytdPremium / 1e6 * 10) / 10,
    target: Math.round(t.ytdTarget / 1e6 * 10) / 10,
    achievement: Math.round(t.achievementRate * 100),
  }))

  const tierStyle = (rate: number) => rate >= 1.10 ? { label: 'S', bg: '#AF52DE', color: '#fff' } : rate >= 1.0 ? { label: 'A', bg: '#34C759', color: '#fff' } : rate >= 0.90 ? { label: 'B', bg: '#FF9F0A', color: '#fff' } : { label: 'C', bg: '#FF3B30', color: '#fff' }

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: lang === 'en' ? 'Total Teams' : '团队总数', value: data.length.toString(), color: '#0058BC' },
          { label: lang === 'en' ? 'Target Hit Rate (≥100%)' : '达标率（≥100%）', value: pct(data.filter(t => t.achievementRate >= 1.0).length / data.length), color: '#1E8033' },
          { label: lang === 'en' ? 'Avg Achievement' : '平均完成率', value: pct(avgAchievement), color: avgAchievement >= 1.0 ? '#1E8033' : '#B06000' },
          { label: lang === 'en' ? 'Overall Renewal Rate' : '综合续保率', value: pct(avgRenewal), color: '#7B3FCA' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setViewLevel('region')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: viewLevel === 'region' ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: viewLevel === 'region' ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: viewLevel === 'region' ? '#0058BC' : '#717786', cursor: 'pointer' }}>{lang === 'en' ? 'Regional Summary' : '大区汇总'}</button>
        <button onClick={() => setViewLevel('agency')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: viewLevel === 'agency' ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: viewLevel === 'agency' ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: viewLevel === 'agency' ? '#0058BC' : '#717786', cursor: 'pointer' }}>{lang === 'en' ? 'Agency Summary' : '代理机构汇总'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Achievement bar chart */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{lang === 'en' ? 'YTD Premium Achievement (USD millions)' : 'YTD 保费达成率（百万美元）'}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '']} />
              <ReferenceLine y={0} stroke="rgba(193,198,215,0.3)" />
              <Bar dataKey="target" name={lang === 'en' ? 'Target' : '目标'} fill="rgba(193,198,215,0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name={lang === 'en' ? 'Actual' : '实际'} radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.achievement >= 100 ? '#34C759' : e.achievement >= 90 ? '#FF9F0A' : '#FF3B30'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Renewal rate comparison */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{lang === 'en' ? 'Team Renewal Rate & Loss Ratio Comparison' : '团队续保率 & 赔付率对比'}</div>
          <div className="flex flex-col gap-3">
            {data.sort((a, b) => b.renewalRate - a.renewalRate).map(t => (
              <div key={t.nodeId} className="flex items-center gap-3">
                <div style={{ width: 100, fontSize: 11.5, fontWeight: 600, color: '#181C23', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nodeName.split(' ')[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                      <div style={{ width: `${((t.renewalRate - 0.80) / 0.15) * 100}%`, height: '100%', background: '#0058BC', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', width: 38, textAlign: 'right' }}>{pct(t.renewalRate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                      <div style={{ width: `${(t.lossRatio / 0.75) * 100}%`, height: '100%', background: t.lossRatio > 0.65 ? '#FF3B30' : t.lossRatio > 0.62 ? '#FF9F0A' : '#34C759', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: t.lossRatio > 0.65 ? '#C0392B' : '#555', width: 38, textAlign: 'right' }}>{pct(t.lossRatio)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-8" style={{ fontSize: 11, color: '#A0A5B1', paddingTop: 4 }}>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 3, borderRadius: 2, background: '#0058BC', display: 'inline-block' }} />{lang === 'en' ? 'Renewal Rate' : '续保率'}</span>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 3, borderRadius: 2, background: '#FF9F0A', display: 'inline-block' }} />{lang === 'en' ? 'Loss Ratio' : '赔付率'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Team ranking table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', fontSize: 13, fontWeight: 700, color: '#181C23' }}>{lang === 'en' ? 'Team Performance Ranking' : '团队业绩排行'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {(lang === 'en' ? ['Tier', 'Team Name', 'Parent', 'Members', 'YTD Premium', 'Target Achievement', 'New Policies', 'Renewal Rate', 'Loss Ratio', 'Top Performer'] : ['等级', '团队名称', '上级', '成员数', 'YTD 保费', '目标达成率', '新保单', '续保率', '赔付率', '标杆人员']).map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sort((a, b) => b.achievementRate - a.achievementRate).map((t, i) => {
              const ts = tierStyle(t.achievementRate)
              return (
                <tr key={t.nodeId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: ts.color }}>{ts.label}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{t.nodeName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#717786' }}>{t.parentName ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{t.memberCount}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{t.ytdPremium >= 1e6 ? '$' + (t.ytdPremium / 1e6).toFixed(1) + 'M' : '$' + (t.ytdPremium / 1e3).toFixed(0) + 'K'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, t.achievementRate * 80)}%`, height: '100%', background: t.achievementRate >= 1.0 ? '#34C759' : '#FF9F0A', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12.5, color: t.achievementRate >= 1.0 ? '#1E8033' : '#B06000' }}>{pct(t.achievementRate)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{t.newPolicies.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: t.renewalRate > 0.9 ? '#1E8033' : '#B06000', fontSize: 12 }}>{pct(t.renewalRate)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: t.lossRatio > 0.65 ? '#C0392B' : '#555', fontSize: 12 }}>{pct(t.lossRatio)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {t.topAgent && <div><div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{t.topAgent}</div><div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC' }}>{fmt(t.topAgentPremium ?? 0)}</div></div>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'tree',       icon: <Network size={15} />,       label: '组织架构树', labelEn: 'Org Tree' },
  { id: 'relation',   icon: <Link size={15} />,          label: '层级关系管理', labelEn: 'Hierarchy Relations' },
  { id: 'multi',      icon: <Layers size={15} />,        label: '多上级配置', labelEn: 'Multi-parent' },
  { id: 'whitelabel', icon: <Palette size={15} />,       label: 'White-label 配置', labelEn: 'White-label' },
  { id: 'history',    icon: <ArrowRightLeft size={15} />, label: '变更历史', labelEn: 'Change History' },
  { id: 'perf',       icon: <BarChart2 size={15} />,     label: '团队业绩汇总', labelEn: 'Team Performance' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function ChannelHierarchyView({ navigateTo: _navigateTo }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<TabId>('tree')

  const pendingApprovals = pendingChanges.filter(c => c.status === 'pending-approval').length
  const suspendedNodes = channelNodes.filter(n => n.status === 'suspended').length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{lang === 'en' ? 'Channel Hierarchy & Organization Management' : '渠道层级与组织架构管理'}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{lang === 'en' ? 'Org tree · Hierarchy relations · Multi-parent · White-label · Change history · Team performance' : '架构树查看 · 层级关系 · 多上级配置 · White-label · 变更历史 · 团队业绩'}</p>
        </div>
        <div className="flex items-center gap-3">
          {suspendedNodes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {lang === 'en' ? `${suspendedNodes} ${suspendedNodes === 1 ? 'node' : 'nodes'} suspended` : `${suspendedNodes} 个节点已暂停`}
            </div>
          )}
          {pendingApprovals > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Clock size={13} /> {lang === 'en' ? `${pendingApprovals} pending approval${pendingApprovals === 1 ? '' : 's'}` : `${pendingApprovals} 项待审批`}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === t.id ? '#0058BC' : '#717786', border: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.icon}
            {lang === 'en' ? t.labelEn : t.label}
            {t.id === 'relation' && pendingApprovals > 0 && <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingApprovals}</span>}
          </button>
        ))}
      </div>

      {tab === 'tree'       && <OrgTreeTab />}
      {tab === 'relation'   && <RelationManagementTab />}
      {tab === 'multi'      && <MultiParentTab />}
      {tab === 'whitelabel' && <WhiteLabelTab />}
      {tab === 'history'    && <ChangeHistoryTab />}
      {tab === 'perf'       && <TeamPerformanceTab />}
    </div>
  )
}
