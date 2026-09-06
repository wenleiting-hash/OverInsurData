import { useState, useMemo, Fragment, useEffect, useSyncExternalStore } from 'react'
import { Search, Plus, Download, XCircle, Eye, Edit2, MoreHorizontal, ChevronDown, ChevronRight, ChevronLeft, Trash2, X, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercent } from '../data/mockData'
import type { Channel } from '../data/mockData'
import { channelStore } from '../data/channelStore'
import { useLang } from '../i18n'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TIER_CONFIG: Record<string, { cls: string; zh: string; en: string }> = {
  Platinum: { cls: 'badge-purple', zh: '铂金', en: 'Platinum' },
  Gold: { cls: 'badge-yellow', zh: '金级', en: 'Gold' },
  Silver: { cls: 'badge-gray', zh: '银级', en: 'Silver' },
  Standard: { cls: 'badge-gray', zh: '标准', en: 'Standard' },
}

const STATUS_ORB: Record<string, string> = {
  active: 'orb-green',
  inactive: 'orb-gray',
  onboarding: 'orb-purple',
  suspended: 'orb-red',
}

const STATUS_LABEL: Record<string, { zh: string; en: string; color: string }> = {
  active: { zh: '活跃', en: 'Active', color: '#1a7a2e' },
  inactive: { zh: '停用', en: 'Inactive', color: '#717786' },
  onboarding: { zh: '入驻中', en: 'Onboarding', color: '#7a3ba8' },
  suspended: { zh: '已暂停', en: 'Suspended', color: '#BA1A1A' },
}

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  'Independent Agency': { zh: '独立代理', en: 'Independent Agency' },
  'Broker': { zh: '经纪商', en: 'Broker' },
  'MGA': { zh: 'MGA', en: 'MGA' },
  'Wholesale Broker': { zh: '批发经纪', en: 'Wholesale Broker' },
  'Direct': { zh: '直销', en: 'Direct' },
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function ChannelList({ navigateTo }: Props) {
  const { lang } = useLang()
  const en = lang === 'en'
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

  const totalPremium = channelData.filter(c => !c.parentId).reduce((s, c) => s + c.totalPremium, 0)
  const activeCount = channelData.filter(c => c.status === 'active').length
  const childTotal = channelData.filter(c => c.parentId).length

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{en ? 'Channels' : '渠道列表'}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {en
              ? `${channelData.length} channel${channelData.length !== 1 ? 's' : ''} · ${activeCount} active`
              : `共 ${channelData.length} 个渠道 · ${activeCount} 个活跃`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />{en ? 'Export' : '导出'}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('channel-new')}><Plus size={14} />{en ? 'Add Channel' : '新增渠道'}</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: en ? 'Total Channel Premium' : '渠道总保费', value: formatCurrency(totalPremium, true), sub: '↑ 11.3% YoY' },
          { label: en ? 'Active Channels' : '活跃渠道', value: `${activeCount}`, sub: en ? `${channelData.length} channels total` : `共 ${channelData.length} 个渠道` },
          { label: en ? 'Total Agents' : '总代理人数', value: channelData.reduce((s, c) => s + c.agentCount, 0).toLocaleString(), sub: en ? 'Active agents' : '在职代理人' },
          { label: en ? 'Avg. Renewal Rate' : '平均续保率', value: formatPercent(channelData.filter(c => c.status === 'active').reduce((s, c) => s + c.renewalRate, 0) / activeCount), sub: en ? 'vs 80% benchmark' : 'vs 基准 80%' },
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
          <input type="text" placeholder={en ? 'Search channel name, NPN code…' : '搜索渠道名称、NPN编码…'} className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">{en ? 'Channel Type' : '渠道类型'}</option>
          <option value="Independent Agency">{en ? 'Independent Agency' : '独立代理'}</option>
          <option value="Broker">{en ? 'Broker' : '经纪商'}</option>
          <option value="MGA">MGA</option>
          <option value="Wholesale Broker">{en ? 'Wholesale Broker' : '批发经纪'}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">{en ? 'Status' : '渠道状态'}</option>
          <option value="active">{en ? 'Active' : '活跃'}</option>
          <option value="onboarding">{en ? 'Onboarding' : '入驻中'}</option>
          <option value="suspended">{en ? 'Suspended' : '已暂停'}</option>
          <option value="inactive">{en ? 'Inactive' : '停用'}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="all">{en ? 'Tier' : '渠道等级'}</option>
          <option value="Platinum">{en ? 'Platinum' : '铂金'}</option>
          <option value="Gold">{en ? 'Gold' : '金级'}</option>
          <option value="Silver">{en ? 'Silver' : '银级'}</option>
          <option value="Standard">{en ? 'Standard' : '标准'}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          <option value="all">{en ? 'Region' : '大区'}</option>
          <option value="Northeast">Northeast</option>
          <option value="Southeast">Southeast</option>
          <option value="Midwest">Midwest</option>
          <option value="West">West</option>
        </select>
        {(search || filterType !== 'all' || filterStatus !== 'all' || filterTier !== 'all' || filterRegion !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={resetFilters}>
            <XCircle size={13} /> {en ? 'Reset' : '重置'}
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
                <th>{en ? 'Channel Name' : '渠道名称'}</th>
                <th>{en ? 'Type' : '渠道类型'}</th>
                <th>{en ? 'Tier' : '等级'}</th>
                <th>{en ? 'Manager' : '负责人'}</th>
                <th style={{ textAlign: 'center' }}>{en ? 'Agents' : '代理人数'}</th>
                <th style={{ textAlign: 'right' }}>{en ? 'Total Premium' : '总保费'}</th>
                <th style={{ textAlign: 'right' }}>{en ? 'Policies' : '保单数'}</th>
                <th style={{ textAlign: 'right' }}>{en ? 'Loss Ratio' : '赔付率'}</th>
                <th style={{ textAlign: 'right' }}>{en ? 'Renewal' : '续保率'}</th>
                <th style={{ textAlign: 'right' }}>{en ? 'Commission' : '佣金率'}</th>
                <th>{en ? 'Join Date' : '入驻日期'}</th>
                <th>{en ? 'Status' : '状态'}</th>
                <th>{en ? 'Actions' : '操作'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '40px 20px', color: '#717786', fontSize: 13 }}>
                    {search || filterType !== 'all' || filterStatus !== 'all' || filterTier !== 'all' || filterRegion !== 'all'
                      ? (en ? 'No channels match the current filters' : '没有符合条件的渠道')
                      : (en ? 'No channel data yet' : '暂无渠道数据')}
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
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{TYPE_LABELS[ch.type][lang]}</span>
                      </td>
                      <td>
                        <span className={`badge ${tc.cls}`} style={{ fontSize: 11.5 }}>{tc[lang]}</span>
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
                          <span style={{ fontSize: 12.5, color: sl.color }}>{sl[lang]}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-0.5" style={{ position: 'relative' }}>
                          {children.length > 0 ? (
                            <button className="btn-ghost" style={{ padding: 5 }} title={isExpanded ? (en ? 'Collapse sub-channels' : '收起子渠道') : (en ? 'Expand sub-channels' : '查看子渠道')} onClick={() => toggle(ch.id)}>
                              <Eye size={14} />
                            </button>
                          ) : (
                            <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'View' : '查看'} onClick={() => openEdit(ch.id)}>
                              <Eye size={14} />
                            </button>
                          )}
                          <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'Edit channel' : '编辑渠道'} onClick={() => openEdit(ch.id)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'More actions' : '更多操作'} onClick={() => setMenuFor(menuFor === ch.id ? null : ch.id)}>
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
                                  <Edit2 size={13} /> {en ? 'Edit Channel' : '编辑渠道'}
                                </button>
                                <button
                                  className="btn-ghost"
                                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px', color: '#BA1A1A' }}
                                  onClick={() => { setMenuFor(null); setDeleteTarget(ch); setDeleteConfirmed(false) }}
                                >
                                  <Trash2 size={13} /> {en ? 'Delete Channel' : '删除渠道'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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
                          <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{TYPE_LABELS[child.type][lang]}</span></td>
                          <td><span className={`badge ${ctc.cls}`} style={{ fontSize: 11 }}>{ctc[lang]}</span></td>
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
                              <span style={{ fontSize: 12.5, color: csl.color }}>{csl[lang]}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-0.5" style={{ position: 'relative' }}>
                              <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'View' : '查看'} onClick={() => openEdit(child.id)}>
                                <Eye size={14} />
                              </button>
                              <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'Edit channel' : '编辑渠道'} onClick={() => openEdit(child.id)}>
                                <Edit2 size={14} />
                              </button>
                              <button className="btn-ghost" style={{ padding: 5 }} title={en ? 'More actions' : '更多操作'} onClick={() => setMenuFor(menuFor === child.id ? null : child.id)}>
                                <MoreHorizontal size={14} />
                              </button>
                              {menuFor === child.id && (
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
                                      onClick={() => openEdit(child.id)}
                                    >
                                      <Edit2 size={13} /> {en ? 'Edit Channel' : '编辑渠道'}
                                    </button>
                                    <button
                                      className="btn-ghost"
                                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px', color: '#BA1A1A' }}
                                      onClick={() => { setMenuFor(null); setDeleteTarget(child); setDeleteConfirmed(false) }}
                                    >
                                      <Trash2 size={13} /> {en ? 'Delete Channel' : '删除渠道'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
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
            {en
              ? `${filtered.length} parent channel${filtered.length !== 1 ? 's' : ''} · ${childTotal} sub-channel${childTotal !== 1 ? 's' : ''}`
              : `共 ${filtered.length} 个一级渠道 · ${childTotal} 个子渠道`}
            {filtered.length > 0 && (en
              ? ` · Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`
              : ` · 第 ${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filtered.length)} 条`)}
          </span>
          {filtered.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 12.5, color: '#717786' }}>{en ? 'Per page' : '每页'}</span>
                <select
                  className="input-glass"
                  style={{ fontSize: 12.5, padding: '4px 24px 4px 8px', height: 28 }}
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: 12.5, color: '#717786' }}>{en ? 'per page' : '条'}</span>
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
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{en ? 'Delete Channel' : '删除渠道'}</div>
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
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{en ? 'Deletion impact' : '删除影响范围'}</span>
                </div>
                {!deleteTarget.parentId && getChildren(deleteTarget.id).length > 0 ? (
                  <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.7 }}>
                    {en ? (
                      <>This will delete the parent channel along with its <strong style={{ color: '#BA1A1A' }}>{getChildren(deleteTarget.id).length}</strong> sub-channel{getChildren(deleteTarget.id).length !== 1 ? 's' : ''} (covering {getChildren(deleteTarget.id).reduce((s, c) => s + c.agentCount, 0)} agents). Product authorizations, commission plans and in-progress settlement statements will be voided. This action is recorded in the audit log.</>
                    ) : (
                      <>将同时删除该一级渠道及其下属<strong style={{ color: '#BA1A1A' }}> {getChildren(deleteTarget.id).length} </strong>个子渠道（含 {getChildren(deleteTarget.id).reduce((s, c) => s + c.agentCount, 0)} 名代理人）。该渠道名下的产品授权、佣金方案与进行中的结算单将一并失效，操作记录会写入审计日志。</>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.7 }}>
                    {en
                      ? `This will delete the channel profile (${deleteTarget.agentCount} agents). Its product authorizations, commission plans and in-progress settlement statements will be voided. This action is recorded in the audit log.`
                      : `将删除该渠道档案（${deleteTarget.agentCount} 名代理人），其产品授权、佣金方案与进行中的结算单将一并失效，操作记录会写入审计日志。`}
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
                  {en ? (
                    <>I understand the impact and confirm deletion of <strong style={{ color: '#181C23' }}>{deleteTarget.name}</strong>. This cannot be undone.</>
                  ) : (
                    <>我已了解此操作的影响范围，确认删除<strong style={{ color: '#181C23' }}> {deleteTarget.name}</strong>，删除后不可恢复。</>
                  )}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => { setDeleteTarget(null); setDeleteConfirmed(false) }}>{en ? 'Cancel' : '取消'}</button>
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
                <Trash2 size={14} /> {en ? 'Delete' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
