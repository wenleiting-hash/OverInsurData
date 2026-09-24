import { useState, useMemo } from 'react'
import {
  Search, Plus, Download, Upload, RefreshCw, Filter, ChevronUp, ChevronDown,
  MoreHorizontal, Eye, Edit2, XCircle, CheckCircle, Copy,
  StopCircle, PlayCircle, Zap, Trash2,
} from 'lucide-react'
import { insurers, formatCurrency, formatPercent } from '../data/mockData'
import { cooperations } from '../data/cooperationData'
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
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [exportAlert, setExportAlert] = useState(false)
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
    active:   { cls: 'badge-green',  orb: 'orb-green',  label: '合作中' },
    inactive: { cls: 'badge-gray',   orb: 'orb-gray',   label: '已停用' },
    pending:  { cls: 'badge-yellow', orb: 'orb-yellow', label: '待激活' },
  }

  const coopConfig = {
    active: { label: '正常', color: '#1a7a2e' },
    negotiating: { label: '洽谈中', color: '#0058BC' },
    expiring: { label: '即将到期', color: '#a05800' },
    terminated: { label: '已终止', color: '#BA1A1A' },
  }

  const getCoopStatus = (insurerId: string) => {
    const coop = cooperations.find(c => c.insurerId === insurerId && (c.status === 'Active' || c.status === 'Signed' || c.status === 'PendingSign'))
    if (!coop) return { label: '未合作', orb: 'orb-gray', color: '#A0A5B1' }
    const today = new Date().toISOString().slice(0, 10)
    const expiresIn90 = new Date(coop.endDate) <= new Date(Date.now() + 90 * 86400000)
    if (expiresIn90) return { label: '即将到期', orb: 'orb-orange', color: '#a05800' }
    return { label: '合作中', orb: 'orb-green', color: '#1a7a2e' }
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }} onClick={() => setShowMoreMenu(null)}>
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
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { if (selected.size === 0) { setExportAlert(true); setTimeout(() => setExportAlert(false), 3000) } else { setShowExport(true) } }}>
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
          <option value="all">档案状态</option>
          <option value="active">合作中</option>
          <option value="pending">待激活</option>
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

      {/* Export alert */}
      {exportAlert && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', marginBottom: 10, borderRadius: 10, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.3)', fontSize: 13, color: '#B06000', fontWeight: 500 }}>
          <span>⚠</span> 请先选择导出的数据
        </div>
      )}

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
        <div className="table-scroll" style={{ '--sc': '40px' } as React.CSSProperties}>
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
                      {(() => { const cs = getCoopStatus(ins.id); return (
                        <div className="flex items-center gap-1.5">
                          <span className={`orb ${cs.orb}`} />
                          <span style={{ fontSize: 12.5, color: cs.color, fontWeight: 500 }}>{cs.label}</span>
                        </div>
                      )})()}
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
                        <div style={{ position: 'relative' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: 5, background: showMoreMenu === ins.id ? 'rgba(0,88,188,0.08)' : undefined }}
                            title="更多操作"
                            onClick={() => setShowMoreMenu(showMoreMenu === ins.id ? null : ins.id)}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {showMoreMenu === ins.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 148, padding: '4px 0' }}>
                              {/* pending: 激活 */}
                              {ins.status === 'pending' && (
                                <button
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#0058BC', display: 'flex', alignItems: 'center', gap: 7 }}
                                  onClick={() => { onDisable(ins.id); setShowMoreMenu(null) }}
                                >
                                  <Zap size={13} />激活
                                </button>
                              )}
                              {/* active: 停用 */}
                              {ins.status === 'active' && (
                                <button
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#B06000', display: 'flex', alignItems: 'center', gap: 7 }}
                                  onClick={() => { onDisable(ins.id); setShowMoreMenu(null) }}
                                >
                                  <StopCircle size={13} />停用
                                </button>
                              )}
                              {/* inactive: 启用 */}
                              {ins.status === 'inactive' && (
                                <button
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a2e', display: 'flex', alignItems: 'center', gap: 7 }}
                                  onClick={() => { onDisable(ins.id); setShowMoreMenu(null) }}
                                >
                                  <PlayCircle size={13} />启用
                                </button>
                              )}
                              {/* active + pending: can also stop/deactivate */}
                              {ins.status === 'pending' && (
                                <button
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#B06000', display: 'flex', alignItems: 'center', gap: 7 }}
                                  onClick={() => { onDisable(ins.id); setShowMoreMenu(null) }}
                                >
                                  <StopCircle size={13} />停用
                                </button>
                              )}
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#414755', display: 'flex', alignItems: 'center', gap: 7 }}
                                onClick={() => { navigateTo('insurer-duplicate'); setShowMoreMenu(null) }}
                              >
                                <Copy size={13} />复制
                              </button>
                              <div style={{ height: '0.5px', background: 'rgba(193,198,215,0.4)', margin: '2px 0' }} />
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#BA1A1A', display: 'flex', alignItems: 'center', gap: 7, opacity: ins.status === 'active' || ins.status === 'inactive' ? 0.35 : 1, pointerEvents: ins.status === 'active' || ins.status === 'inactive' ? 'none' : 'auto' }}
                                title={ins.status !== 'pending' ? '仅待激活记录可删除' : undefined}
                                onClick={() => { setDeleteTarget(ins.id); setShowMoreMenu(null) }}
                              >
                                <Trash2 size={13} />删除{ins.status !== 'pending' && <span style={{ fontSize: 10.5, color: '#A0A5B1', marginLeft: 'auto' }}>不可用</span>}
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

      {deleteTarget && (() => {
        const ins = insurers.find(i => i.id === deleteTarget)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteTarget(null)}>
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: '28px 32px', width: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(186,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <XCircle size={20} color="#BA1A1A" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>确认删除</div>
                  <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>此操作不可撤销</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: '#181C23', lineHeight: 1.6, marginBottom: 24, padding: '12px 14px', background: 'rgba(186,26,26,0.05)', borderRadius: 10, border: '1px solid rgba(186,26,26,0.15)' }}>
                即将删除保险公司 <strong>{ins?.shortName ?? ins?.name}</strong>，删除后相关配置、合作记录将一并移除，且无法恢复。
              </div>
              <div className="flex items-center gap-3" style={{ justifyContent: 'flex-end' }}>
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setDeleteTarget(null)}>取消</button>
                <button style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, background: '#BA1A1A', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setDeleteTarget(null)}>确认删除</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
