import { useState, useMemo, Fragment } from 'react'
import { Search, Plus, Download, XCircle, Eye, Edit2, MoreHorizontal, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react'
import { channels, formatCurrency, formatPercent } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TIER_CONFIG: Record<string, { cls: string; label: string }> = {
  Platinum: { cls: 'badge-purple', label: '铂金' },
  Gold: { cls: 'badge-yellow', label: '金级' },
  Silver: { cls: 'badge-gray', label: '银级' },
  Standard: { cls: 'badge-gray', label: '标准' },
}

const STATUS_ORB: Record<string, string> = {
  active: 'orb-green',
  inactive: 'orb-gray',
  onboarding: 'orb-purple',
  suspended: 'orb-red',
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  active: { text: '活跃', color: '#1a7a2e' },
  inactive: { text: '停用', color: '#717786' },
  onboarding: { text: '入驻中', color: '#7a3ba8' },
  suspended: { text: '已暂停', color: '#BA1A1A' },
}

const TYPE_LABELS: Record<string, string> = {
  'Independent Agency': '独立代理',
  'Broker': '经纪商',
  'MGA': 'MGA',
  'Wholesale Broker': '批发经纪',
  'Direct': '直销',
}

export default function ChannelList({ navigateTo }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['c1', 'c2']))

  const topLevel = channels.filter(c => !c.parentId)
  const getChildren = (id: string) => channels.filter(c => c.parentId === id)

  const filtered = useMemo(() => {
    return topLevel.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.npnCode.toLowerCase().includes(q)
      const matchType = filterType === 'all' || c.type === filterType
      const matchStatus = filterStatus === 'all' || c.status === filterStatus
      const matchTier = filterTier === 'all' || c.tier === filterTier
      const matchRegion = filterRegion === 'all' || c.region === filterRegion
      return matchSearch && matchType && matchStatus && matchTier && matchRegion
    })
  }, [search, filterType, filterStatus, filterTier, filterRegion])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const totalPremium = channels.filter(c => !c.parentId).reduce((s, c) => s + c.totalPremium, 0)
  const activeCount = channels.filter(c => c.status === 'active').length

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>渠道列表</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>共 {channels.length} 个渠道 · {activeCount} 个活跃</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />导出</button>
          <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />新增渠道</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '渠道总保费', value: formatCurrency(totalPremium, true), sub: '↑ 11.3% YoY' },
          { label: '活跃渠道', value: `${activeCount}`, sub: `共 ${channels.length} 个渠道` },
          { label: '总代理人数', value: channels.reduce((s, c) => s + c.agentCount, 0).toLocaleString(), sub: '在职代理人' },
          { label: '平均续保率', value: formatPercent(channels.filter(c => c.status === 'active').reduce((s, c) => s + c.renewalRate, 0) / activeCount), sub: 'vs 基准 80%' },
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
          <input type="text" placeholder="搜索渠道名称、NPN编码…" className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">渠道类型</option>
          <option value="Independent Agency">独立代理</option>
          <option value="Broker">经纪商</option>
          <option value="MGA">MGA</option>
          <option value="Wholesale Broker">批发经纪</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">渠道状态</option>
          <option value="active">活跃</option>
          <option value="onboarding">入驻中</option>
          <option value="suspended">已暂停</option>
          <option value="inactive">停用</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="all">渠道等级</option>
          <option value="Platinum">铂金</option>
          <option value="Gold">金级</option>
          <option value="Silver">银级</option>
          <option value="Standard">标准</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          <option value="all">大区</option>
          <option value="Northeast">Northeast</option>
          <option value="Southeast">Southeast</option>
          <option value="Midwest">Midwest</option>
          <option value="West">West</option>
        </select>
        {(search || filterType !== 'all' || filterStatus !== 'all' || filterTier !== 'all' || filterRegion !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={() => { setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterTier('all'); setFilterRegion('all') }}>
            <XCircle size={13} /> 重置
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>渠道名称</th>
                <th>渠道类型</th>
                <th>等级</th>
                <th>负责人</th>
                <th style={{ textAlign: 'center' }}>代理人数</th>
                <th style={{ textAlign: 'right' }}>总保费</th>
                <th style={{ textAlign: 'right' }}>保单数</th>
                <th style={{ textAlign: 'right' }}>赔付率</th>
                <th style={{ textAlign: 'right' }}>续保率</th>
                <th style={{ textAlign: 'right' }}>佣金率</th>
                <th>入驻日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => {
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
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{TYPE_LABELS[ch.type]}</span>
                      </td>
                      <td>
                        <span className={`badge ${tc.cls}`} style={{ fontSize: 11.5 }}>{tc.label}</span>
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
                          <span style={{ fontSize: 12.5, color: sl.color }}>{sl.text}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-0.5">
                          <button className="btn-ghost" style={{ padding: 5 }}><Eye size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }}><Edit2 size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }}><MoreHorizontal size={14} /></button>
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
                          <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{TYPE_LABELS[child.type]}</span></td>
                          <td><span className={`badge ${ctc.cls}`} style={{ fontSize: 11 }}>{ctc.label}</span></td>
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
                              <span style={{ fontSize: 12.5, color: csl.color }}>{csl.text}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-0.5">
                              <button className="btn-ghost" style={{ padding: 5 }}><Eye size={14} /></button>
                              <button className="btn-ghost" style={{ padding: 5 }}><Edit2 size={14} /></button>
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
        <div style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
          <span style={{ fontSize: 12.5, color: '#717786' }}>共 {filtered.length} 个一级渠道 · {channels.filter(c => c.parentId).length} 个子渠道</span>
        </div>
      </div>
    </div>
  )
}
