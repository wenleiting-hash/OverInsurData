// Product List View - Core page for product management (功能点 10-14)
// Features: List query, filtering, sorting, pagination, batch actions, CRUD navigation
// Fully aligned with UI-V1.2 design spec

import { useState, useMemo } from 'react'
import { 
  Plus, Search, XCircle, MoreHorizontal, Eye, Edit2, ToggleRight, ChevronUp, ChevronDown,
  Download
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import type { InsuranceProduct } from './data/mockProductData'
import { products, formatCurrency, formatPercent } from './data/mockProductData'

interface Props {
  navigateTo: (view: ViewId) => void
  onStatusChange?: (id: string) => void
}

const LINE_COLORS: Record<string, string> = {
  Auto: 'badge-blue', Home: 'badge-green', Commercial: 'badge-purple',
  Cyber: 'badge-red', Life: 'badge-orange', Travel: 'badge-gray',
  Professional: 'badge-yellow', D_O: 'badge-red',
}

type SortKey = 'name' | 'premium' | 'lossRatio' | 'renewalRate' | 'policyCount'
type SortDir = 'asc' | 'desc'

export default function ProductList({ navigateTo, onStatusChange }: Props) {
  const { t, i18n } = useTranslation('product')
  
  const [search, setSearch] = useState('')
  const [filterInsurer, setFilterInsurer] = useState<string>('all')
  const [filterLine, setFilterLine] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('premium')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.productName.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q)
      const matchInsurer = filterInsurer === 'all' || p.insurerName === filterInsurer
      const matchLine = filterLine === 'all' || p.lineOfBusiness === filterLine
      const matchStatus = filterStatus === 'all' || p.status === filterStatus
      return matchSearch && matchInsurer && matchLine && matchStatus
    })
  }, [search, filterInsurer, filterLine, filterStatus])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey === 'premium' ? 'premiumYTD' : sortKey]
      const bv = (b as any)[sortKey === 'premium' ? 'premiumYTD' : sortKey]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
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
    'Active': { cls: 'badge-green', orb: '', label: t('values.statusOnSale') },
    'Paused': { cls: 'badge-yellow', orb: '', label: t('values.statusPaused') },
    'Inactive': { cls: 'badge-gray', orb: '', label: t('values.statusOffSale') },
    'Pending': { cls: 'badge-purple', orb: '', label: t('values.statusPending') },
  }

  const insurerOptions = useMemo(() => Array.from(new Set(products.map(p => p.insurerName))), [])
  const lineOptions = useMemo(() => [...new Set(products.map(p => p.lineOfBusiness))], [])


  const handleExport = () => {
    const headers = ['产品名称', '公司', '业务线', '状态', '本年保费', '保单数', '赔付率']
    const csvData = sorted.map((p: InsuranceProduct) => [
      `"${p.productName}"`,
      p.insurerName,
      p.lineOfBusiness,
      t(`values.status${p.status}`),
      formatCurrency(p.premiumYTD ?? 0, true),
      p.policyCount?.toLocaleString() ?? 'N/A',
      formatPercent(p.lossRatio ?? 0),
    ].join(','))
    
    const csvContent = [headers.join(','), ...csvData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 36px' }}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t('pages.productManagement')}</h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>共 {products.length} 个产品 · {filtered.length} 条结果</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={handleExport}>
              <Download size={14} />{t('actions.export')}
            </button>
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('product-new')}>
              <Plus size={14} />{t('actions.addProduct')}
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
            {insurerOptions.map(insurer => <option key={insurer} value={insurer}>{insurer}</option>)}
          </select>
          <select className="input-glass" style={{ fontSize: 13 }} value={filterLine} onChange={e => setFilterLine(e.target.value)}>
            <option value="all">业务线</option>
            {lineOptions.map(line => <option key={line} value={line}>{t(`values.lob${line}`)}</option>)}
          </select>
          <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">产品状态</option>
            <option value="on-sale">{t('values.statusOnSale')}</option>
            <option value="off-sale">{t('values.statusOffSale')}</option>
            <option value="paused">{t('values.statusPaused')}</option>
            <option value="pending">{t('values.statusPending')}</option>
          </select>
          {(search || filterInsurer !== 'all' || filterLine !== 'all' || filterStatus !== 'all') && (
            <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
              onClick={() => { setSearch(''); setFilterInsurer('all'); setFilterLine('all'); setFilterStatus('all') }}>
              <XCircle size={13} /> {t('filters.resetFilters')}
            </button>
          )}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="glass-light flex items-center gap-3 px-4 py-2.5 mb-3" style={{ borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>已选 {selected.size} 项</span>
            <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => {
              if(onStatusChange) sorted.forEach(p => onStatusChange(p.productId))
            }}>
              <ToggleRight size={13} />{t('bulkActions.batchActivate')}
            </button>
            <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>
              {t('bulkActions.cancelSelection')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table">
              <thead>
              <tr>
                <th style={{ width: 40 }} data-col="priority">
                  <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0}
                    onChange={() => selected.size === sorted.length ? setSelected(new Set()) : setSelected(new Set(sorted.map(p => p.productId)))}
                    style={{ cursor: 'pointer' }} />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', width: 220 }} data-col="priority" className="sticky-first">
                  <span className="flex items-center gap-1">{t('tables.productName')} <SortIcon k="name" /></span>
                </th>
                <th style={{ width: 100 }} data-col="priority" className="sticky-first">{t('tables.productCode')}</th>
                <th>{t('tables.insurerName')}</th>
                <th>{t('tables.lineOfBusiness')}</th>
                <th>{t('tables.type')}</th>
                <th>{t('tables.availableStates')}</th>
                <th onClick={() => handleSort('premium')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('tables.premiumYTD')} <SortIcon k="premium" /></span>
                </th>
                <th onClick={() => handleSort('policyCount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('tables.policyCount')} <SortIcon k="policyCount" /></span>
                </th>
                <th onClick={() => handleSort('lossRatio')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('tables.lossRatio')} <SortIcon k="lossRatio" /></span>
                </th>
                <th onClick={() => handleSort('renewalRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('tables.renewalRate')} <SortIcon k="renewalRate" /></span>
                </th>
                <th>{t('tables.effectiveDate')}</th>
                <th className="sticky-right" data-col="status">{t('tables.status')}</th>
                <th className="sticky-right" style={{ width: 90 }} data-col="actions">{t('tables.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const sc = statusLabels[p.status]
                return (
                  <tr key={p.productId} style={{ cursor: 'pointer' }} onClick={() => navigateTo('product-detail')}>
                    <td onClick={e => { e.stopPropagation(); toggleSelect(p.productId) }}>
                      <input type="checkbox" checked={selected.has(p.productId)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td className="sticky-first" style={{ width: 220 }}>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{p.productName}</div>
                      <div style={{ fontSize: 11, color: '#717786' }}>{t(`values.${p.subLine}`)}</div>
                    </td>
                    <td className="sticky-first" style={{ width: 100 }}>
                      <span className="font-data" style={{ fontSize: 12, color: '#414755', background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.productCode}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>
                      <div>{p.insurerName}</div>
                      <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>NAIC {p.naicCode}</div>
                    </td>
                    <td>
                      <span className={`badge ${LINE_COLORS[p.lineOfBusiness] || 'badge-gray'}`} style={{ fontSize: 11.5 }}>{t(`values.lob${p.lineOfBusiness}`)}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{t(`values.type${p.type === 'Individual' ? 'Individual' : p.type === 'Group' ? 'Group' : 'VoluntaryBenefits'}`)}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.availableStates.length === 50 ? <span className="badge badge-blue" style={{ fontSize: 11 }}>全国</span> : p.availableStates.length}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(p.premiumYTD ?? 0, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.policyCount?.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: (p.lossRatio ?? 0) > 0.65 ? '#BA1A1A' : (p.lossRatio ?? 0) > 0.60 ? '#a05800' : '#1a7a2e' }}>
                        {formatPercent(p.lossRatio ?? 0)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {formatPercent(p.renewalRate ?? 0)}
                    </td>
                    <td style={{ width: 110, fontSize: 12.5, color: '#717786' }}>
                      {new Date(p.effectiveDate).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td style={{ width: 75 }} data-col="status" className="sticky-right">
                      <span className={`badge ${sc.cls}`} style={{ fontSize: 11 }}> {t(`values.status${p.status === 'Active' ? 'OnSale' : p.status === 'Paused' ? 'Paused' : p.status === 'Inactive' ? 'OffSale' : 'Pending'}`)}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ width: 90, position: 'relative' }} data-col="actions" className="sticky-right">
                      <button className="btn-ghost" title={t('actions.more')} style={{ padding: '8px', borderRadius: 8 }}>
                        <MoreHorizontal size={16} />
                      </button>
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



    </div>
  )
}
