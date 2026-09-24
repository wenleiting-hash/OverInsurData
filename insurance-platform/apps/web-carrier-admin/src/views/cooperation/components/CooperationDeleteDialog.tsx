import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useDeleteCooperation, useBatchDeleteCooperation } from '@/services/cooperationService'
import type { Notify } from '../constants'

export interface DeleteTarget {
  id: string
  name: string
}

interface Props {
  /** One target → single-delete wording; multiple → batch wording. */
  targets: DeleteTarget[]
  notify: Notify
  onClose: () => void
  /** Called after the server confirms deletion (list clears selection / detail navigates back). */
  onDeleted?: () => void
}

/**
 * Cooperation delete confirmation dialog (V1.0.12, mirrors ProductList's modal).
 * Deletion only ever happens inside the confirm callback — never on icon click.
 * Backend independently enforces Negotiating/PendingSign; batch skips other rows
 * and the toast reports how many were skipped.
 */
export default function CooperationDeleteDialog({ targets, notify, onClose, onDeleted }: Props) {
  const { t } = useTranslation('cooperation')
  const deleteOne = useDeleteCooperation()
  const batchDelete = useBatchDeleteCooperation()
  const pending = deleteOne.isPending || batchDelete.isPending
  const batch = targets.length > 1

  const confirm = async () => {
    try {
      if (batch) {
        const res = await batchDelete.mutateAsync(targets.map(x => x.id))
        if (res.skipped > 0) {
          notify('success', t('view.toast.coopBatchDeletedPartial', { deleted: res.deleted, skipped: res.skipped }))
        } else {
          notify('success', t('view.toast.coopBatchDeleted', { count: res.deleted }))
        }
      } else {
        await deleteOne.mutateAsync({ id: targets[0].id })
        notify('success', t('view.toast.coopDeleted'))
      }
      onDeleted?.()
      onClose()
    } catch {
      notify('error', t('view.toast.coopDeleteFailed'))
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(24,28,35,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget && !pending) onClose() }}
    >
      <div className="glass-strong" style={{
        width: 460, maxWidth: 'calc(100vw - 32px)', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', background: '#fff',
      }}>
        <div style={{
          padding: '22px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(186,26,26,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} style={{ color: '#BA1A1A' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>
                {batch ? t('view.deleteDialog.batchTitle') : t('view.deleteDialog.title')}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t('view.deleteDialog.subtitle')}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} disabled={pending} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{
            background: 'rgba(255,240,240,0.9)', border: '0.5px solid rgba(186,26,26,0.25)',
            borderRadius: 12, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.7, color: '#414755',
          }}>
            {batch ? (
              <>
                {t('view.deleteDialog.batchMessage', { count: targets.length })}
                <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto' }}>
                  {targets.slice(0, 20).map(x => (
                    <div key={x.id} style={{ fontSize: 12.5, color: '#414755' }}>· {x.name}</div>
                  ))}
                  {targets.length > 20 && <div style={{ fontSize: 12.5, color: '#717786' }}>…</div>}
                </div>
              </>
            ) : (
              t('view.deleteDialog.message', { name: targets[0]?.name ?? '' })
            )}
          </div>
        </div>

        <div style={{
          padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)',
        }}>
          <button className="btn-secondary" style={{ fontSize: 13.5 }} disabled={pending} onClick={onClose}>
            {t('view.common.cancel')}
          </button>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
              background: '#BA1A1A', color: '#fff', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: pending ? 'wait' : 'pointer', border: 'none', opacity: pending ? 0.6 : 1,
            }}
            disabled={pending}
            onClick={confirm}
          >
            <Trash2 size={14} />
            {pending ? t('view.deleteDialog.deleting') : t('view.deleteDialog.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
