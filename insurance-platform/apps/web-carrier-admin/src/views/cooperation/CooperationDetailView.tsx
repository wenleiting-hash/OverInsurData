import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit2, XCircle, Trash2 } from 'lucide-react'
import { useGetCooperation } from '@/services/cooperationService'
import type { ViewId } from '@/App'
import {
  DETAIL_TABS, COOP_STATUS, COOP_DELETABLE, COOP_EDITABLE, COOP_TYPE_LABEL,
  formatMonthRange, type DetailTabId, type Notify,
} from './constants'
import ContractsPanel from './tabs/ContractsTab'
import SettlementPanel from './tabs/SettlementTab'
import ContactsPanel from './tabs/ContactsTab'
import RenewalPanel, { type RenewalPrefill } from './tabs/RenewalTab'
import AccessPanel from './tabs/IntegrationTab'
import RatesPanel from './tabs/RatesTab'
import CooperationEditDrawer from './components/CooperationEditDrawer'
import TerminatePanel from './components/TerminatePanel'
import CooperationDeleteDialog from './components/CooperationDeleteDialog'

interface Props {
  partnershipId: string
  onBack: () => void
  notify: Notify
  navigateTo: (view: ViewId, params?: { productId?: string }) => void
}

/** Single-cooperation page: header card + 6 context tabs (V1.0.15: 佣金率只读 Tab). */
export default function CooperationDetailView({ partnershipId, onBack, notify, navigateTo }: Props) {
  const { t } = useTranslation('cooperation')
  const [tab, setTab] = useState<DetailTabId>('contracts')
  const [editOpen, setEditOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renewalPrefill, setRenewalPrefill] = useState<RenewalPrefill | null>(null)

  const { data: partnership, isLoading, isError, refetch } = useGetCooperation(partnershipId)

  // V1.0.15 O6：合同卡「续签」直接唤起续约登记弹窗（预选续约合同），无谈判中间态。
  const createRenewalFromContract = (ct: { contract_id: string }) => {
    setRenewalPrefill({ contractId: ct.contract_id })
    setTab('renewal')
  }

  if (isLoading) {
    return <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div>
  }
  if (isError || !partnership) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
        <div className="flex gap-2" style={{ justifyContent: 'center' }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onBack}>{t('view.detail.back')}</button>
        </div>
      </div>
    )
  }

  // Badge reflects the derived status (Expiring/Expired); actions key off the stored status.
  const displayStatus = partnership.effective_status ?? partnership.status
  const sc = COOP_STATUS[displayStatus] || COOP_STATUS.Negotiating
  const shortName = partnership.insurer_short ?? partnership.carrier_id
  const fullName = partnership.insurer_name ?? shortName
  const isTerminated = partnership.status === 'Terminated'
  const isActive = partnership.status === 'Active'
  const deletable = COOP_DELETABLE.includes(partnership.status)
  // In-force / terminated cooperations cannot be edited (V1.0.12 rule) — edit greys out.
  const editable = COOP_EDITABLE.includes(partnership.status)

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: 13, color: '#0058BC', fontWeight: 500,
        }}
      >
        <ArrowLeft size={14} />{t('view.detail.back')}
      </button>

      {/* Header card */}
      <div className="card" style={{ padding: '22px 26px', marginBottom: 18 }}>
        <div className="flex items-start justify-between" style={{ gap: 16, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.24))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#0058BC',
            }}>
              {shortName.slice(0, 3).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#181C23' }}>{fullName}</span>
                <span className={`orb ${sc.orb}`} />
                <span className={`badge ${sc.cls}`}>{t(sc.label)}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: '#717786' }}>
                <span>
                  <span style={{ color: '#9AA0B4' }}>{t('view.detail.metaType')}</span>
                  {partnership.cooperation_type ? t(COOP_TYPE_LABEL[partnership.cooperation_type] ?? partnership.cooperation_type) : '—'}
                </span>
                <span>
                  <span style={{ color: '#9AA0B4' }}>{t('view.detail.metaTerm')}</span>
                  {formatMonthRange(partnership.effective_date, isTerminated ? (partnership.terminated_at ?? partnership.expiration_date) : partnership.expiration_date, t('view.coopCard.permanent'))}
                </span>
                <span>
                  <span style={{ color: '#9AA0B4' }}>{t('view.detail.metaOwner')}</span>
                  {partnership.owner_name ?? '—'}
                </span>
                {partnership.naic_code && (
                  <span>
                    <span style={{ color: '#9AA0B4' }}>{t('view.detail.metaNaic')}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{partnership.naic_code}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Edit greyed out for in-force/terminated cooperations (V1.0.12 rule). */}
            <button
              className="btn-secondary"
              style={{ fontSize: 13, opacity: editable ? 1 : 0.45, cursor: editable ? 'pointer' : 'not-allowed' }}
              disabled={!editable}
              title={editable ? t('view.detail.edit') : t('view.list.editDisabled')}
              onClick={() => setEditOpen(true)}
            >
              <Edit2 size={13} />{t('view.detail.edit')}
            </button>
            {/* Pre-signing cooperations can be deleted; opens the confirmation dialog. */}
            {deletable && (
              <button
                className="btn-secondary"
                style={{ fontSize: 13, color: '#BA1A1A', borderColor: 'rgba(186,26,26,0.35)' }}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 size={13} />{t('view.detail.delete')}
              </button>
            )}
            {/* Termination is a direct action (no approval); only in-force cooperations. */}
            {isActive && (
              <button
                className="btn-primary"
                style={{ fontSize: 13, background: '#BA1A1A' }}
                onClick={() => setTerminateOpen(true)}
              >
                <XCircle size={13} />{t('view.detail.terminate')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context tabs */}
      <div className="tab-bar" style={{ marginBottom: 18 }}>
        {DETAIL_TABS.map(tb => (
          <button key={tb.id} className={`tab-item${tab === tb.id ? ' active' : ''}`} onClick={() => setTab(tb.id)}>
            <tb.icon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === 'contracts' && (
        <ContractsPanel partnership={partnership} notify={notify} onCreateRenewal={createRenewalFromContract} />
      )}
      {tab === 'settlement' && <SettlementPanel partnership={partnership} notify={notify} />}
      {tab === 'rates' && <RatesPanel partnership={partnership} notify={notify} navigateTo={navigateTo} />}
      {tab === 'contacts' && <ContactsPanel partnership={partnership} notify={notify} />}
      {tab === 'renewal' && (
        <RenewalPanel partnership={partnership} notify={notify} prefill={renewalPrefill} onPrefillConsumed={() => setRenewalPrefill(null)} />
      )}
      {tab === 'access' && <AccessPanel partnership={partnership} notify={notify} navigateTo={navigateTo} />}

      {editOpen && <CooperationEditDrawer coop={partnership} notify={notify} onClose={() => setEditOpen(false)} />}
      {terminateOpen && (
        <TerminatePanel coop={partnership} notify={notify} onClose={() => setTerminateOpen(false)} />
      )}

      {deleteDialogOpen && (
        <CooperationDeleteDialog
          targets={[{
            id: partnership.partnership_id,
            name: partnership.insurer_short ?? partnership.insurer_name ?? partnership.carrier_id,
          }]}
          notify={notify}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={() => onBack()}
        />
      )}
    </div>
  )
}
