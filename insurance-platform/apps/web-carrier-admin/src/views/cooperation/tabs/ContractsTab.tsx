import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Plus, Download, Eye, RefreshCw, Edit2, Trash2, CheckCircle, X, FileText, MoreHorizontal } from 'lucide-react'
import {
  useGetContracts, useSetContractStatus, useDeleteContract,
} from '@/services/cooperationService'
import type { ContractRecord, CooperationRecord } from '@/lib/user-api-client'
import { CONTRACT_STATUS, daysUntil, type Notify } from '../constants'
import ContractModal from '../components/ContractModal'
import RowMenu, { MenuItem, MenuDivider, type MenuPos } from '../components/RowMenu'

interface Props {
  /** V1.0.10 ch.10: panel lives inside one cooperation's detail context. */
  partnership: CooperationRecord
  notify: Notify
  onCreateRenewal: (contract: ContractRecord) => void
}

/** Contract panel scoped to a single cooperation (prototype 2026-09-11 detail tab). */
export default function ContractsPanel({ partnership, notify, onCreateRenewal }: Props) {
  const { t, i18n } = useTranslation('cooperation')
  const isEn = i18n.language.startsWith('en')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContractRecord | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<{ id: string; pos: MenuPos } | null>(null)

  const { data: contracts = [], isLoading, isError, refetch } = useGetContracts(partnership.partnership_id)
  const setStatus = useSetContractStatus()
  const deleteContract = useDeleteContract()

  const sign = async (ct: ContractRecord) => {
    try {
      await setStatus.mutateAsync({ coopId: ct.partnership_id!, contractId: ct.contract_id, status: 'active' })
      notify('success', t('view.toast.contractSigned'))
    } catch (e: any) {
      notify('error', e?.response?.data?.message ? String(e.response.data.message) : t('view.toast.contractSignFailed'))
    }
  }

  const remove = async (ct: ContractRecord) => {
    try {
      await deleteContract.mutateAsync({ coopId: ct.partnership_id!, contractId: ct.contract_id })
      notify('success', t('view.toast.contractDeleted'))
      setConfirmDeleteId(null)
    } catch {
      notify('error', t('view.toast.contractDeleteFailed'))
    }
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#414755' }}>
        {t('view.contracts.countLabel', { count: contracts.length })}
      </span>
      <div className="flex gap-2">
        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setModalOpen(true)}>
          <Upload size={14} />{t('view.contracts.upload')}
        </button>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setModalOpen(true)}>
          <Plus size={14} />{t('view.contracts.new')}
        </button>
      </div>
    </div>
  )

  if (isLoading) return <div>{header}<div className="card" style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div></div>
  if (isError) return (
    <div>{header}
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
      </div>
    </div>
  )

  return (
    <div>
      {header}
      {contracts.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.contracts')}</div>
      ) : (
        <div className="card" style={{ padding: '6px 8px' }}>
          {contracts.map(ct => {
            const displayStatus = ct.status === 'active' && ct.effective_status ? ct.effective_status : ct.status
            const st = CONTRACT_STATUS[displayStatus] || CONTRACT_STATUS.draft
            const d = daysUntil(ct.expiry_date)
            const expiringSoon = ct.effective_status === 'expiring' && d !== null && d >= 0
            return (
              <div key={ct.contract_id} className="flex items-center gap-3"
                style={{ padding: '12px 10px', borderBottom: '0.5px solid rgba(193,198,215,0.25)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={16} style={{ color: '#0058BC' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>
                    {isEn && ct.title_en ? ct.title_en : ct.title}
                    {expiringSoon && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#a05800' }}>
                        {t('view.contracts.daysToExpiry', { days: d })}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                    {ct.effective_date?.slice(0, 10) ?? '—'} ～ {ct.expiry_date?.slice(0, 10) ?? '—'}
                    {ct.contract_type ? ` · ${ct.contract_type}` : ''}
                  </div>
                </div>
                <span className={`badge ${st.cls}`} style={{ flexShrink: 0 }}>{t(st.label)}</span>
                <div className="flex items-center gap-0.5" style={{ flexShrink: 0 }}>
                  {ct.file_url
                    ? <a href={ct.file_url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: 6 }} title={t('view.contracts.actions.view')}><Eye size={14} /></a>
                    : <button className="btn-ghost" style={{ padding: 6, opacity: 0.35, cursor: 'not-allowed' }} disabled title={t('view.contracts.noFile')}><Eye size={14} /></button>}
                  <button className="btn-ghost" style={{ padding: 6 }} title={t('view.common.edit')} onClick={() => setEditing(ct)}><Edit2 size={14} /></button>
                  <button
                    className="btn-ghost"
                    style={{ padding: 6 }}
                    title={t('view.common.more')}
                    onClick={(e) => {
                      if (menuFor?.id === ct.contract_id) { setMenuFor(null); return }
                      const rect = e.currentTarget.getBoundingClientRect()
                      setConfirmDeleteId(null)
                      setMenuFor({ id: ct.contract_id, pos: { x: rect.right - 150, y: rect.bottom + 4 } })
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 行「更多」菜单 */}
      {menuFor && (() => {
        const ct = contracts.find(c => c.contract_id === menuFor.id)
        if (!ct) return null
        const confirming = confirmDeleteId === ct.contract_id
        return (
          <RowMenu pos={menuFor.pos} onClose={() => { setMenuFor(null); setConfirmDeleteId(null) }}>
            {confirming ? (
              <>
                <div style={{ padding: '6px 10px 2px', fontSize: 12.5, color: '#BA1A1A', fontWeight: 600 }}>
                  {t('view.contracts.deleteConfirm')}
                </div>
                <MenuItem danger icon={<CheckCircle size={13} />} onClick={() => remove(ct).then(() => setMenuFor(null))}>
                  {t('view.common.confirm')}
                </MenuItem>
                <MenuItem icon={<X size={13} />} onClick={() => setConfirmDeleteId(null)}>
                  {t('view.common.cancel')}
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem icon={<Download size={13} />} disabled={!ct.file_url}
                  onClick={() => { if (ct.file_url) window.open(ct.file_url, '_blank') }}>
                  {t('view.contracts.actions.download')}
                </MenuItem>
                {ct.status === 'pending-sign' && (
                  <MenuItem icon={<CheckCircle size={13} />} onClick={() => { setMenuFor(null); sign(ct) }}>
                    {t('view.contracts.actions.sign')}
                  </MenuItem>
                )}
                {ct.effective_status === 'expiring' && (
                  <MenuItem icon={<RefreshCw size={13} />} onClick={() => { setMenuFor(null); onCreateRenewal(ct) }}>
                    {t('view.contracts.actions.renew')}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem danger icon={<Trash2 size={13} />} onClick={() => setConfirmDeleteId(ct.contract_id)}>
                  {t('view.common.delete')}
                </MenuItem>
              </>
            )}
          </RowMenu>
        )
      })()}

      {modalOpen && (
        <ContractModal
          coop={partnership}
          notify={notify}
          onClose={() => setModalOpen(false)}
        />
      )}
      {editing && <ContractModal contract={editing} notify={notify} onClose={() => setEditing(null)} />}
    </div>
  )
}
