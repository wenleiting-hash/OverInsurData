import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Network, Plus, Edit2, XCircle, Link, ArrowRightLeft, Palette,
  BarChart2, ChevronRight, ChevronDown, Check, X, AlertTriangle,
  Users, Layers, Search, Loader2,
  Globe, Smartphone, FileText, Zap,
  CheckCircle2, Clock,
} from 'lucide-react'
import type { ViewId } from '@/App'
import {
  channelNodes, hierarchyRelations, pendingChanges, whiteLabelConfigs, teamPerfSummary,
  buildChildrenMap, getNodeById,
  NODE_TYPE_LABEL, NODE_TYPE_COLOR, STATUS_STYLE, CHANGE_TYPE_LABEL,
  type ChannelNode, type NodeType, type WhiteLabelConfig,
} from './data/channelHierarchyData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>{children}</span>
}
function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
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
  const { t } = useTranslation('channel')
  const children = (childrenMap[node.id] || []).map(id => getNodeById(id)).filter(Boolean) as ChannelNode[]
  const hasChildren = children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const typeColor = NODE_TYPE_COLOR[node.type]
  const statusSt = STATUS_STYLE[node.status]
  const isMultiParent = node.parentIds.length > 1

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
              {isMultiParent && <span title={t('hierarchy.multiParentTip')} style={{ fontSize: 9.5, background: 'rgba(0,88,188,0.12)', color: '#0058BC', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>{t('hierarchy.multiParent')}</span>}
              {node.status !== 'active' && <Badge bg={statusSt.bg} color={statusSt.color}>{t(statusSt.label)}</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, background: `${typeColor}12`, color: typeColor, borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>{t(NODE_TYPE_LABEL[node.type])}</span>
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

// ── Tab 1 — Org tree ──────────────────────────────────────────────────────────

function OrgTreeTab() {
  const { t } = useTranslation('channel')
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('hierarchy.searchPlaceholder')} className="input-glass" style={{ paddingLeft: 30, width: '100%', fontSize: 12.5 }} />
          </div>
          <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
            {(['all', 'region', 'agency', 'branch', 'agent'] as const).map(ft => (
              <button key={ft} onClick={() => setFilterType(ft)} style={{ padding: '3px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: filterType === ft ? `1.5px solid ${ft === 'all' ? '#0058BC' : NODE_TYPE_COLOR[ft]}` : '1px solid rgba(193,198,215,0.4)', background: filterType === ft ? `${ft === 'all' ? '#0058BC' : NODE_TYPE_COLOR[ft]}10` : 'rgba(255,255,255,0.5)', color: filterType === ft ? (ft === 'all' ? '#0058BC' : NODE_TYPE_COLOR[ft]) : '#717786', cursor: 'pointer' }}>
                {ft === 'all' ? t('hierarchy.filterAll') : t(NODE_TYPE_LABEL[ft])}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3" style={{ fontSize: 10.5, color: '#A0A5B1', flexWrap: 'wrap' }}>
          {(['region', 'agency', 'branch', 'agent'] as NodeType[]).map(nt => (
            <span key={nt} className="flex items-center gap-1">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[nt], display: 'inline-block' }} />
              {t(NODE_TYPE_LABEL[nt])}
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
          <span>{t('hierarchy.statTotalPre')} <strong style={{ color: '#181C23' }}>{channelNodes.length - 1}</strong> {t('hierarchy.statTotalSuf')}</span>
          <span>·</span>
          <span>{t('hierarchy.statMultiParentPre')} <strong style={{ color: '#0058BC' }}>{multiParentNodes.length}</strong> {t('hierarchy.statMultiParentSuf')}</span>
          <span>·</span>
          <span>{t('hierarchy.statSuspendedPre')} <strong style={{ color: '#C0392B' }}>{channelNodes.filter(n => n.status === 'suspended').length}</strong> {t('hierarchy.statSuspendedSuf')}</span>
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
                      <Badge bg={`${NODE_TYPE_COLOR[selected.type]}12`} color={NODE_TYPE_COLOR[selected.type]}>{t(NODE_TYPE_LABEL[selected.type])}</Badge>
                      <Badge bg={STATUS_STYLE[selected.status].bg} color={STATUS_STYLE[selected.status].color}>{t(STATUS_STYLE[selected.status].label)}</Badge>
                      {selected.parentIds.length > 1 && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t('hierarchy.multiParentCount', { n: selected.parentIds.length })}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Edit2 size={12} />{t('hierarchy.edit')}</button>
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} />{t('hierarchy.terminate')}</button>
                </div>
              </div>
            </Card>

            {/* Two-column info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{t('hierarchy.basicInfo')}</div>
                {[
                  ['joinDate', selected.joinDate],
                  ['primaryState', selected.primaryState],
                  selected.npn ? ['npn', selected.npn] : null,
                  selected.contractId ? ['contractId', selected.contractId] : null,
                  selected.managerName ? ['manager', selected.managerName] : null,
                  selected.email ? ['email', selected.email] : null,
                ].filter(Boolean).map((row) => {
                  const [k, v] = row as string[]
                  return (
                    <div key={k} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', padding: '6px 0', fontSize: 12 }}>
                      <span style={{ color: '#717786' }}>{t(`hierarchy.${k}`)}</span>
                      <span style={{ fontWeight: 600, color: '#181C23', fontFamily: k === 'npn' || k === 'contractId' ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
                    </div>
                  )
                })}
              </Card>

              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{t('hierarchy.perfMetrics')}</div>
                {[
                  ['ytdPremium', fmt(selected.ytdPremium), '#0058BC'],
                  ['ytdCommission', fmt(selected.ytdCommission), '#1E8033'],
                  ['lossRatio', pct(selected.lossRatio), selected.lossRatio > 0.65 ? '#C0392B' : selected.lossRatio > 0.62 ? '#B06000' : '#1E8033'],
                  ['renewalRate', pct(selected.renewalRate), selected.renewalRate > 0.9 ? '#1E8033' : '#B06000'],
                  ['teamSize', selected.teamSize.toString(), '#181C23'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', padding: '6px 0', fontSize: 12 }}>
                    <span style={{ color: '#717786' }}>{t(`hierarchy.${k}`)}</span>
                    <span style={{ fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* Parent relations */}
            {selected.parentIds.length > 0 && (
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{t('hierarchy.parentRelations')}</div>
                {selected.parentIds.map((pid, i) => {
                  const parent = getNodeById(pid)
                  if (!parent) return null
                  const rel = hierarchyRelations.find(r => r.childId === selected.id && r.parentId === pid)
                  return (
                    <div key={pid} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: i < selected.parentIds.length - 1 ? '0.5px solid rgba(193,198,215,0.25)' : 'none' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[parent.type] }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{parent.name}</span>
                        {pid === selected.primaryParentId && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t('hierarchy.primaryParent')}</Badge>}
                      </div>
                      {rel && (
                        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#717786' }}>
                          {t('hierarchy.revenueShare')} <strong style={{ color: '#0058BC' }}>{pct(rel.revenueShare)}</strong>
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
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const }}>{t('hierarchy.childNodes', { n: (childrenMap[selected.id] || []).length })}</div>
                <div className="flex flex-col gap-1">
                  {(childrenMap[selected.id] || []).map(cid => {
                    const child = getNodeById(cid)
                    if (!child) return null
                    return (
                      <div key={cid} className="flex items-center justify-between" style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(249,249,255,0.6)', cursor: 'pointer' }} onClick={() => setSelected(child)}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_TYPE_COLOR[child.type] }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{child.name}</span>
                          <Badge bg={`${NODE_TYPE_COLOR[child.type]}12`} color={NODE_TYPE_COLOR[child.type]}>{t(NODE_TYPE_LABEL[child.type])}</Badge>
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
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('hierarchy.selectNodeHint')}</span>
          </Card>
        )}
      </div>
    </div>
  )
}

// ── Tab 2 — Relation management (add / adjust / terminate) ────────────────────

function RelationManagementTab() {
  const { t } = useTranslation('channel')
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
        {([['add', t('hierarchy.subTab.add')], ['adjust', t('hierarchy.subTab.adjust')], ['terminate', t('hierarchy.subTab.terminate')]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: subTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: subTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: subTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{t('hierarchy.subTab.add')}</div>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.formChildNode')}</label>
                <select value={addForm.childId} onChange={e => setAddForm(f => ({ ...f, childId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{t('hierarchy.selectNodePlaceholder')}</option>
                  {nodeOptions.map(n => <option key={n.id} value={n.id}>{n.name} [{t(NODE_TYPE_LABEL[n.type])}]</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.formParentNode')}</label>
                <select value={addForm.parentId} onChange={e => setAddForm(f => ({ ...f, parentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{t('hierarchy.selectParentPlaceholder')}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name} [{t(NODE_TYPE_LABEL[n.type])}]</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.revenueSharePct')}</label>
                <input type="number" min={0} max={100} value={addForm.revenueShare} onChange={e => setAddForm(f => ({ ...f, revenueShare: parseInt(e.target.value) }))} className="input-glass" style={{ width: '100%', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 4 }}>{t('hierarchy.shareSumHint')}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={addForm.isPrimary} onChange={e => setAddForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                <label htmlFor="isPrimary" style={{ fontSize: 13, color: '#181C23', cursor: 'pointer' }}>{t('hierarchy.setPrimary')}</label>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5, color: '#4A6A9C' }}>
                {t('hierarchy.primaryNote')}
              </div>
              <button onClick={doSubmit} disabled={!addForm.childId || !addForm.parentId || submitting} style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: addForm.childId && addForm.parentId ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', border: 'none', cursor: addForm.childId && addForm.parentId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" />{t('hierarchy.submitting')}</> : <><Check size={13} />{t('hierarchy.submitAdd')}</>}
              </button>
            </div>
          </Card>

          {/* Preview */}
          <Card style={{ background: 'rgba(0,88,188,0.03)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t('hierarchy.relationPreview')}</div>
            {addForm.childId && addForm.parentId ? (() => {
              const child = getNodeById(addForm.childId)
              const parent = getNodeById(addForm.parentId)
              if (!child || !parent) return null
              return (
                <div className="flex flex-col gap-3">
                  <div style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${NODE_TYPE_COLOR[parent.type]}`, background: `${NODE_TYPE_COLOR[parent.type]}08` }}>
                    <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 3 }}>{t('hierarchy.parentSide', { type: t(NODE_TYPE_LABEL[parent.type]) })}</div>
                    <div style={{ fontWeight: 700, color: '#181C23' }}>{parent.name}</div>
                  </div>
                  <div className="flex justify-center"><div style={{ width: 2, height: 20, background: '#C1C6D7', borderRadius: 1 }} /></div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${NODE_TYPE_COLOR[child.type]}`, background: `${NODE_TYPE_COLOR[child.type]}08` }}>
                    <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 3 }}>{t('hierarchy.childSide', { type: t(NODE_TYPE_LABEL[child.type]) })}</div>
                    <div style={{ fontWeight: 700, color: '#181C23' }}>{child.name}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 12.5 }}>
                    <div className="flex justify-between"><span style={{ color: '#717786' }}>{t('hierarchy.revenueShare')}</span><span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#1E8033' }}>{addForm.revenueShare}%</span></div>
                    <div className="flex justify-between mt-1"><span style={{ color: '#717786' }}>{t('hierarchy.relationType')}</span><span style={{ fontWeight: 700, color: '#0058BC' }}>{addForm.isPrimary ? t('hierarchy.primaryParent') : t('hierarchy.secondaryParent')}</span></div>
                  </div>
                </div>
              )
            })() : <div style={{ textAlign: 'center', color: '#C1C6D7', paddingTop: 40, fontSize: 13 }}>{t('hierarchy.selectFirst')}</div>}
          </Card>
        </div>
      )}

      {subTab === 'adjust' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{t('hierarchy.subTab.adjust')}</div>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.selectNode')}</label>
                <select value={adjustForm.nodeId} onChange={e => setAdjustForm(f => ({ ...f, nodeId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{t('hierarchy.selectAdjustNode')}</option>
                  {nodeOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.currentParent')}</label>
                <select value={adjustForm.currentParentId} onChange={e => setAdjustForm(f => ({ ...f, currentParentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{t('hierarchy.selectCurrentParent')}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#A0A5B1' }}>
                <ArrowRightLeft size={16} />
                <span style={{ fontSize: 12 }}>{t('hierarchy.adjustTo')}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.newParent')}</label>
                <select value={adjustForm.newParentId} onChange={e => setAdjustForm(f => ({ ...f, newParentId: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                  <option value="">{t('hierarchy.selectNewParent')}</option>
                  {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.effectiveDate')}</label>
                <input type="date" value={adjustForm.effectiveDate} onChange={e => setAdjustForm(f => ({ ...f, effectiveDate: e.target.value }))} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.adjustReason')}</label>
                <textarea value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder={t('hierarchy.adjustReasonPlaceholder')} className="input-glass" style={{ width: '100%', fontSize: 13, resize: 'vertical' }} />
              </div>
              <button onClick={doSubmit} disabled={submitting} style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" />{t('hierarchy.submitting')}</> : <><ArrowRightLeft size={13} />{t('hierarchy.submitAdjust')}</>}
              </button>
            </div>
          </Card>

          {/* Pending changes list */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('hierarchy.pendingChanges')}</div>
            <div className="flex flex-col gap-3">
              {pendingChanges.filter(c => c.changeType === 'move-parent' || c.changeType === 'add-parent').map(c => {
                const statusS = c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t('hierarchy.status.pendingApproval') } : c.status === 'approved' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: t('hierarchy.status.approved') } : { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t('hierarchy.status.rejected') }
                return (
                  <Card key={c.id} style={{ padding: '12px 14px' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t(CHANGE_TYPE_LABEL[c.changeType])}</Badge>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.nodeName}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#717786' }}>{c.fromParentName} → {c.toParentName}</div>
                        <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 3 }}>{t('hierarchy.requestInfo', { name: c.requestedBy, date: c.effectiveDate })}</div>
                      </div>
                      <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    </div>
                    {/* 本系统没有任何审批流程：这两个按钮不是「批准 / 拒绝」，而是对待生效变更的
                        行政处置——「生效」（提前启用）与「作废」（放弃该变更）。 */}
                    {c.status === 'pending-approval' && (
                      <div className="flex gap-2 mt-3">
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#1E8033', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} />{t('hierarchy.approve')}</button>
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}><X size={11} />{t('hierarchy.reject')}</button>
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
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><AlertTriangle size={13} />{t('hierarchy.terminateNoticeTitle')}</div>
            {t('hierarchy.terminateNoticeBody')}
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                  {['child', 'parent', 'relationType', 'effectiveDate', 'revenueShare', 'status', 'actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{t(`hierarchy.th.${h}`)}</th>
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
                        <div style={{ fontSize: 11, color: '#717786' }}><span style={{ background: `${NODE_TYPE_COLOR[child.type]}12`, color: NODE_TYPE_COLOR[child.type], borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>{t(NODE_TYPE_LABEL[child.type])}</span></div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23', fontSize: 12.5 }}>{parent.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {r.isPrimary ? <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t('hierarchy.primaryParent')}</Badge> : <Badge bg="rgba(180,180,180,0.15)" color="#717786">{t('hierarchy.secondaryParent')}</Badge>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{r.startDate}</td>
                      <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', fontSize: 12.5 }}>{pct(r.revenueShare)}</td>
                      <td style={{ padding: '10px 14px' }}><Badge bg="rgba(52,199,89,0.1)" color="#1E8033">{t('hierarchy.status.activeRel')}</Badge></td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => setTerminateId(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>{t('hierarchy.terminate')}</button>
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
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{t('hierarchy.confirmTerminateTitle')}</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.effectiveDate')}</label>
                    <input type="date" className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('hierarchy.terminateReason')}</label>
                    {(['contractExpired', 'channelApplied', 'complianceViolation', 'reorg', 'other'] as const).map(rk => (
                      <label key={rk} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="term-reason" />{t(`hierarchy.reason.${rk}`)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setTerminateId(null)}>{t('hierarchy.cancel')}</button>
                  <button onClick={() => setTerminateId(null)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#C0392B', color: '#fff', border: 'none', cursor: 'pointer' }}>{t('hierarchy.confirmTerminate')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab 3 — Multi-parent config ───────────────────────────────────────────────

function MultiParentTab() {
  const { t } = useTranslation('channel')
  const multiNodes = channelNodes.filter(n => n.parentIds.length > 1)
  const [editNodeId, setEditNodeId] = useState<string | null>(null)

  return (
    <div>
      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5, color: '#3A5A8C', marginBottom: 20 }}>
        <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 3 }}><Link size={13} />{t('hierarchy.multiParentIntroTitle')}</div>
        {t('hierarchy.multiParentIntroBody')}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('hierarchy.multiParentNodes', { n: multiNodes.length })}</div>
        {multiNodes.length === 0 ? (
          <Card style={{ textAlign: 'center', color: '#A0A5B1', padding: '40px 20px' }}>{t('hierarchy.noMultiParentNodes')}</Card>
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
                    <div style={{ fontSize: 11.5, color: '#717786' }}>{t(NODE_TYPE_LABEL[node.type])} · {t('hierarchy.parentCount', { n: node.parentIds.length })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: total === 1 ? '#1E8033' : '#C0392B', fontWeight: 700, background: total === 1 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', padding: '3px 9px', borderRadius: 7 }}>
                    {t('hierarchy.shareTotal', { share: pct(total) })}
                    {total !== 1 && ` ⚠ ${t('hierarchy.needsAdjust')}`}
                  </span>
                  <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditNodeId(isEditing ? null : node.id)}>{isEditing ? t('hierarchy.collapse') : t('hierarchy.editShare')}</button>
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
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{t(NODE_TYPE_LABEL[parent.type])}</div>
                      </div>
                      {rel.isPrimary && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t('hierarchy.primaryParent')}</Badge>}
                      {isEditing ? (
                        <input type="number" min={0} max={100} defaultValue={Math.round(rel.revenueShare * 100)} className="input-glass" style={{ width: 80, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC', minWidth: 50, textAlign: 'right' }}>{pct(rel.revenueShare)}</span>
                      )}
                      <span style={{ fontSize: 11, color: '#A0A5B1', minWidth: 20 }}>{t('hierarchy.shareSuffix')}</span>
                    </div>
                  )
                })}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 mt-3">
                  <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setEditNodeId(null)}>{t('hierarchy.cancel')}</button>
                  <button style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setEditNodeId(null)}>{t('hierarchy.saveShare')}</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Pending multi-parent change */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('hierarchy.pendingMultiChanges')}</div>
        <div className="flex flex-col gap-3">
          {pendingChanges.filter(c => c.changeType === 'add-parent' || c.changeType === 'remove-parent').map(c => {
            const statusS = c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t('hierarchy.status.pendingApproval') } : { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: t('hierarchy.status.approved') }
            return (
              <Card key={c.id} style={{ padding: '12px 14px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t(CHANGE_TYPE_LABEL[c.changeType])}</Badge>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.nodeName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786' }}>{t('hierarchy.addParentInfo', { name: c.toParentName ?? '—', share: c.newRevenueShare ? pct(c.newRevenueShare) : '—' })}</div>
                    <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 2 }}>{t('hierarchy.reasonPrefix', { reason: c.reason })}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    {/* 同上：图标按钮为「生效 / 作废」，不是审批。 */}
                    {c.status === 'pending-approval' && (
                      <>
                        <button className="btn-ghost" title={t('hierarchy.approve')} style={{ padding: '5px 12px', fontSize: 12, color: '#1E8033' }}><Check size={11} /></button>
                        <button className="btn-ghost" title={t('hierarchy.reject')} style={{ padding: '5px 12px', fontSize: 12, color: '#C0392B' }}><X size={11} /></button>
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

// ── Tab 4 — White-label brand config ──────────────────────────────────────────

function WhiteLabelTab() {
  const { t } = useTranslation('channel')
  const [editing, setEditing] = useState<WhiteLabelConfig | null>(null)
  const [showNew, setShowNew] = useState(false)

  const statusS = (s: string) => s === 'active' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: t('hierarchy.wlStatus.active') } : s === 'draft' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t('hierarchy.wlStatus.draft') } : { bg: 'rgba(180,180,180,0.15)', color: '#717786', label: t('hierarchy.wlStatus.disabled') }

  const featureIcons: Record<string, ReactNode> = {
    customQuotePage: <Globe size={12} />, whiteLabelApp: <Smartphone size={12} />, brandedPolicyDocs: <FileText size={12} />,
    customReportCovers: <FileText size={12} />, apiIntegration: <Zap size={12} />, customerPortal: <Globe size={12} />,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t('hierarchy.wlTitle', { n: whiteLabelConfigs.length })}</div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> {t('hierarchy.wlAdd')}
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
                <div style={{ width: 24, height: 24, borderRadius: 6, background: wl.primaryColor, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} title={t('hierarchy.wlPrimaryColorTip', { color: wl.primaryColor })} />
                <div style={{ width: 24, height: 24, borderRadius: 6, background: wl.secondaryColor, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} title={t('hierarchy.wlSecondaryColorTip', { color: wl.secondaryColor })} />
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{wl.primaryColor} / {wl.secondaryColor}</span>
              </div>

              {/* Domain / email */}
              <div className="flex flex-col gap-1 mb-3" style={{ fontSize: 12 }}>
                {wl.domain && <div><span style={{ color: '#717786' }}>{t('hierarchy.wlDomainLabel')}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0058BC' }}>{wl.domain}</span></div>}
                {wl.emailDomain && <div><span style={{ color: '#717786' }}>{t('hierarchy.wlEmailDomainLabel')}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>@{wl.emailDomain}</span></div>}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {([[t('hierarchy.wlToggle.portal'), wl.portalEnabled], [t('hierarchy.wlToggle.mobileApp'), wl.mobileAppEnabled], [t('hierarchy.wlToggle.docTemplates'), wl.customDocTemplates], [t('hierarchy.wlToggle.brandedReports'), wl.reportingBranded], [t('hierarchy.wlToggle.api'), wl.apiEnabled]] as [string, boolean][]).map(([label, enabled]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, background: enabled ? 'rgba(52,199,89,0.1)' : 'rgba(180,180,180,0.12)', color: enabled ? '#1E8033' : '#A0A5B1', borderRadius: 6, padding: '2px 8px' }}>
                    {enabled ? <CheckCircle2 size={10} /> : <X size={10} />}{label}
                  </span>
                ))}
              </div>

              {/* Features */}
              <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.3)', paddingTop: 10 }}>
                <div style={{ fontSize: 10.5, color: '#A0A5B1', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('hierarchy.wlFeaturesTitle')}</div>
                <div className="flex flex-wrap gap-1">
                  {wl.features.map(f => (
                    <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, background: `${wl.primaryColor}12`, color: wl.primaryColor, borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                      {featureIcons[f]}{t(`hierarchy.wlFeature.${f}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 10.5, color: '#C1C6D7' }}>{t('hierarchy.wlLastModified', { date: wl.lastModified })}</div>
            </Card>
          )
        })}

        {/* Add placeholder */}
        <button onClick={() => setShowNew(true)} style={{ borderRadius: 14, border: '2px dashed rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A0A5B1', minHeight: 220 }}>
          <Plus size={22} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t('hierarchy.wlAdd')}</span>
        </button>
      </div>

      {/* Edit / New modal */}
      {(editing || showNew) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 20, width: 560, padding: '28px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>{editing ? t('hierarchy.wlEditTitle') : t('hierarchy.wlAdd')}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => { setEditing(null); setShowNew(false) }}><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {([
                { label: t('hierarchy.wlFieldChannel'), type: 'select' },
                { label: t('hierarchy.wlFieldBrand'), type: 'text', placeholder: t('hierarchy.wlBrandPlaceholder'), value: editing?.brandName },
                { label: t('hierarchy.wlFieldDomain'), type: 'text', placeholder: 'portal.channelname.com', value: editing?.domain },
                { label: t('hierarchy.wlFieldEmailDomain'), type: 'text', placeholder: 'channelname.com', value: editing?.emailDomain },
              ] as Array<{ label: string; type: 'select' | 'text'; placeholder?: string; value?: string }>).map(f => (
                <div key={f.label}>
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{t('hierarchy.wlPrimaryColorLabel')}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue={editing?.primaryColor ?? '#0058BC'} style={{ width: 36, height: 36, padding: 2, borderRadius: 8, border: '1px solid rgba(193,198,215,0.4)', cursor: 'pointer' }} />
                    <input type="text" defaultValue={editing?.primaryColor ?? '#0058BC'} className="input-glass" style={{ flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{t('hierarchy.wlSecondaryColorLabel')}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue={editing?.secondaryColor ?? '#60CDFF'} style={{ width: 36, height: 36, padding: 2, borderRadius: 8, border: '1px solid rgba(193,198,215,0.4)', cursor: 'pointer' }} />
                    <input type="text" defaultValue={editing?.secondaryColor ?? '#60CDFF'} className="input-glass" style={{ flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 8 }}>{t('hierarchy.wlFeatureModules')}</label>
                <div className="flex flex-col gap-2">
                  {(['customerPortal', 'whiteLabelApp', 'brandedPolicyDocs', 'customReportCovers', 'apiIntegration', 'customQuotePage'] as const).map(f => (
                    <label key={f} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" defaultChecked={editing?.features.includes(f)} />{t(`hierarchy.wlFeature.${f}`)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => { setEditing(null); setShowNew(false) }}>{t('hierarchy.cancel')}</button>
              <button style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setEditing(null); setShowNew(false) }}>{t('hierarchy.wlSave')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 5 — Change history ────────────────────────────────────────────────────

function ChangeHistoryTab() {
  const { t, i18n } = useTranslation('channel')
  const isEn = i18n.language.startsWith('en')
  const allChanges = [
    ...pendingChanges.map(c => ({ ...c, date: c.requestDate, typeLabel: CHANGE_TYPE_LABEL[c.changeType], node: c.nodeName, actor: c.requestedBy, desc: isEn ? (c.reasonEn ?? c.reason) : c.reason })),
    { id: 'ch1', date: '2026-07-12', typeLabel: 'hierarchy.changeType.add-relation', node: 'Rocky Mountain Insurance Advisors', actor: 'Admin', desc: t('hierarchy.histDesc.ch1'), status: 'approved', changeType: 'add-relation' as const },
    { id: 'ch2', date: '2026-06-10', typeLabel: 'hierarchy.histType.suspend', node: 'NE Professional Services', actor: 'Zhang Wei', desc: t('hierarchy.histDesc.ch2'), status: 'approved', changeType: 'adjust-share' as const },
    { id: 'ch3', date: '2026-05-20', typeLabel: 'hierarchy.changeType.add-parent', node: 'Ryan Chen', actor: 'Marcus Lee', desc: t('hierarchy.histDesc.ch3'), status: 'approved', changeType: 'add-parent' as const },
    { id: 'ch4', date: '2026-03-01', typeLabel: 'hierarchy.changeType.add-relation', node: 'PC Seattle Branch', actor: 'Sarah Chen', desc: t('hierarchy.histDesc.ch4'), status: 'approved', changeType: 'add-relation' as const },
  ]

  const changeTypeColor: Record<string, string> = {
    'hierarchy.changeType.add-relation': '#1E8033', 'hierarchy.changeType.move-parent': '#0058BC', 'hierarchy.changeType.add-parent': '#7B3FCA',
    'hierarchy.changeType.remove-parent': '#B06000', 'hierarchy.changeType.terminate': '#C0392B', 'hierarchy.changeType.adjust-share': '#717786',
    'hierarchy.histType.suspend': '#C0392B',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t('hierarchy.historyTitle')}</div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Search size={12} /> {t('hierarchy.search')}
          </button>
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRightLeft size={12} /> {t('hierarchy.filter')}
          </button>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 0, position: 'relative' }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: 11, top: 8, bottom: 0, width: 2, background: 'rgba(193,198,215,0.35)', borderRadius: 1 }} />

        {allChanges.sort((a, b) => b.date.localeCompare(a.date)).map((c, i) => {
          const color = changeTypeColor[c.typeLabel] ?? '#717786'
          const statusS = c.status === 'approved' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: t('hierarchy.status.approved') } : c.status === 'pending-approval' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t('hierarchy.status.pendingApproval') } : { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t('hierarchy.status.rejected') }
          return (
            <div key={c.id} style={{ display: 'flex', gap: 16, paddingBottom: i < allChanges.length - 1 ? 16 : 0, position: 'relative' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, marginTop: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              </div>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(193,198,215,0.3)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 11.5, fontWeight: 700, background: `${color}12`, color, borderRadius: 5, padding: '2px 7px' }}>{t(c.typeLabel)}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{c.node}</span>
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                  </div>
                  <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{c.date}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: '#717786' }}>{c.desc}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, color: '#A0A5B1' }}>{t('hierarchy.operatorLabel', { actor: c.actor })}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 6 — Team performance summary ──────────────────────────────────────────

function TeamPerformanceTab() {
  const { t } = useTranslation('channel')
  const [viewLevel, setViewLevel] = useState<'region' | 'agency'>('region')
  const data = teamPerfSummary.filter(tp => viewLevel === 'region' ? tp.nodeType === 'region' : tp.nodeType === 'agency')

  const topTeam = data.reduce((best, tp) => (!best || tp.ytdPremium > best.ytdPremium ? tp : best), data[0])
  const avgAchievement = data.reduce((s, tp) => s + tp.achievementRate, 0) / data.length
  const avgRenewal = data.reduce((s, tp) => s + tp.renewalRate, 0) / data.length

  const chartData = data.map(tp => ({
    name: tp.nodeName.length > 14 ? tp.nodeName.slice(0, 14) + '…' : tp.nodeName,
    actual: Math.round(tp.ytdPremium / 1e6 * 10) / 10,
    target: Math.round(tp.ytdTarget / 1e6 * 10) / 10,
    achievement: Math.round(tp.achievementRate * 100),
  }))

  const tierStyle = (rate: number) => rate >= 1.10 ? { label: 'S', bg: '#AF52DE', color: '#fff' } : rate >= 1.0 ? { label: 'A', bg: '#34C759', color: '#fff' } : rate >= 0.90 ? { label: 'B', bg: '#FF9F0A', color: '#fff' } : { label: 'C', bg: '#FF3B30', color: '#fff' }

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t('hierarchy.perf.totalTeams'), value: data.length.toString(), color: '#0058BC' },
          { label: t('hierarchy.perf.achievementRateLabel'), value: pct(data.filter(tp => tp.achievementRate >= 1.0).length / data.length), color: '#1E8033' },
          { label: t('hierarchy.perf.avgAchievement'), value: pct(avgAchievement), color: avgAchievement >= 1.0 ? '#1E8033' : '#B06000' },
          { label: t('hierarchy.perf.avgRenewal'), value: pct(avgRenewal), color: '#7B3FCA' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setViewLevel('region')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: viewLevel === 'region' ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: viewLevel === 'region' ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: viewLevel === 'region' ? '#0058BC' : '#717786', cursor: 'pointer' }}>{t('hierarchy.perf.regionView')}</button>
        <button onClick={() => setViewLevel('agency')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: viewLevel === 'agency' ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: viewLevel === 'agency' ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: viewLevel === 'agency' ? '#0058BC' : '#717786', cursor: 'pointer' }}>{t('hierarchy.perf.agencyView')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Achievement bar chart */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('hierarchy.perf.chartTitle')}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '']} />
              <ReferenceLine y={0} stroke="rgba(193,198,215,0.3)" />
              <Bar dataKey="target" name={t('hierarchy.perf.target')} fill="rgba(193,198,215,0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name={t('hierarchy.perf.actual')} radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.achievement >= 100 ? '#34C759' : e.achievement >= 90 ? '#FF9F0A' : '#FF3B30'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Renewal rate comparison */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('hierarchy.perf.renewalLossTitle')}</div>
          <div className="flex flex-col gap-3">
            {data.sort((a, b) => b.renewalRate - a.renewalRate).map(tp => (
              <div key={tp.nodeId} className="flex items-center gap-3">
                <div style={{ width: 100, fontSize: 11.5, fontWeight: 600, color: '#181C23', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.nodeName.split(' ')[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                      <div style={{ width: `${((tp.renewalRate - 0.80) / 0.15) * 100}%`, height: '100%', background: '#0058BC', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', width: 38, textAlign: 'right' }}>{pct(tp.renewalRate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                      <div style={{ width: `${(tp.lossRatio / 0.75) * 100}%`, height: '100%', background: tp.lossRatio > 0.65 ? '#FF3B30' : tp.lossRatio > 0.62 ? '#FF9F0A' : '#34C759', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: tp.lossRatio > 0.65 ? '#C0392B' : '#555', width: 38, textAlign: 'right' }}>{pct(tp.lossRatio)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-8" style={{ fontSize: 11, color: '#A0A5B1', paddingTop: 4 }}>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 3, borderRadius: 2, background: '#0058BC', display: 'inline-block' }} />{t('hierarchy.perf.renewalRate')}</span>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 3, borderRadius: 2, background: '#FF9F0A', display: 'inline-block' }} />{t('hierarchy.perf.lossRatio')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Team ranking table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t('hierarchy.perf.rankingTitle')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['tier', 'teamName', 'parent', 'memberCount', 'ytdPremium', 'achievement', 'newPolicies', 'renewalRate', 'lossRatio', 'topAgent'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{t(`hierarchy.perf.th.${h}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sort((a, b) => b.achievementRate - a.achievementRate).map((tp, i) => {
              const ts = tierStyle(tp.achievementRate)
              return (
                <tr key={tp.nodeId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: ts.color }}>{ts.label}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{tp.nodeName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#717786' }}>{tp.parentName ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{tp.memberCount}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{tp.ytdPremium >= 1e6 ? '$' + (tp.ytdPremium / 1e6).toFixed(1) + 'M' : '$' + (tp.ytdPremium / 1e3).toFixed(0) + 'K'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, tp.achievementRate * 80)}%`, height: '100%', background: tp.achievementRate >= 1.0 ? '#34C759' : '#FF9F0A', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12.5, color: tp.achievementRate >= 1.0 ? '#1E8033' : '#B06000' }}>{pct(tp.achievementRate)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{tp.newPolicies.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: tp.renewalRate > 0.9 ? '#1E8033' : '#B06000', fontSize: 12 }}>{pct(tp.renewalRate)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: tp.lossRatio > 0.65 ? '#C0392B' : '#555', fontSize: 12 }}>{pct(tp.lossRatio)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {tp.topAgent && <div><div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{tp.topAgent}</div><div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC' }}>{fmt(tp.topAgentPremium ?? 0)}</div></div>}
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
  { id: 'tree',       icon: <Network size={15} />,       label: 'hierarchy.tab.tree' },
  { id: 'relation',   icon: <Link size={15} />,          label: 'hierarchy.tab.relation' },
  { id: 'multi',      icon: <Layers size={15} />,        label: 'hierarchy.tab.multi' },
  { id: 'whitelabel', icon: <Palette size={15} />,       label: 'hierarchy.tab.whitelabel' },
  { id: 'history',    icon: <ArrowRightLeft size={15} />, label: 'hierarchy.tab.history' },
  { id: 'perf',       icon: <BarChart2 size={15} />,     label: 'hierarchy.tab.perf' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function ChannelHierarchyView({ navigateTo: _navigateTo }: Props) {
  const { t } = useTranslation('channel')
  const [tab, setTab] = useState<TabId>('tree')

  // 待生效变更数。本系统没有任何审批流程，这只是 effectiveDate 尚未到达的层级调整数量。
  const pendingEffectiveCount = pendingChanges.filter(c => c.status === 'pending-approval').length
  const suspendedNodes = channelNodes.filter(n => n.status === 'suspended').length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('hierarchy.pageTitle')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{t('hierarchy.pageDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          {suspendedNodes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {t('hierarchy.suspendedAlert', { n: suspendedNodes })}
            </div>
          )}
          {pendingEffectiveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Clock size={13} /> {t('hierarchy.pendingAlert', { n: pendingEffectiveCount })}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === tabItem.id ? 700 : 500, background: tab === tabItem.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === tabItem.id ? '#0058BC' : '#717786', border: tab === tabItem.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === tabItem.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {tabItem.icon}
            {t(tabItem.label)}
            {tabItem.id === 'relation' && pendingEffectiveCount > 0 && <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingEffectiveCount}</span>}
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
