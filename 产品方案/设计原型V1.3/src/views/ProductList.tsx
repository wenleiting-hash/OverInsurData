import { useState, useMemo } from 'react'
import { Search, Plus, Download, XCircle, Eye, Edit2, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react'
import { products, insurers, formatCurrency, formatPercent } from '../data/mockData'
import { useLang } from '../i18n'
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
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [filterInsurer, setFilterInsurer] = useState('all')
  const [filterLine, setFilterLine] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('premium')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

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
    'on-sale': { cls: 'badge-green', orb: 'orb-green', label: t.prdStatusOnSale },
    'off-sale': { cls: 'badge-gray', orb: 'orb-gray', label: t.prdStatusOffSale },
    'paused': { cls: 'badge-yellow', orb: 'orb-yellow', label: t.prdStatusPaused },
    'pending': { cls: 'badge-purple', orb: 'orb-purple', label: t.prdStatusPending },
  }

  const lines = [...new Set(products.map(p => p.line))]

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t.prdTitle}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>{t.prdCountSummary(products.length, filtered.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />{t.prdExport}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('product-new')}>
            <Plus size={14} />{t.prdNewProduct}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-3 flex-wrap" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input type="text" placeholder={t.prdSearchPlaceholder} className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)}>
          <option value="all">{t.prdAllInsurers}</option>
          {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterLine} onChange={e => setFilterLine(e.target.value)}>
          <option value="all">{t.prdLblLine}</option>
          {lines.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">{t.prdFilterStatus}</option>
          <option value="on-sale">{t.prdStatusOnSale}</option>
          <option value="off-sale">{t.prdStatusOffSale}</option>
          <option value="paused">{t.prdStatusPausedSales}</option>
          <option value="pending">{t.prdStatusPending}</option>
        </select>
        {(search || filterInsurer !== 'all' || filterLine !== 'all' || filterStatus !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={() => { setSearch(''); setFilterInsurer('all'); setFilterLine('all'); setFilterStatus('all') }}>
            <XCircle size={13} /> {t.prdReset}
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="glass-light flex items-center gap-3 px-4 py-2.5 mb-3" style={{ borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>{t.prdSelectedCount(selected.size)}</span>
          <button className="btn-ghost" style={{ fontSize: 12.5 }}><ToggleRight size={13} />{t.prdBulkList}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}><ToggleRight size={13} />{t.prdBulkDelist}</button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>{t.prdClearSelection}</button>
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
                  <span className="flex items-center gap-1">{t.prdColName} <SortIcon k="name" /></span>
                </th>
                <th>{t.prdLblCode}</th>
                <th>{t.prdColInsurer}</th>
                <th>{t.prdLblLine}</th>
                <th>{t.prdLblType}</th>
                <th>{t.prdColStates}</th>
                <th onClick={() => handleSort('premium')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t.prdLblPremium} <SortIcon k="premium" /></span>
                </th>
                <th onClick={() => handleSort('policyCount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t.prdLblPolicies} <SortIcon k="policyCount" /></span>
                </th>
                <th onClick={() => handleSort('lossRatio')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t.prdLblLossRatio} <SortIcon k="lossRatio" /></span>
                </th>
                <th onClick={() => handleSort('renewalRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t.prdLblRenewal} <SortIcon k="renewalRate" /></span>
                </th>
                <th>{t.prdLblLaunch}</th>
                <th>{t.prdColStatus}</th>
                <th style={{ width: 90 }}>{t.prdColActions}</th>
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
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{p.type === 'Individual' ? t.prdTypeIndividual : p.type === 'Group' ? t.prdTypeGroup : t.prdTypeVoluntary}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.states[0] === 'ALL' ? <span className="badge badge-blue" style={{ fontSize: 11 }}>{t.prdNationwide}</span> : p.states.length}
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
                        <button className="btn-ghost" style={{ padding: 5 }} title={t.prdViewDetail}
                          onClick={() => navigateTo('product-detail', { productId: p.id })}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 5 }} title={t.prdEdit}
                          onClick={() => navigateTo('product-edit', { productId: p.id })}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 5 }} title={p.status === 'on-sale' ? t.prdDelist : t.prdList}
                          onClick={() => onStatusChange(p.id)}>
                          <ToggleRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
          <span style={{ fontSize: 12.5, color: '#717786' }}>{t.prdFooterCount(sorted.length)}</span>
        </div>
      </div>
    </div>
  )
}
