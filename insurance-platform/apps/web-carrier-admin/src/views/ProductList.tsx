// Product List View - Core page for product management (功能点 10-14)
// Features: List query, filtering, sorting, pagination, batch actions, CRUD navigation
// Synced with 设计原型V1.3 ProductList interaction: eye/edit/toggle row actions,
// bulk list/delist actions, status modal wiring (session-memory state)

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Search, XCircle, Eye, Edit2, ToggleRight, ChevronUp, ChevronDown,
  Download, CheckCircle, AlertTriangle, X, Trash2, Ban,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import type { ProductRecord, ProductListParams } from '@/lib/user-api-client'
import { useGetProducts, useBatchToggleProductStatus, useDeleteProduct, useBatchDeleteProduct } from '@/services/productService'
import { formatCurrency, formatPercent } from './data/mockProductData'
import BatchExportModal from '@/components/BatchExportModal'
import type { ExportFieldOption, ExportRelatedOption } from '@/components/BatchExportModal'

interface Props {
  navigateTo: (view: ViewId, params?: { carrierId?: string; productId?: string; userId?: string }) => void
}

const LINE_COLORS: Record<string, string> = {
  Auto: 'badge-blue', Home: 'badge-green', Commercial: 'badge-purple',
  Cyber: 'badge-red', Life: 'badge-orange', Travel: 'badge-gray',
  Professional: 'badge-yellow', D_O: 'badge-red',
}

type SortKey = 'name' | 'premium' | 'lossRatio' | 'renewalRate' | 'policyCount'
type SortDir = 'asc' | 'desc'

export default function ProductList({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('product')

  // ── API-driven data fetching ──
  const [search, setSearch] = useState('')
  const [filterInsurer, setFilterInsurer] = useState<string>('all')
  const [filterLine, setFilterLine] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('premium')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [batchConfirm, setBatchConfirm] = useState<'list' | 'delist' | 'delete' | null>(null)
  const [batchToast, setBatchToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  // "更多" dropdown menu state (fixed-position to escape table overflow clipping)
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  // 导出（对齐 InsurerList）：未选数据时橙色 toast 提示，已选则弹出批量导出对话框
  const [showExport, setShowExport] = useState(false)
  const [exportToast, setExportToast] = useState(false)

  const SORT_KEY_MAP: Record<SortKey, string> = {
    name: 'product_name', premium: 'premium_ytd', lossRatio: 'loss_ratio',
    renewalRate: 'renewal_rate', policyCount: 'policy_count',
  }
  const queryParams: ProductListParams = {
    search: search || undefined,
    insurer: filterInsurer !== 'all' ? filterInsurer : undefined,
    line: filterLine !== 'all' ? filterLine : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    sortKey: SORT_KEY_MAP[sortKey],
    sortDir,
    page,
    size: pageSize,
  }
  const { data: apiResult, isLoading } = useGetProducts(queryParams)
  const batchToggle = useBatchToggleProductStatus()
  const deleteProduct = useDeleteProduct()
  const batchDelete = useBatchDeleteProduct()
  const apiData = apiResult?.data ?? []
  const totalFromApi = apiResult?.total ?? 0

  // Client-side sort fallback
  const sorted = useMemo(() => {
    return [...apiData].sort((a, b) => {
      const ak = SORT_KEY_MAP[sortKey]
      const av = (a as any)[ak]
      const bv = (b as any)[ak]
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av ?? '').localeCompare(String(bv ?? ''))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [apiData, sortKey, sortDir])

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

  const statusLabels: Record<string, { cls: string; orb: string }> = {
    'Active': { cls: 'badge-green', orb: 'orb-green' },
    'Paused': { cls: 'badge-yellow', orb: 'orb-yellow' },
    'Inactive': { cls: 'badge-gray', orb: 'orb-gray' },
    'Incomplete': { cls: 'badge-gray', orb: 'orb-gray' },
  }

  const statusText: Record<string, string> = {
    'Active': t('values.statusOnSale'),
    'Paused': t('values.statusPaused'),
    'Inactive': t('values.statusOffSale'),
    'Incomplete': t('values.statusIncomplete'),
  }

  // Single-product status change via "更多" menu (上架 / 暂停 / 下架)
  const handleStatusChange = (id: string, status: string) => {
    setMenuTargetId(null)
    setMenuPos(null)
    batchToggle.mutate(
      { ids: [id], status },
      {
        onSuccess: () => {
          const msg = status === 'Active' ? '已上架产品' : status === 'Paused' ? '已暂停产品销售' : '已下架产品'
          setBatchToast({ type: 'success', msg })
        },
        onError: () => setBatchToast({ type: 'error', msg: '操作失败，请重试' }),
      },
    )
  }

  const insurerOptions = useMemo(() => Array.from(new Set(apiData.map(p => p.carrier_name ?? ''))), [apiData])
  const lineOptions = useMemo(() => [...new Set(apiData.map(p => p.line_of_business))], [apiData])

  const totalPages = Math.ceil((totalFromApi || 1) / pageSize)

  // Auto-dismiss batch toast
  useEffect(() => {
    if (!batchToast) return
    const timer = setTimeout(() => setBatchToast(null), 3000)
    return () => clearTimeout(timer)
  }, [batchToast])

  // Close "更多" dropdown on outside click
  useEffect(() => {
    if (!menuTargetId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuTargetId(null); setMenuPos(null) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuTargetId])

  // Auto-dismiss export toast
  useEffect(() => {
    if (!exportToast) return
    const timer = setTimeout(() => setExportToast(false), 3000)
    return () => clearTimeout(timer)
  }, [exportToast])

  const handleBatchAction = (action: 'list' | 'delist' | 'delete') => {
    const ids = Array.from(selected)
    if (action === 'delete') {
      batchDelete.mutate(ids, {
        onSuccess: (data) => {
          setBatchConfirm(null)
          setBatchToast({ type: 'success', msg: `已删除 ${data.deleted} 个产品` })
          setSelected(new Set())
        },
        onError: () => {
          setBatchConfirm(null)
          setBatchToast({ type: 'error', msg: '删除失败，请重试' })
        },
      })
      return
    }
    const targetStatus = action === 'list' ? 'Active' : 'Inactive'
    batchToggle.mutate(
      { ids, status: targetStatus },
      {
        onSuccess: (data) => {
          setBatchConfirm(null)
          setBatchToast({ type: 'success', msg: action === 'list' ? `已上架 ${data.updated} 个产品` : `已下架 ${data.updated} 个产品` })
          setSelected(new Set())
        },
        onError: () => {
          setBatchConfirm(null)
          setBatchToast({ type: 'error', msg: '操作失败，请重试' })
        },
      },
    )
  }

  // 导出字段（对齐表格列，label 复用 tables.* 翻译）
  const exportFields: ExportFieldOption[] = [
    { key: 'productName', label: t('tables.productName'), selected: true },
    { key: 'productCode', label: t('tables.productCode'), selected: true },
    { key: 'insurerName', label: t('tables.insurerName'), selected: true },
    { key: 'lineOfBusiness', label: t('tables.lineOfBusiness'), selected: true },
    { key: 'subLine', label: t('tables.subLine'), selected: false },
    { key: 'type', label: t('tables.type'), selected: true },
    { key: 'availableStates', label: t('tables.availableStates'), selected: false },
    { key: 'premiumYTD', label: t('tables.premiumYTD'), selected: true },
    { key: 'policyCount', label: t('tables.policyCount'), selected: true },
    { key: 'avgPremium', label: t('tables.avgPremium'), selected: false },
    { key: 'lossRatio', label: t('tables.lossRatio'), selected: true },
    { key: 'renewalRate', label: t('tables.renewalRate'), selected: true },
    { key: 'status', label: t('tables.status'), selected: true },
    { key: 'effectiveDate', label: t('tables.effectiveDate'), selected: false },
  ]

  const exportRelated: ExportRelatedOption[] = [
    { key: 'ratePlans', label: t('export.relRatePlans') },
    { key: 'states', label: t('export.relStates') },
    { key: 'authorizations', label: t('export.relAuthorizations') },
  ]

  // 导出已勾选的产品（对齐 InsurerList：必须先选择数据）
  const handleExport = () => {
    const rows = sorted.filter((p: ProductRecord) => selected.has(p.id))
    const headers = [
      t('tables.productName'), t('tables.productCode'), t('tables.insurerName'), t('tables.lineOfBusiness'),
      t('tables.type'), t('tables.premiumYTD'), t('tables.policyCount'), t('tables.lossRatio'),
      t('tables.renewalRate'), t('tables.status'),
    ]
    const csvData = rows.map((p: ProductRecord) => [
      `"${p.product_name}"`,
      p.product_code,
      `"${p.carrier_name ?? ''}"`,
      p.line_of_business,
      p.product_type ?? '',
      formatCurrency(p.premium_ytd ?? 0, true),
      p.policy_count?.toLocaleString() ?? 'N/A',
      formatPercent(p.loss_ratio ?? 0),
      formatPercent(p.renewal_rate ?? 0),
      statusText[p.status] ?? p.status,
    ].join(','))

    const csvContent = [headers.join(','), ...csvData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'zh-CN'

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t('pages.productManagement')}</h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>{t('list.countSummary', { total: apiResult?.total ?? 0, results: sorted.length })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => {
              if (selected.size === 0) { setExportToast(true); return }
              setShowExport(true)
            }}>
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
            <input type="text" placeholder={t('filters.searchPlaceholder')} className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => { setFilterInsurer(e.target.value); setPage(1) }}>
            <option value="all">{t('filters.allInsurers')}</option>
            {insurerOptions.map(insurer => <option key={insurer} value={insurer}>{insurer}</option>)}
          </select>
          <select className="input-glass" style={{ fontSize: 13 }} value={filterLine} onChange={e => { setFilterLine(e.target.value); setPage(1) }}>
            <option value="all">{t('filters.lineOfBusiness')}</option>
            {lineOptions.map(line => <option key={line} value={line}>{t(`values.lob${line}`, line)}</option>)}
          </select>
          <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="all">{t('filters.status')}</option>
            <option value="Active">{t('filters.active')}</option>
            <option value="Inactive">{t('filters.inactive')}</option>
            <option value="Paused">{t('filters.paused')}</option>
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
            <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>{t('bulkActions.selectedCount', { count: selected.size })}</span>
            <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setBatchConfirm('list')}>
              <ToggleRight size={13} />{t('bulkActions.batchList')}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setBatchConfirm('delist')}>
              <ToggleRight size={13} />{t('bulkActions.batchDelist')}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setBatchConfirm('delete')}>
              <Trash2 size={13} />{t('bulkActions.batchDelete')}
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
                <th style={{ width: 40, position: 'sticky', left: 0, zIndex: 2, background: 'rgba(236,237,249,0.99)' }} data-col="priority">
                  <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0}
                    onChange={() => selected.size === sorted.length ? setSelected(new Set()) : setSelected(new Set(sorted.map(p => p.id)))}
                    style={{ cursor: 'pointer' }} />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', width: 220, position: 'sticky', left: 40, zIndex: 2, background: 'rgba(236,237,249,0.99)', boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }} data-col="priority">
                  <span className="flex items-center gap-1">{t('tables.productName')} <SortIcon k="name" /></span>
                </th>
                <th style={{ width: 100 }} data-col="priority">{t('tables.productCode')}</th>
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
                <th data-col="status">{t('tables.status')}</th>
                <th style={{ width: 140, position: 'sticky', right: 0, zIndex: 2, background: 'rgba(236,237,249,0.99)', boxShadow: '-3px 0 8px -2px rgba(0,22,80,0.08)' }} data-col="actions">{t('tables.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const sc = statusLabels[p.status] ?? statusLabels['Active']
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigateTo('product-detail', { productId: p.id })}>
                    <td onClick={e => { e.stopPropagation(); toggleSelect(p.id) }} style={{ position: 'sticky', left: 0, zIndex: 2, background: '#FCFDFF' }}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ width: 220, position: 'sticky', left: 40, zIndex: 2, background: '#FCFDFF', boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{p.product_name}</div>
                      {/* values.* 动态查表统一带 defaultValue：缺键时降级为原始枚举值，不会渲染出 values.XXX 裸键名 */}
                      <div style={{ fontSize: 11, color: '#717786' }}>{p.sub_line ? t(`values.${p.sub_line}`, p.sub_line) : ''}</div>
                    </td>
                    <td style={{ width: 100 }}>
                      <span className="font-data" style={{ fontSize: 12, color: '#414755', background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.product_code}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>
                      <div>{p.carrier_name}</div>
                      <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>NAIC {p.naic_form_number}</div>
                    </td>
                    <td>
                      <span className={`badge ${LINE_COLORS[p.line_of_business] || 'badge-gray'}`} style={{ fontSize: 11.5 }}>{t(`values.lob${p.line_of_business}`, p.line_of_business || '-')}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{t(`values.type${p.product_type}`, p.product_type || '-')}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {(p.available_states?.length ?? 0) === 50 ? <span className="badge badge-blue" style={{ fontSize: 11 }}>{t('values.nationwide')}</span> : (p.available_states?.length ?? 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(p.premium_ytd ?? 0, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {p.policy_count?.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: (p.loss_ratio ?? 0) > 0.65 ? '#BA1A1A' : (p.loss_ratio ?? 0) > 0.60 ? '#a05800' : '#1a7a2e' }}>
                        {formatPercent(p.loss_ratio ?? 0)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      {formatPercent(p.renewal_rate ?? 0)}
                    </td>
                    <td style={{ width: 110, fontSize: 12.5, color: '#717786' }}>
                      {new Date(p.effective_date).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td style={{ width: 110 }} data-col="status">
                      <div className="flex items-center gap-1.5">
                        <span className={`orb ${sc.orb}`} />
                        <span style={{ fontSize: 12.5 }}>{statusText[p.status] ?? p.status}</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ width: 140, position: 'sticky', right: 0, zIndex: 2, background: '#FCFDFF', boxShadow: '-3px 0 8px -2px rgba(0,22,80,0.08)' }} data-col="actions">
                      <div className="flex items-center gap-0.5">
                        <button className="btn-ghost" style={{ padding: 5 }} title={t('actions.viewDetails')}
                          onClick={() => navigateTo('product-detail', { productId: p.id })}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 5 }} title={t('actions.edit')}
                          onClick={() => navigateTo('product-edit', { productId: p.id })}>
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 12.5, color: '#0058BC', fontWeight: 500 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (menuTargetId === p.id) { setMenuTargetId(null); setMenuPos(null); return }
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ x: rect.right, y: rect.bottom + 4 })
                            setMenuTargetId(p.id)
                          }}
                        >
                          {t('actions.more')}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12.5, color: '#717786' }}>{t('list.footerCount', { count: totalFromApi })}</span>
                <select
                  className="input-glass"
                  style={{ fontSize: 12, padding: '4px 24px 4px 8px' }}
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                >
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page <= 1} onClick={() => setPage(1)}>«</button>
                <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return n <= totalPages ? (
                    <button
                      key={n}
                      className="btn-ghost"
                      style={{ fontSize: 12.5, padding: '5px 10px', background: n === page ? 'rgba(0,88,188,0.10)' : undefined, color: n === page ? '#0058BC' : undefined, fontWeight: n === page ? 600 : undefined }}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ) : null
                })}
                <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "更多" dropdown menu — fixed position to escape table overflow clipping */}
      {menuTargetId && menuPos && (() => {
        const menuProduct = sorted.find(p => p.id === menuTargetId)
        if (!menuProduct) return null
        const st = menuProduct.status
        const itemBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }
        return (
          <div
            ref={menuRef}
            style={{
              position: 'fixed', left: menuPos.x - 140, top: menuPos.y, zIndex: 100,
              background: '#fff', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,22,80,0.13), 0 1px 3px rgba(0,22,80,0.08)',
              border: '0.5px solid rgba(193,198,215,0.4)',
              minWidth: 140, padding: '5px 0',
            }}
          >
            <button
              style={{ ...itemBase, color: '#414755', opacity: st === 'Active' ? 0.4 : 1, cursor: st === 'Active' ? 'not-allowed' : 'pointer' }}
              disabled={st === 'Active'}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,248,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => handleStatusChange(menuTargetId, 'Active')}
            >
              <CheckCircle size={14} style={{ color: '#1a7a2e' }} />
              {t('actions.list')}
            </button>
            <button
              style={{ ...itemBase, color: '#414755', opacity: st === 'Paused' ? 0.4 : 1, cursor: st === 'Paused' ? 'not-allowed' : 'pointer' }}
              disabled={st === 'Paused'}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,248,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => handleStatusChange(menuTargetId, 'Paused')}
            >
              <Ban size={14} style={{ color: '#a05800' }} />
              {t('actions.pause')}
            </button>
            <button
              style={{ ...itemBase, color: '#414755', opacity: st === 'Inactive' ? 0.4 : 1, cursor: st === 'Inactive' ? 'not-allowed' : 'pointer' }}
              disabled={st === 'Inactive'}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,248,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => handleStatusChange(menuTargetId, 'Inactive')}
            >
              <XCircle size={14} style={{ color: '#BA1A1A' }} />
              {t('actions.offSale')}
            </button>
            <button
              style={{ ...itemBase, color: '#BA1A1A' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,240,240,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => { setMenuTargetId(null); setMenuPos(null); setDeleteTarget({ id: menuTargetId, name: menuProduct.product_name }) }}
            >
              <Trash2 size={14} />
              {t('actions.delete')}
            </button>
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
        >
          <div className="glass-strong" style={{ width: 460, maxWidth: 'calc(100vw - 32px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '22px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(186,26,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} style={{ color: '#BA1A1A' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>确认删除</div>
                  <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>此操作不可撤销</div>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ background: 'rgba(255,240,240,0.9)', border: '0.5px solid rgba(186,26,26,0.25)', borderRadius: 12, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.7, color: '#414755' }}>
                即将删除产品 <strong style={{ color: '#BA1A1A' }}>{deleteTarget.name}</strong>，删除后相关费率方案、授权记录将一并移除，且无法恢复。
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</button>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px', background: '#BA1A1A', color: '#fff', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none', opacity: deleteProduct.isPending ? 0.6 : 1 }}
                disabled={deleteProduct.isPending}
                onClick={() => { deleteProduct.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
              >
                <Trash2 size={14} />
                {deleteProduct.isPending ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch confirm dialog */}
      {batchConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setBatchConfirm(null) }}
        >
          <div className="glass-strong" style={{ width: 420, borderRadius: 16, padding: '24px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: batchConfirm === 'list' ? 'rgba(52,199,89,0.10)' : 'rgba(186,26,26,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {batchConfirm === 'list' ? <CheckCircle size={18} style={{ color: '#34C759' }} /> : batchConfirm === 'delete' ? <Trash2 size={18} style={{ color: '#BA1A1A' }} /> : <ToggleRight size={18} style={{ color: '#BA1A1A' }} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                  {batchConfirm === 'delete' ? '批量删除' : batchConfirm === 'list' ? '批量上架' : '批量下架'}
                </div>
                <div style={{ fontSize: 12.5, color: '#717786' }}>已选择 {selected.size} 个产品</div>
              </div>
            </div>
            <div style={{
              background: batchConfirm === 'list' ? 'rgba(52,199,89,0.06)' : 'rgba(186,26,26,0.06)',
              border: `0.5px solid ${batchConfirm === 'list' ? 'rgba(52,199,89,0.2)' : 'rgba(186,26,26,0.2)'}`,
              borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#414755',
            }}>
              {batchConfirm === 'delete'
                ? '删除后，选中的产品及相关费率方案、授权记录将被永久移除，此操作不可撤销。确认继续？'
                : batchConfirm === 'list'
                  ? '上架后，选中的产品将恢复在售状态。确认继续？'
                  : '下架后，选中的产品将停止新保报价，已有保单按原合同正常续保。确认继续？'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => setBatchConfirm(null)}>取消</button>
              <button
                onClick={() => handleBatchAction(batchConfirm!)}
                disabled={batchToggle.isPending || batchDelete.isPending}
                style={{
                  padding: '9px 22px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: batchConfirm === 'list' ? '#1a7a2e' : '#BA1A1A',
                  color: '#fff', opacity: (batchToggle.isPending || batchDelete.isPending) ? 0.6 : 1,
                }}
              >
                {(batchToggle.isPending || batchDelete.isPending) ? '处理中...' : batchConfirm === 'delete' ? '确认删除' : batchConfirm === 'list' ? '确认上架' : '确认下架'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch toast */}
      {batchToast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          background: batchToast.type === 'success' ? 'rgba(52,199,89,0.12)' : 'rgba(186,26,26,0.10)',
          border: `1px solid ${batchToast.type === 'success' ? 'rgba(52,199,89,0.35)' : 'rgba(186,26,26,0.25)'}`,
          borderRadius: 10, padding: '10px 20px',
          boxShadow: batchToast.type === 'success' ? '0 4px 16px rgba(52,199,89,0.15)' : '0 4px 16px rgba(186,26,26,0.15)',
        }}>
          {batchToast.type === 'success' ? <CheckCircle size={15} style={{ color: '#1a7a2e' }} /> : <AlertTriangle size={15} style={{ color: '#BA1A1A' }} />}
          <span style={{ fontSize: 13.5, fontWeight: 500, color: batchToast.type === 'success' ? '#1a7a2e' : '#BA1A1A' }}>{batchToast.msg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: batchToast.type === 'success' ? '#1a7a2e' : '#BA1A1A', marginLeft: 4 }}
            onClick={() => setBatchToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Batch export modal（对齐 InsurerList） */}
      {showExport && (
        <BatchExportModal
          totalCount={totalFromApi}
          selectedCount={selected.size}
          filteredCount={totalFromApi}
          customFields={exportFields}
          customRelated={exportRelated}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
        />
      )}

      {/* Export toast：未选择数据时的橙色提示 */}
      {exportToast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #FFF3E0, #FFF8F0)',
          border: '1px solid rgba(255,149,0,0.35)',
          borderRadius: 10, padding: '10px 20px',
          boxShadow: '0 4px 16px rgba(255,149,0,0.15)',
        }}>
          <AlertTriangle size={15} style={{ color: '#a05800', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 500, color: '#7a5c00' }}>{t('actions.selectBeforeExport')}</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#a05800', marginLeft: 4 }}
            onClick={() => setExportToast(false)}
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  )
}
