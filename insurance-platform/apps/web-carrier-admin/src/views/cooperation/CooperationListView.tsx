import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus, Search, ChevronLeft, ChevronRight, Trash2, Eye, Edit2, XCircle,
} from 'lucide-react'
import {
  useGetCooperations, useGetCooperationOverview, useUpdateCooperation,
} from '@/services/cooperationService'
import type { CooperationRecord } from '@/lib/user-api-client'
import {
  COOP_TYPES, COOP_TYPE_LABEL, COOP_STATUS, COOP_STATUS_FILTERS, COOP_DELETABLE, COOP_EDITABLE,
  COOP_MENU_ACTIONS, lobLabel, formatMonthRange, type Notify,
} from './constants'
import EstablishWizard from './components/EstablishWizard'
import CooperationEditDrawer from './components/CooperationEditDrawer'
import TerminatePanel from './components/TerminatePanel'
import CooperationDeleteDialog, { type DeleteTarget } from './components/CooperationDeleteDialog'

interface Props {
  notify: Notify
  onSelect: (partnershipId: string) => void
}

const PAGE_SIZES = [10, 20, 50, 100, 200, 500]
const LOB_CHIP_LIMIT = 3

/**
 * Module home: KPI cards + filters + paginated cooperation table (V1.0.12).
 * Row actions mirror ProductList: checkbox selection (deletable rows only) +
 * bulk bar, and a fixed-position 查看 / 编辑 / 更多 operation column whose
 * "更多" menu offers the legal lifecycle actions for the current status.
 */
export default function CooperationListView({ notify, onSelect }: Props) {
  const { t } = useTranslation('cooperation')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [jumpInput, setJumpInput] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)

  // Selection + bulk delete
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)

  // Row-level overlays
  const [editTarget, setEditTarget] = useState<CooperationRecord | null>(null)
  const [terminateTarget, setTerminateTarget] = useState<CooperationRecord | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updateCooperation = useUpdateCooperation()

  // Debounce free-text search; changing any filter resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [qInput])

  const params = useMemo(() => ({
    q: q || undefined,
    status: status || undefined,
    type: type || undefined,
    page,
    pageSize,
  }), [q, status, type, page, pageSize])

  const { data, isLoading, isError, refetch } = useGetCooperations(params)
  const { data: overview } = useGetCooperationOverview()
  // Unfiltered fetch so the wizard always excludes every already-partnered carrier.
  const { data: allCoops } = useGetCooperations({ pageSize: 100 })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Close "更多" dropdown on outside click
  useEffect(() => {
    if (!menuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuId(null); setMenuPos(null) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuId])

  const deletableRows = useMemo(() => rows.filter(r => COOP_DELETABLE.includes(r.status)), [rows])

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const allDeletableSelected = deletableRows.length > 0 && deletableRows.every(r => selected.has(r.partnership_id))
  const toggleSelectAll = () => {
    setSelected(prev => {
      if (allDeletableSelected) {
        const n = new Set(prev)
        deletableRows.forEach(r => n.delete(r.partnership_id))
        return n
      }
      const n = new Set(prev)
      deletableRows.forEach(r => n.add(r.partnership_id))
      return n
    })
  }

  const targetName = (c: CooperationRecord) => c.insurer_short ?? c.insurer_name ?? c.carrier_id

  const changeStatusMenu = async (coop: CooperationRecord, to: string) => {
    setMenuId(null); setMenuPos(null)
    try {
      await updateCooperation.mutateAsync({ id: coop.partnership_id, dto: { status: to } })
      notify('success', t('view.toast.coopStatusChanged'))
    } catch {
      notify('error', t('view.toast.coopStatusChangeFailed'))
    }
  }

  const changeStatus = (v: string) => { setStatus(v); setPage(1) }
  const changeType = (v: string) => { setType(v); setPage(1) }
  const changePageSize = (v: number) => { setPageSize(v); setPage(1) }
  const jump = () => {
    const n = Number(jumpInput)
    if (!Number.isFinite(n)) return
    setPage(Math.min(Math.max(1, Math.floor(n)), totalPages))
    setJumpInput('')
  }

  const kpis = [
    { key: 'active', label: 'view.kpi.active', value: overview?.activeCount ?? '—', color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
    { key: 'terminated', label: 'view.kpi.terminated', value: overview?.terminatedCount ?? '—', color: '#717786', bg: 'rgba(193,198,215,0.15)' },
    { key: 'lines', label: 'view.kpi.coveredLines', value: overview?.coveredLineCount ?? '—', color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
  ]

  const menuCoop = menuId ? rows.find(r => r.partnership_id === menuId) : null
  const menuActions = menuCoop ? (COOP_MENU_ACTIONS[menuCoop.status] ?? []) : []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4" style={{ gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23' }}>{t('view.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t('view.list.subtitle', {
              active: overview?.activeCount ?? 0,
              terminated: overview?.terminatedCount ?? 0,
            })}
          </p>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setWizardOpen(true)}>
            <Plus size={14} />{t('view.list.newCooperation')}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {kpis.map(s => (
          <div key={s.key} className="card" style={{ padding: '16px 20px', background: s.bg, borderColor: s.color + '22' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{t(s.label)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 0, borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9AA0B4' }} />
          <input
            className="input-glass w-full"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder={t('view.list.searchPlaceholder')}
            value={qInput}
            onChange={e => setQInput(e.target.value)}
          />
        </div>
        <select className="input-glass" style={{ width: 150, fontSize: 13 }} value={status} onChange={e => changeStatus(e.target.value)}>
          <option value="">{t('view.list.filterStatusAll')}</option>
          {COOP_STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{t(COOP_STATUS[s]?.label ?? s)}</option>
          ))}
        </select>
        <select className="input-glass" style={{ width: 160, fontSize: 13 }} value={type} onChange={e => changeType(e.target.value)}>
          <option value="">{t('view.list.filterTypeAll')}</option>
          {COOP_TYPES.map(ty => (
            <option key={ty} value={ty}>{t(COOP_TYPE_LABEL[ty])}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar (deletable rows only) */}
      {selected.size > 0 && (
        <div className="glass-light flex items-center gap-3 px-4 py-2.5" style={{ borderRadius: 0 }}>
          <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>
            {t('view.bulk.selectedCount', { count: selected.size })}
          </span>
          <button
            className="btn-ghost"
            style={{ fontSize: 12.5, color: '#BA1A1A' }}
            onClick={() => {
              const chosen = rows.filter(r => selected.has(r.partnership_id))
              setDeleteTargets(chosen.map(c => ({ id: c.partnership_id, name: targetName(c) })))
            }}
          >
            <Trash2 size={13} />{t('view.bulk.batchDelete')}
          </button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>
            {t('view.bulk.cancelSelection')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(241,243,254,0.7)' }}>
                <th style={{ width: 40, padding: '11px 8px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allDeletableSelected}
                    onChange={toggleSelectAll}
                    disabled={deletableRows.length === 0}
                    style={{ cursor: deletableRows.length === 0 ? 'not-allowed' : 'pointer' }}
                    title={t('view.bulk.selectDeletableOnly')}
                  />
                </th>
                {['insurer', 'type', 'lobs', 'term', 'owner', 'status'].map(k => (
                  <th key={k} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>
                    {t(`view.list.th.${k}`)}
                  </th>
                ))}
                <th style={{ width: 150 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</td></tr>
              ) : isError ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                  <span style={{ color: '#BA1A1A', fontSize: 13.5, marginRight: 12 }}>{t('view.common.loadError')}</span>
                  <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.establish')}</td></tr>
              ) : rows.map(coop => {
                const sc = COOP_STATUS[coop.effective_status ?? coop.status] || COOP_STATUS.Negotiating
                const deletable = COOP_DELETABLE.includes(coop.status)
                const editable = COOP_EDITABLE.includes(coop.status)
                const shortName = targetName(coop)
                const lobs: string[] = (coop.product_scope as any)?.lobTypes ?? []
                // Every lifecycle status offers a menu action except the terminal one.
                const hasMenuActions = coop.status !== 'Terminated'
                return (
                  <tr
                    key={coop.partnership_id}
                    onClick={() => onSelect(coop.partnership_id)}
                    style={{ borderTop: '0.5px solid rgba(193,198,215,0.2)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(241,243,254,0.45)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 8px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {deletable ? (
                        <input
                          type="checkbox"
                          checked={selected.has(coop.partnership_id)}
                          onChange={() => toggleSelect(coop.partnership_id)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <input type="checkbox" disabled style={{ cursor: 'not-allowed', opacity: 0.3 }} title={t('view.bulk.notDeletableTip')} />
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.22))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10.5, fontWeight: 700, color: '#0058BC',
                        }}>
                          {shortName.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#181C23' }}>{shortName}</div>
                          {coop.naic_code && (
                            <div style={{ fontSize: 11.5, color: '#9AA0B4', fontFamily: "'JetBrains Mono', monospace" }}>
                              {coop.naic_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#414755', whiteSpace: 'nowrap' }}>{coop.cooperation_type ? t(COOP_TYPE_LABEL[coop.cooperation_type] ?? coop.cooperation_type) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
                        {lobs.length === 0 ? <span style={{ color: '#9AA0B4' }}>—</span> : (
                          <>
                            {lobs.slice(0, LOB_CHIP_LIMIT).map(l => (
                              <span key={l} className="badge badge-blue" style={{ fontSize: 10.5, background: 'rgba(0,88,188,0.07)', color: '#0058BC', borderColor: 'rgba(0,88,188,0.15)' }}>
                                {lobLabel(l)}
                              </span>
                            ))}
                            {lobs.length > LOB_CHIP_LIMIT && (
                              <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{lobs.length - LOB_CHIP_LIMIT}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#414755', whiteSpace: 'nowrap', fontSize: 12.5 }}>
                      {formatMonthRange(coop.effective_date, coop.expiration_date, t('view.coopCard.permanent'))}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#414755', whiteSpace: 'nowrap' }}>{coop.owner_name ?? '—'}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span className="flex items-center gap-1.5">
                        <span className={`orb ${sc.orb}`} />
                        <span className={`badge ${sc.cls}`}>{t(sc.label)}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div className="flex items-center" style={{ justifyContent: 'flex-end', gap: 2 }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('view.list.view')}
                          onClick={() => onSelect(coop.partnership_id)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{
                            padding: 5,
                            opacity: editable ? 1 : 0.35,
                            cursor: editable ? 'pointer' : 'not-allowed',
                          }}
                          disabled={!editable}
                          title={editable ? t('view.list.edit') : t('view.list.editDisabled')}
                          onClick={() => setEditTarget(coop)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{
                            padding: '4px 8px', fontSize: 12.5, color: '#0058BC', fontWeight: 500,
                            opacity: hasMenuActions ? 1 : 0.35, cursor: hasMenuActions ? 'pointer' : 'not-allowed',
                          }}
                          disabled={!hasMenuActions}
                          title={t('view.list.more')}
                          onClick={e => {
                            if (menuId === coop.partnership_id) { setMenuId(null); setMenuPos(null); return }
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ x: rect.right, y: rect.bottom + 4 })
                            setMenuId(coop.partnership_id)
                          }}
                        >
                          {t('view.list.more')}
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
        <div className="flex items-center justify-between" style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.25)', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: '#717786' }}>{t('view.list.pageTotal', { total })}</span>
          <div className="flex items-center gap-2">
            <select
              className="input-glass"
              style={{ width: 96, fontSize: 12.5, padding: '5px 8px' }}
              value={pageSize}
              onChange={e => changePageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map(ps => <option key={ps} value={ps}>{t('view.list.pageSize', { size: ps })}</option>)}
            </select>
            <button
              className="btn-secondary"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12.5, color: '#414755' }}>
              {t('view.list.pageIndicator', { page, total: totalPages })}
            </span>
            <button
              className="btn-secondary"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
            <div className="flex items-center gap-1" style={{ marginLeft: 6 }}>
              <input
                className="input-glass"
                style={{ width: 56, fontSize: 12.5, padding: '5px 8px', textAlign: 'center' }}
                placeholder={String(page)}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') jump() }}
              />
              <button className="btn-secondary" style={{ fontSize: 12.5, padding: '5px 10px' }} onClick={jump}>
                {t('view.list.jump')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* "更多" dropdown — fixed position to escape table clipping */}
      {menuCoop && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', left: menuPos.x - 150, top: menuPos.y, zIndex: 100,
            background: '#fff', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,22,80,0.13), 0 1px 3px rgba(0,22,80,0.08)',
            border: '0.5px solid rgba(193,198,215,0.4)',
            minWidth: 150, padding: '5px 0',
          }}
        >
          {menuActions.map(a => (
            <button
              key={a.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px',
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#414755',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,248,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => changeStatusMenu(menuCoop, a.to)}
            >
              {t(a.label)}
            </button>
          ))}
          {menuCoop.status === 'Active' && (
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px',
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#BA1A1A',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,240,240,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => { setMenuId(null); setMenuPos(null); setTerminateTarget(menuCoop) }}
            >
              <XCircle size={14} />
              {t('view.detail.terminate')}
            </button>
          )}
          {COOP_DELETABLE.includes(menuCoop.status) && (
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px',
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#BA1A1A',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,240,240,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => {
                setMenuId(null); setMenuPos(null)
                setDeleteTargets([{ id: menuCoop.partnership_id, name: targetName(menuCoop) }])
              }}
            >
              <Trash2 size={14} />
              {t('view.detail.delete')}
            </button>
          )}
        </div>,
        document.body,
      )}

      {/* Delete confirmation (single or batch) */}
      {deleteTargets && deleteTargets.length > 0 && (
        <CooperationDeleteDialog
          targets={deleteTargets}
          notify={notify}
          onClose={() => setDeleteTargets(null)}
          onDeleted={() => {
            setSelected(new Set())
          }}
        />
      )}

      {/* In-list edit drawer */}
      {editTarget && (
        <CooperationEditDrawer
          coop={editTarget}
          notify={notify}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Termination form from the "更多" menu */}
      {terminateTarget && (
        <TerminatePanel
          coop={terminateTarget}
          notify={notify}
          onClose={() => setTerminateTarget(null)}
        />
      )}

      {wizardOpen && createPortal(
        <div
          onClick={() => setWizardOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'center',
            alignItems: 'flex-start', padding: '40px 20px',
            background: 'rgba(14,21,36,0.35)', backdropFilter: 'blur(2px)', overflowY: 'auto',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 760, padding: '28px 32px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 22 }}>{t('view.wizard.title')}</div>
            <EstablishWizard
              excludeCarrierIds={(allCoops?.data ?? []).filter(c => c.status !== 'Terminated').map(c => c.carrier_id)}
              notify={notify}
              onClose={() => setWizardOpen(false)}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
