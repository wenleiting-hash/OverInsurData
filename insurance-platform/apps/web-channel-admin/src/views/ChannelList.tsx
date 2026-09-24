import { useState, useMemo, Fragment, useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Download, XCircle, Eye, Edit2, MoreHorizontal, ChevronDown, ChevronRight, ChevronLeft, Trash2, X, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercent } from './data/mockData'
import type { Channel } from './data/mockData'
import { channelStore } from './data/mockChannelStore'
import type { ViewId } from '@/App'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TIER_CONFIG: Record<string, { cls: string; labelKey: string }> = {
  Platinum: { cls: 'badge-purple', labelKey: 'tier.platinum' },
  Gold: { cls: 'badge-yellow', labelKey: 'tier.gold' },
  Silver: { cls: 'badge-gray', labelKey: 'tier.silver' },
  Standard: { cls: 'badge-gray', labelKey: 'tier.standard' },
}

const STATUS_ORB: Record<string, string> = {
  active: 'orb-green',
  inactive: 'orb-gray',
  onboarding: 'orb-purple',
  suspended: 'orb-red',
}

const STATUS_LABEL: Record<string, { labelKey: string; color: string }> = {
  active: { labelKey: 'status.active', color: '#1a7a2e' },
  inactive: { labelKey: 'status.inactive', color: '#717786' },
  onboarding: { labelKey: 'status.onboarding', color: '#7a3ba8' },
  suspended: { labelKey: 'status.suspended', color: '#BA1A1A' },
}

const TYPE_LABELS: Record<string, { labelKey: string }> = {
  'Independent Agency': { labelKey: 'type.independent' },
  'Broker': { labelKey: 'type.Broker' },
  'MGA': { labelKey: 'type.MGA' },
  'Wholesale Broker': { labelKey: 'type.wholesale' },
  'Direct': { labelKey: 'type.direct' },
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function ChannelList({ navigateTo }: Props) {
  const { t } = useTranslation('channel')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['c1', 'c2']))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // 渠道数据来自共享 store（编辑保存/删除在会话内即时生效）
  const channelData = useSyncExternalStore(channelStore.subscribe, channelStore.getChannels)
  // 待删除渠道（打开确认弹窗）
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  // 操作菜单（行内 ⋮ 下拉）
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const topLevel = useMemo(() => channelData.filter(c => !c.parentId), [channelData])
  const getChildren = (id: string) => channelData.filter(c => c.parentId === id)

  // 编辑渠道 → 跳转向导表单（edit 模式）
  const openEdit = (id: string) => {
    setMenuFor(null)
    navigateTo('channel-edit', { channelId: id })
  }

  // 删除渠道：父渠道级联删除其子渠道
  const confirmDelete = () => {
    if (!deleteTarget) return
    const target = deleteTarget
    const removedIds = channelStore.removeChannel(target.id)
    setExpanded(prev => {
      const n = new Set(prev)
      for (const id of removedIds) n.delete(id)
      return n
    })
    setDeleteTarget(null)
    setDeleteConfirmed(false)
  }

  // 单个渠道是否满足全部搜索/筛选条件
  const matchesCriteria = (c: Channel): boolean => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.npnCode.toLowerCase().includes(q)
    const matchType = filterType === 'all' || c.type === filterType
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchTier = filterTier === 'all' || c.tier === filterTier
    const matchRegion = filterRegion === 'all' || c.region === filterRegion
    return matchSearch && matchType && matchStatus && matchTier && matchRegion
  }

  // 搜索 + 筛选均同时匹配父渠道与子渠道：父渠道自身或任一子渠道满足全部条件即保留
  const filtered = useMemo(() => {
    return topLevel.filter(c =>
      matchesCriteria(c) || getChildren(c.id).some(matchesCriteria)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterStatus, filterTier, filterRegion, topLevel])

  // 搜索/筛选命中子渠道（父渠道自身未命中）时，自动展开父行
  useEffect(() => {
    const hasActive = !!(search
      || filterType !== 'all'
      || filterStatus !== 'all'
      || filterTier !== 'all'
      || filterRegion !== 'all')
    if (!hasActive) return
    const toExpand = new Set<string>()
    for (const c of topLevel) {
      if (!matchesCriteria(c) && getChildren(c.id).some(matchesCriteria)) {
        toExpand.add(c.id)
      }
    }
    if (toExpand.size > 0) {
      setExpanded(prev => {
        const n = new Set(prev)
        toExpand.forEach(id => n.add(id))
        return n
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterStatus, filterTier, filterRegion, topLevel])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterType, filterStatus, filterTier, filterRegion, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const resetFilters = () => {
    setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterTier('all'); setFilterRegion('all')
  }

  const hasActiveFilter = !!(search || filterType !== 'all' || filterStatus !== 'all' || filterTier !== 'all' || filterRegion !== 'all')

  const totalPremium = channelData.filter(c => !c.parentId).reduce((s, c) => s + c.totalPremium, 0)
  const activeCount = channelData.filter(c => c.status === 'active').length
  const childTotal = channelData.filter(c => c.parentId).length

  // 操作菜单（行内 ⋮ 下拉，编辑 + 删除）
  const renderRowActions = (ch: Channel) => (
    <div className="flex items-center gap-0.5" style={{ position: 'relative' }}>
      {getChildren(ch.id).length > 0 ? (
        <button className="btn-ghost" style={{ padding: 5 }} title={expanded.has(ch.id) ? t('list.collapseSub') : t('list.expandSub')} onClick={() => toggle(ch.id)}>
          <Eye size={14} />
        </button>
      ) : (
        <button className="btn-ghost" style={{ padding: 5 }} title={t('list.view')} onClick={() => openEdit(ch.id)}>
          <Eye size={14} />
        </button>
      )}
      <button className="btn-ghost" style={{ padding: 5 }} title={t('list.editChannel')} onClick={() => openEdit(ch.id)}>
        <Edit2 size={14} />
      </button>
      <button className="btn-ghost" style={{ padding: 5 }} title={t('list.moreActions')} onClick={() => setMenuFor(menuFor === ch.id ? null : ch.id)}>
        <MoreHorizontal size={14} />
      </button>
      {menuFor === ch.id && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuFor(null)} />
          <div
            className="glass-strong"
            style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 50,
              minWidth: 132, borderRadius: 10, padding: '4px',
              boxShadow: '0 8px 24px rgba(0,22,80,0.14)',
              border: '0.5px solid rgba(193,198,215,0.6)',
            }}
          >
            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px' }}
              onClick={() => openEdit(ch.id)}
            >
              <Edit2 size={13} /> {t('list.menuEdit')}
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px', color: '#BA1A1A' }}
              onClick={() => { setMenuFor(null); setDeleteTarget(ch); setDeleteConfirmed(false) }}
            >
              <Trash2 size={13} /> {t('list.deleteChannel')}
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t('listView.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t('listView.subtitle', { total: channelData.length, active: activeCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />{t('export')}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('channel-new')}><Plus size={14} />{t('list.addChannel')}</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: t('listView.kpi.totalPremium'), value: formatCurrency(totalPremium, true), sub: t('listView.kpi.yoyGrowth') },
          { label: t('listView.kpi.activeChannels'), value: `${activeCount}`, sub: t('listView.kpi.totalChannelsSub', { n: channelData.length }) },
          { label: t('listView.kpi.totalAgents'), value: channelData.reduce((s, c) => s + c.agentCount, 0).toLocaleString(), sub: t('listView.kpi.activeAgentsSub') },
          { label: t('listView.kpi.avgRenewalRate'), value: formatPercent(channelData.filter(c => c.status === 'active').reduce((s, c) => s + c.renewalRate, 0) / activeCount), sub: t('listView.kpi.benchmarkSub') },
        ].map(k => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#1a7a2e', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-3 flex-wrap" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input type="text" placeholder={t('list.searchPlaceholder')} className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">{t('filterLabels.type')}</option>
          <option value="Independent Agency">{t('type.independent')}</option>
          <option value="Broker">{t('type.Broker')}</option>
          <option value="MGA">MGA</option>
          <option value="Wholesale Broker">{t('type.wholesale')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">{t('filterLabels.status')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="onboarding">{t('status.onboarding')}</option>
          <option value="suspended">{t('status.suspended')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="all">{t('filterLabels.tier')}</option>
          <option value="Platinum">{t('tier.platinum')}</option>
          <option value="Gold">{t('tier.gold')}</option>
          <option value="Silver">{t('tier.silver')}</option>
          <option value="Standard">{t('tier.standard')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          <option value="all">{t('filterLabels.region')}</option>
          <option value="Northeast">Northeast</option>
          <option value="Southeast">Southeast</option>
          <option value="Midwest">Midwest</option>
          <option value="West">West</option>
        </select>
        {hasActiveFilter && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={resetFilters}>
            <XCircle size={13} /> {t('resetFilter')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll" style={{ '--sc': '32px' } as React.CSSProperties}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>{t('col.name')}</th>
                <th>{t('col.type')}</th>
                <th>{t('col.tier')}</th>
                <th>{t('col.manager')}</th>
                <th style={{ textAlign: 'center' }}>{t('col.agentCount')}</th>
                <th style={{ textAlign: 'right' }}>{t('col.totalPremium')}</th>
                <th style={{ textAlign: 'right' }}>{t('col.policyCount')}</th>
                <th style={{ textAlign: 'right' }}>{t('col.lossRatio')}</th>
                <th style={{ textAlign: 'right' }}>{t('col.renewalRate')}</th>
                <th style={{ textAlign: 'right' }}>{t('col.commissionRate')}</th>
                <th>{t('col.joinDate')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '40px 20px', color: '#717786', fontSize: 13 }}>
                    {hasActiveFilter ? t('list.emptyFiltered') : t('list.empty')}
                  </td>
                </tr>
              )}
              {paged.map(ch => {
                const children = getChildren(ch.id)
                const isExpanded = expanded.has(ch.id)
                const sl = STATUS_LABEL[ch.status]
                const tc = TIER_CONFIG[ch.tier]
                return (
                  <Fragment key={ch.id}>
                    <tr>
                      <td>
                        {children.length > 0 && (
                          <button className="btn-ghost" style={{ padding: 4 }} onClick={() => toggle(ch.id)}>
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{ch.name}</div>
                        <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{ch.npnCode}</div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{t(TYPE_LABELS[ch.type].labelKey)}</span>
                      </td>
                      <td>
                        <span className={`badge ${tc.cls}`} style={{ fontSize: 11.5 }}>{t(tc.labelKey)}</span>
                      </td>
                      <td style={{ fontSize: 13, color: '#414755' }}>{ch.manager}</td>
                      <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {ch.agentCount}
                        {children.length > 0 && (
                          <span style={{ fontSize: 11, color: '#717786', marginLeft: 4 }}>+{children.reduce((s, c) => s + c.agentCount, 0)}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                        {formatCurrency(ch.totalPremium, true)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {ch.policyCount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: ch.lossRatio > 0.65 ? '#BA1A1A' : ch.lossRatio > 0.60 ? '#a05800' : '#1a7a2e' }}>
                          {formatPercent(ch.lossRatio)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {formatPercent(ch.renewalRate)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {(ch.commissionRate * 100).toFixed(0)}%
                      </td>
                      <td style={{ fontSize: 12.5, color: '#717786' }}>{ch.joinDate}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`orb ${STATUS_ORB[ch.status]}`} />
                          <span style={{ fontSize: 12.5, color: sl.color }}>{t(sl.labelKey)}</span>
                        </div>
                      </td>
                      <td>
                        {renderRowActions(ch)}
                      </td>
                    </tr>
                    {isExpanded && children.map(child => {
                      const csl = STATUS_LABEL[child.status]
                      const ctc = TIER_CONFIG[child.tier]
                      return (
                        <tr key={child.id} style={{ background: 'rgba(241,243,254,0.5)' }}>
                          <td />
                          <td>
                            <div style={{ paddingLeft: 20, fontWeight: 500, color: '#414755', fontSize: 13 }}>
                              <span style={{ color: '#C1C6D7', marginRight: 8 }}>└</span>{child.name}
                            </div>
                            <div style={{ paddingLeft: 36, fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{child.npnCode}</div>
                          </td>
                          <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{t(TYPE_LABELS[child.type].labelKey)}</span></td>
                          <td><span className={`badge ${ctc.cls}`} style={{ fontSize: 11 }}>{t(ctc.labelKey)}</span></td>
                          <td style={{ fontSize: 13, color: '#414755' }}>{child.manager}</td>
                          <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{child.agentCount}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{formatCurrency(child.totalPremium, true)}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{child.policyCount.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: child.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>{formatPercent(child.lossRatio)}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{formatPercent(child.renewalRate)}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{(child.commissionRate * 100).toFixed(0)}%</td>
                          <td style={{ fontSize: 12.5, color: '#717786' }}>{child.joinDate}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className={`orb ${STATUS_ORB[child.status]}`} />
                              <span style={{ fontSize: 12.5, color: csl.color }}>{t(csl.labelKey)}</span>
                            </div>
                          </td>
                          <td>
                            {renderRowActions(child)}
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between flex-wrap" style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: '#717786' }}>
            {t('listView.footer', { top: filtered.length, sub: childTotal })}
            {filtered.length > 0 && t('list.pageRange', { start: (safePage - 1) * pageSize + 1, end: Math.min(safePage * pageSize, filtered.length) })}
          </span>
          {filtered.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 12.5, color: '#717786' }}>{t('list.perPage')}</span>
                <select
                  className="input-glass"
                  style={{ fontSize: 12.5, padding: '4px 24px 4px 8px', height: 28 }}
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: 12.5, color: '#717786' }}>{t('list.perPageUnit')}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 8px', opacity: safePage <= 1 ? 0.4 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }}
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12.5, color: '#414755', fontWeight: 500, padding: '0 4px' }}>
                  {safePage} / {totalPages}
                </span>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 8px', opacity: safePage >= totalPages ? 0.4 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }}
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 删除渠道确认弹窗 */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(24,28,35,0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setDeleteTarget(null); setDeleteConfirmed(false) } }}
        >
          <div
            className="glass-strong"
            style={{ width: 520, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px 18px',
              borderBottom: '0.5px solid rgba(193,198,215,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(186,26,26,0.05)',
            }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(186,26,26,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={18} style={{ color: '#BA1A1A' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{t('delModal.title')}</div>
                  <div style={{ fontSize: 12.5, color: '#717786' }}>{deleteTarget.name} · {deleteTarget.npnCode}</div>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => { setDeleteTarget(null); setDeleteConfirmed(false) }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '22px 24px' }}>
              {/* 影响范围 */}
              <div style={{ background: 'rgba(255,149,0,0.07)', border: '0.5px solid rgba(255,149,0,0.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t('delModal.impactTitle')}</span>
                </div>
                {!deleteTarget.parentId && getChildren(deleteTarget.id).length > 0 ? (
                  <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.7 }}>
                    {t('delModal.impactParentBefore')}
                    <strong style={{ color: '#BA1A1A' }}>{t('delModal.impactCount', { n: getChildren(deleteTarget.id).length })}</strong>
                    {(getChildren(deleteTarget.id).length === 1
                      ? t('delModal.impactParentAfterOne', { agents: getChildren(deleteTarget.id).reduce((s, c) => s + c.agentCount, 0) })
                      : t('delModal.impactParentAfter', { agents: getChildren(deleteTarget.id).reduce((s, c) => s + c.agentCount, 0) }))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.7 }}>
                    {t('delModal.impactSingle', { agents: deleteTarget.agentCount })}
                  </div>
                )}
              </div>

              {/* 确认勾选 */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={e => setDeleteConfirmed(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#BA1A1A', width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#414755' }}>
                  {t('delModal.confirmBefore')}
                  <strong style={{ color: '#181C23' }}>{t('delModal.confirmName', { name: deleteTarget.name })}</strong>
                  {t('delModal.confirmAfter')}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => { setDeleteTarget(null); setDeleteConfirmed(false) }}>{t('delModal.cancel')}</button>
              <button
                onClick={confirmDelete}
                disabled={!deleteConfirmed}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 22px',
                  background: deleteConfirmed ? '#BA1A1A' : 'rgba(193,198,215,0.5)',
                  color: deleteConfirmed ? '#fff' : '#717786',
                  borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  cursor: deleteConfirmed ? 'pointer' : 'not-allowed',
                  border: 'none',
                  transition: 'all 140ms',
                }}
              >
                <Trash2 size={14} /> {t('delModal.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
