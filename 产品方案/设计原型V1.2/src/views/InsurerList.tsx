import { useState, useMemo } from 'react'
import {
  Search, Plus, Download, Upload, RefreshCw, Filter, ChevronUp, ChevronDown,
  MoreHorizontal, Eye, Edit2, XCircle, CheckCircle, Copy,
} from 'lucide-react'
import { insurers, formatCurrency, formatPercent } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'
import BatchExportModal from '../components/BatchExportModal'

interface Props {
  navigateTo: (view: ViewId, params?: { insurerId?: string }) => void
  onDisable: (id: string) => void
}

type SortKey = 'name' | 'totalPremium' | 'lossRatio' | 'renewalRate' | 'channelCount'
type SortDir = 'asc' | 'desc'

export default function InsurerList({ navigateTo, onDisable }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('totalPremium')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showExport, setShowExport] = useState(false)
  const pageSize = 8

  const filtered = useMemo(() => {
    return insurers.filter(ins => {
      const q = search.toLowerCase()
      const matchSearch = !q || ins.name.toLowerCase().includes(q) || ins.shortName.toLowerCase().includes(q) || ins.naicCode.includes(q)
      const matchType = filterType === 'all' || ins.type === filterType
      const matchStatus = filterStatus === 'all' || ins.status === filterStatus
      const matchRegion = filterRegion === 'all' || ins.region === filterRegion
      const matchRating = filterRating === 'all' || ins.amBestRating === filterRating
      return matchSearch && matchType && matchStatus && matchRegion && matchRating
    })
  }, [search, filterType, filterStatus, filterRegion, filterRating])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set())
    else setSelected(new Set(pageData.map(i => i.id)))
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} style={{ opacity: 0.3 }} />
  )

  const statusConfig = {
    active: { cls: 'badge-green', orb: 'orb-green', label: '合作中' },
    inactive: { cls: 'badge-gray', orb: 'orb-gray', label: '已停用' },
    pending: { cls: 'badge-yellow', orb: 'orb-yellow', label: '待审核' },
  }

  const coopConfig = {
    active: { label: '正常', color: '#1a7a2e' },
    negotiating: { label: '洽谈中', color: '#0058BC' },
    expiring: { label: '即将到期', color: '#a05800' },
    terminated: { label: '已终止', color: '#BA1A1A' },
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>保险公司列表</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>共 {insurers.length} 家保险公司 · {filtered.length} 条结果</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-duplicate')}>
            <Copy size={14} />重复检测
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-import')}>
            <Upload size={14} />批量导入
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowExport(true)}>
            <Download size={14} />导出
          </button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-new')}>
            <Plus size={14} />新增保险公司
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex items-center gap-3 flex-wrap" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            type="text"
            placeholder="搜索公司名、简称、NAIC编码…"
            className="input-glass w-full"
            style={{ paddingLeft: 30, fontSize: 13 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}>
          <option value="all">公司类型</option>
          <option value="Admitted">Admitted</option>
          <option value="Non-Admitted">Non-Admitted</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="all">合作状态</option>
          <option value="active">合作中</option>
          <option value="pending">待审核</option>
          <option value="inactive">已停用</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1) }}>
          <option value="all">大区</option>
          <option value="Northeast">Northeast</option>
          <option value="Southeast">Southeast</option>
          <option value="Midwest">Midwest</option>
          <option value="West">West</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRating} onChange={e => { setFilterRating(e.target.value); setPage(1) }}>
          <option value="all">AM Best 评级</option>
          <option value="A++">A++</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
        </select>
        {(search || filterType !== 'all' || filterStatus !== 'all' || filterRegion !== 'all' || filterRating !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => { setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterRegion('all'); setFilterRating('all'); setPage(1) }}>
            <XCircle size={13} /> 重置
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="glass-light flex items-center gap-3 px-4 py-2.5 mb-3" style={{ borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>已选 {selected.size} 项</span>
          <button className="btn-ghost" style={{ fontSize: 12.5 }}><CheckCircle size={13} />批量启用</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}><XCircle size={13} />批量停用</button>
          <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setShowExport(true)}><Download size={13} />导出选中</button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>取消选择</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <span className="flex items-center gap-1">公司名称 <SortIcon k="name" /></span>
                </th>
                <th>NAIC编码</th>
                <th>公司类型</th>
                <th>AM Best</th>
                <th>总部大区</th>
                <th onClick={() => handleSort('totalPremium')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">总保费 <SortIcon k="totalPremium" /></span>
                </th>
                <th style={{ textAlign: 'right' }}>保单数</th>
                <th onClick={() => handleSort('lossRatio')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">赔付率 <SortIcon k="lossRatio" /></span>
                </th>
                <th onClick={() => handleSort('renewalRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">续保率 <SortIcon k="renewalRate" /></span>
                </th>
                <th>结算方式</th>
                <th>合作状态</th>
                <th style={{ width: 80 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(ins => {
                const cc = coopConfig[ins.coopStatus]
                return (
                  <tr
                    key={ins.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigateTo('insurer-detail', { insurerId: ins.id })}
                  >
                    <td onClick={e => { e.stopPropagation(); toggleSelect(ins.id) }}>
                      <input type="checkbox" checked={selected.has(ins.id)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{ins.shortName}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 1 }}>{ins.name.length > 28 ? ins.name.slice(0, 28) + '…' : ins.name}</div>
                    </td>
                    <td>
                      <span className="font-data" style={{ fontSize: 12.5, color: '#414755', letterSpacing: 0.3 }}>{ins.naicCode}</span>
                    </td>
                    <td>
                      <span className={`badge ${ins.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11.5 }}>
                        {ins.type === 'Admitted' ? 'Admitted' : 'Non-Admitted'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-data"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: ins.amBestRating.startsWith('A+') ? '#1a7a2e' : ins.amBestRating === 'A' ? '#0058BC' : '#414755',
                        }}
                      >
                        {ins.amBestRating}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>{ins.region}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#181C23', fontWeight: 500 }}>
                      {formatCurrency(ins.totalPremium, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#414755' }}>
                      {ins.policyCount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="font-data"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: ins.lossRatio > 0.65 ? '#BA1A1A' : ins.lossRatio > 0.60 ? '#a05800' : '#1a7a2e',
                        }}
                      >
                        {formatPercent(ins.lossRatio)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#414755' }}>
                      {formatPercent(ins.renewalRate)}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{ins.settlementCycle === 'Monthly' ? '月结' : '季结'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`orb orb-${ins.coopStatus === 'active' ? 'green' : ins.coopStatus === 'expiring' ? 'orange' : ins.coopStatus === 'negotiating' ? 'purple' : 'gray'}`} />
                        <span style={{ fontSize: 12.5, color: cc.color }}>{cc.label}</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title="查看详情"
                          onClick={() => navigateTo('insurer-detail', { insurerId: ins.id })}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title="编辑"
                          onClick={() => navigateTo('insurer-edit', { insurerId: ins.id })}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={ins.status === 'inactive' ? '启用' : '停用'}
                          onClick={() => onDisable(ins.id)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12.5, color: '#717786' }}>
              共 {sorted.length} 条 · 第 {page} / {totalPages} 页
            </span>
            <select className="input-glass" style={{ fontSize: 12, padding: '4px 24px 4px 8px' }}>
              <option>每页 8 条</option>
              <option>每页 20 条</option>
              <option>每页 50 条</option>
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

      {showExport && (
        <BatchExportModal
          totalCount={insurers.length}
          selectedCount={selected.size}
          filteredCount={filtered.length}
          onClose={() => setShowExport(false)}
          onExport={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
