import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Plus, Download, XCircle, MoreHorizontal, Eye, Edit2, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react'
import { products, insurers, formatCurrency, formatPercent } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
  onStatusChange: (id: string) => void
}

const LINE_COLORS: Record<string, string> = {
  Auto: 'badge-blue', Home: 'badge-green', Commercial: 'badge-purple',
  Cyber: 'badge-red', Life: 'badge-orange', Travel: 'badge-gray',
  Professional: 'badge-yellow', D_O: 'badge-red',
}

type SortKey = 'name' | 'premium' | 'lossRatio' | 'renewalRate' | 'policyCount'
type SortDir = 'asc' | 'desc'

export default function ProductList({ navigateTo, onStatusChange }: Props) {
  const [search, setSearch] = useState('')
  const [filterInsurer, setFilterInsurer] = useState('all')
  const [filterLine, setFilterLine] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('premium')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreMenuId) return
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreMenuId])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      const matchInsurer = filterInsurer === 'all' || p.insurerId === filterInsurer
      const matchLine = filterLine === 'all' || p.line === filterLine
      const matchStatus = filterStatus === 'all' || p.status === filterStatus
      return matchSearch && matchInsurer && matchLine && matchStatus
    })
  }, [search, filterInsurer, filterLine, filterStatus])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey === 'premium' ? 'premium' : sortKey] as number | string
      const bv = (b as any)[sortKey === 'premium' ? 'premium' : sortKey] as number | string
      const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} style={{ opacity: 0.3 }} />
  )

  const statusLabels: Record<string, { cls: string; orb: string; label: string }> = {
    'on-sale': { cls: 'badge-green', orb: 'orb-green', label: '在售' },
    'off-sale': { cls: 'badge-gray', orb: 'orb-gray', label: '停售' },
    'paused': { cls: 'badge-yellow', orb: 'orb-yellow', label: '暂停' },
    'pending': { cls: 'badge-purple', orb: 'orb-purple', label: '待审核' },
  }

  const lines = [...new Set(products.map(p => p.line))]

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>产品管理</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>共 {products.length} 个产品 · {filtered.length} 条结果</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />导出</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('product-new')}>
            <Plus size={14} />新增产品
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-3 flex-wrap" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input type="text" placeholder="搜索产品名称、产品代码…" className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)}>
          <option value="all">全部保险公司</option>
          {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterLine} onChange={e => setFilterLine(e.target.value)}>
          <option value="all">业务线</option>
          {lines.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">产品状态</option>
          <option value="on-sale">在售</option>
          <option value="off-sale">停售</option>
          <option value="paused">暂停销售</option>
          <option value="pending">待审核</option>
        </select>
        {(search || filterInsurer !== 'all' || filterLine !== 'all' || filterStatus !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={() => { setSearch(''); setFilterInsurer('all'); setFilterLine('all'); setFilterStatus('all') }}>
            <XCircle size={13} /> 重置
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="glass-light flex items-center gap-3 px-4 py-2.5 mb-3" style={{ borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>已选 {selected.size} 项</span>
          <button className="btn-ghost" style={{ fontSize: 12.5 }}><ToggleRight size={13} />批量上架</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}><ToggleRight size={13} />批量下架</button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>取消选择</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll" style={{ '--sc': '40px' } as React.CSSProperties}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0}
                    onChange={() => selected.size === sorted.length ? setSelected(new Set()) : setSelected(new Set(sorted.map(p => p.id)))}
                    style={{ cursor: 'pointer' }} />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <span className="flex items-center gap-1">产品名称 <SortIcon k="name" /></span>
                </th>
                <th>产品代码</th>
                <th>所属保险公司</th>
                <th>业务线</th>
                <th>产品类型</th>
                <th>可售州数</th>
                <th onClick={() => handleSort('premium')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">总保费 <SortIcon k="premium" /></span>
                </th>
                <th onClick={() => handleSort('policyCount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">保单数 <SortIcon k="policyCount" /></span>
                </th>
                <th onClick={() => handleSort('lossRatio')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">赔付率 <SortIcon k="lossRatio" /></span>
                </th>
                <th onClick={() => handleSort('renewalRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">续保率 <SortIcon k="renewalRate" /></span>
                </th>
                <th>上架日期</th>
                <th>状态</th>
                <th style={{ width: 90 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const ins = insurers.find(i => i.id === p.insurerId)!
                const sc = statusLabels[p.status]
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigateTo('product-detail', { productId: p.id })}>
                    <td onClick={e => { e.stopPropagation(); toggleSelect(p.id) }}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#717786' }}>{p.subLine}</div>
                    </td>
                    <td>
                      <span className="font-data" style={{ fontSize: 12, color: '#414755', background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.code}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>
                      <div>{ins?.shortName}</div>
                      <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>NAIC {ins?.naicCode}</div>
                    </td>
                    <td>
                      <span className={`badge ${LINE_COLORS[p.line] || 'badge-gray'}`} style={{ fontSize: 11.5 }}>{p.line}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{p.type === 'Individual' ? '个人险' : p.type === 'Group' ? '团体险' : '自愿福利险'}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.states[0] === 'ALL' ? <span className="badge badge-blue" style={{ fontSize: 11 }}>全国</span> : p.states.length}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(p.premium, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.policyCount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: p.lossRatio > 0.65 ? '#BA1A1A' : p.lossRatio > 0.60 ? '#a05800' : '#1a7a2e' }}>
                        {formatPercent(p.lossRatio)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {formatPercent(p.renewalRate)}
                    </td>
                    <td style={{ fontSize: 12.5, color: '#717786' }}>{p.launchDate}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`orb ${sc.orb}`} />
                        <span style={{ fontSize: 12.5 }}>{sc.label}</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button className="btn-ghost" style={{ padding: 5 }} title="查看详情"
                          onClick={() => navigateTo('product-detail', { productId: p.id })}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 5 }} title="编辑"
                          onClick={() => navigateTo('product-edit', { productId: p.id })}>
                          <Edit2 size={14} />
                        </button>
                        <div style={{ position: 'relative' }} ref={moreMenuId === p.id ? moreMenuRef : null}>
                          <button className="btn-ghost" style={{ padding: 5, background: moreMenuId === p.id ? 'rgba(0,88,188,0.08)' : undefined }} title="更多操作"
                            onClick={e => { e.stopPropagation(); setMoreMenuId(prev => prev === p.id ? null : p.id) }}>
                            <MoreHorizontal size={14} />
                          </button>
                          {moreMenuId === p.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 128, padding: '4px 0' }}>
                              <button style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: p.status === 'on-sale' ? '#B06000' : '#1a7a2e', display: 'flex', alignItems: 'center', gap: 7 }}
                                onClick={() => { onStatusChange(p.id); setMoreMenuId(null) }}>
                                <ToggleRight size={13} />{p.status === 'on-sale' ? '下架' : '上架'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
          <span style={{ fontSize: 12.5, color: '#717786' }}>共 {sorted.length} 条产品记录</span>
        </div>
      </div>
    </div>
  )
}
