import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Package, Trash2, X, AlertTriangle, ChevronRight, Link2, Eye, Edit2, Check, Loader2 } from 'lucide-react'
import {
  useGetProductLinks, useAddProductLinks, useRemoveProductLink, useUpdateProductLink,
} from '@/services/cooperationService'
import { useGetProducts } from '@/services/productService'
import type { CooperationRecord } from '@/lib/user-api-client'
import type { ViewId } from '@/App'
import { lobLabel, type Notify } from '../constants'

interface OccupiedChannel {
  channel_id: string
  auth_status: string
  channel_name: string
  hq_state: string | null
}

interface Props {
  partnership: CooperationRecord
  notify: Notify
  navigateTo: (view: ViewId, params?: { productId?: string }) => void
}

function statesText(states: any, t: (k: string) => string): string {
  if (!states) return '—'
  if (Array.isArray(states)) {
    if (!states.length) return '—'
    if (states.includes('ALL')) return t('view.integration.nationwide')
    return states.join(', ')
  }
  if (typeof states === 'string') {
    const s = states.trim()
    if (!s) return '—'
    if (s === 'ALL') return t('view.integration.nationwide')
    try {
      const arr = JSON.parse(s)
      return Array.isArray(arr) ? (arr.includes('ALL') ? t('view.integration.nationwide') : arr.join(', ')) : s
    } catch {
      return s
    }
  }
  return '—'
}

/**
 * V1.0.15 C2：合作产品直接关联（cooperation_product），取代五步申请流。
 * 取消关联时若已被渠道授权占用，后端 409 返回 occupied_channels 清单。
 */
export default function AccessPanel({ partnership, notify, navigateTo }: Props) {
  const { t } = useTranslation('cooperation')
  const [addOpen, setAddOpen] = useState(false)
  const [unlinking, setUnlinking] = useState<{ linkId: string; name: string } | null>(null)
  const [occupied, setOccupied] = useState<{ name: string; channels: OccupiedChannel[] } | null>(null)
  const [editingRemark, setEditingRemark] = useState<{ linkId: string; draft: string } | null>(null)

  const { data: links = [], isLoading, isError, refetch } = useGetProductLinks(partnership.partnership_id)
  const { data: productPage } = useGetProducts({ insurer: partnership.carrier_id, size: 500 })
  const addLinks = useAddProductLinks()
  const removeLink = useRemoveProductLink()
  const updateLink = useUpdateProductLink()

  const editable = partnership.status !== 'Terminated'

  const saveRemark = async (linkId: string) => {
    if (!editingRemark) return
    try {
      await updateLink.mutateAsync({
        coopId: partnership.partnership_id,
        linkId,
        dto: { remark: editingRemark.draft.trim() },
      })
      notify('success', t('view.toast.linkRemarkSaved'))
      setEditingRemark(null)
    } catch (e: any) {
      notify('error', e?.response?.data?.message ? String(e.response.data.message) : t('view.toast.linkRemarkSaveFailed'))
    }
  }

  const candidates = useMemo<any[]>(() => {
    const page = productPage as { data?: any[]; items?: any[] } | undefined
    return page?.data ?? page?.items ?? []
  }, [productPage])

  const linkedIds = useMemo(() => new Set(links.map((l: any) => l.product_id)), [links])

  const doUnlink = async () => {
    if (!unlinking) return
    try {
      await removeLink.mutateAsync({ coopId: partnership.partnership_id, linkId: unlinking.linkId })
      notify('success', t('view.toast.productUnlinked'))
      setUnlinking(null)
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      if (status === 409 && Array.isArray(data?.occupied_channels)) {
        setOccupied({ name: unlinking.name, channels: data.occupied_channels })
        setUnlinking(null)
      } else {
        notify('error', data?.message ? String(data.message) : t('view.toast.productUnlinkFailed'))
      }
    }
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#414755' }}>
        {t('view.integration.linksCount', { count: links.length })}
      </span>
      {editable && (
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setAddOpen(true)}>
          <Plus size={14} />{t('view.integration.addProduct')}
        </button>
      )}
    </div>
  )

  const badgeForStatus = (status: string) => {
    const active = status === 'Active' || status === 'active'
    return (
      <span className={`badge ${active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
        {active ? t('view.integration.productActive') : t('view.integration.productDelisted')}
      </span>
    )
  }

  return (
    <div>
      {header}
      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div>
      ) : isError ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
        </div>
      ) : links.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>
          <Package size={26} style={{ margin: '0 auto 10px', color: '#9AA0B4' }} />
          {t('view.empty.productLinks')}
        </div>
      ) : (
        <div className="card" style={{ padding: '6px 8px' }}>
          {links.map((lk: any) => {
            const remEdit = editingRemark && editingRemark.linkId === lk.link_id ? editingRemark : null
            return (
            <div key={lk.link_id} className="flex items-center gap-3"
              style={{ padding: '13px 10px', borderBottom: '0.5px solid rgba(193,198,215,0.25)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={16} style={{ color: '#0058BC' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: 2, color: '#0058BC' }}
                    title={t('view.integration.viewProduct')}
                    onClick={() => navigateTo('product-detail', { productId: lk.product_id })}
                  >
                    <Eye size={13} />
                  </button>
                  <span
                    style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', cursor: 'pointer' }}
                    title={t('view.integration.viewProduct')}
                    onClick={() => navigateTo('product-detail', { productId: lk.product_id })}
                  >
                    {lk.product_name}
                  </span>
                  {lk.product_code && (
                    <span className="badge badge-gray" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{lk.product_code}</span>
                  )}
                  {lk.line_of_business && <span className="badge badge-blue" style={{ fontSize: 11 }}>{lobLabel(lk.line_of_business)}</span>}
                  {badgeForStatus(lk.product_status)}
                </div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 3 }}>
                  {t('view.integration.statesCol')}{statesText(lk.available_states, t)}
                  {' · '}{t('view.integration.effectiveFromCol')}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lk.effective_from?.slice(0, 10) ?? '—'}</span>
                </div>
                {remEdit ? (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <input
                      className="input-glass"
                      style={{ fontSize: 12.5, padding: '5px 9px', flex: '1 1 240px', maxWidth: 360 }}
                      maxLength={200}
                      autoFocus
                      value={remEdit.draft}
                      onChange={e => setEditingRemark({ linkId: lk.link_id, draft: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveRemark(lk.link_id)
                        if (e.key === 'Escape') setEditingRemark(null)
                      }}
                      placeholder={t('view.integration.linkRemarkPlaceholder')}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: 5, color: '#1E8033' }}
                      title={t('view.common.save')}
                      disabled={updateLink.isPending}
                      onClick={() => saveRemark(lk.link_id)}
                    >
                      {updateLink.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: 5, color: '#717786' }}
                      title={t('view.common.cancel')}
                      onClick={() => setEditingRemark(null)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1" style={{ fontSize: 12, color: '#717786', marginTop: 3 }}>
                    {lk.remark ? (
                      <>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
                          {t('view.integration.remarkCol')}{lk.remark}
                        </span>
                        {editable && (
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ padding: 3, color: '#717786' }}
                            title={t('view.integration.editRemark')}
                            onClick={() => setEditingRemark({ linkId: lk.link_id, draft: lk.remark ?? '' })}
                          >
                            <Edit2 size={11} />
                          </button>
                        )}
                      </>
                    ) : editable && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '2px 4px', fontSize: 12, color: '#0058BC', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        onClick={() => setEditingRemark({ linkId: lk.link_id, draft: '' })}
                      >
                        <Edit2 size={11} />{t('view.integration.addRemark')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: lk.channel_auth_count > 0 ? '#a05800' : '#717786', fontWeight: 600 }}>
                  {t('view.integration.channelAuthCountWith', { count: lk.channel_auth_count })}
                </div>
              </div>
              {editable && (
                <button
                  className="btn-ghost"
                  style={{ padding: 6, color: '#BA1A1A', flexShrink: 0 }}
                  title={t('view.integration.unlink')}
                  onClick={() => setUnlinking({ linkId: lk.link_id, name: lk.product_name })}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            )
          })}
        </div>
      )}

      {addOpen && (
        <AddLinksModal
          partnership={partnership}
          candidates={candidates}
          linkedIds={linkedIds}
          notify={notify}
          onClose={() => setAddOpen(false)}
        />
      )}

      {unlinking && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={removeLink.isPending ? undefined : () => setUnlinking(null)} />
          <div className="card" style={{ position: 'relative', width: 420, maxWidth: '94vw', padding: '22px 26px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: '#BA1A1A' }} />
              {t('view.integration.unlinkConfirmTitle')}
            </div>
            <p style={{ fontSize: 13, color: '#414755', lineHeight: 1.7, marginBottom: 18 }}>
              {t('view.integration.unlinkConfirm', { name: unlinking.name })}
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" style={{ fontSize: 13 }} disabled={removeLink.isPending} onClick={() => setUnlinking(null)}>
                {t('view.common.cancel')}
              </button>
              <button className="btn-primary" style={{ fontSize: 13, background: '#BA1A1A' }} disabled={removeLink.isPending} onClick={doUnlink}>
                {t('view.common.confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {occupied && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={() => setOccupied(null)} />
          <div className="card" style={{ position: 'relative', width: 520, maxWidth: '94vw', padding: '22px 26px', margin: 0 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#BA1A1A' }}>
                <AlertTriangle size={16} />
                {t('view.integration.occupiedTitle')}
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setOccupied(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 12.5, color: '#717786', marginBottom: 12 }}>
              {t('view.integration.occupiedHint', { name: occupied.name })}
            </p>
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '0.5px solid rgba(193,198,215,0.35)', borderRadius: 10 }}>
              {occupied.channels.map((ch, i) => (
                <div key={ch.channel_id || i} className="flex items-center justify-between"
                  style={{ padding: '10px 14px', borderBottom: i < occupied.channels.length - 1 ? '0.5px solid rgba(193,198,215,0.25)' : 'none', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 600, color: '#181C23' }}>{ch.channel_name}</span>
                  <span style={{ color: '#717786' }}>
                    {ch.hq_state ? `${ch.hq_state} · ` : ''}{ch.auth_status}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end" style={{ marginTop: 16 }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setOccupied(null)}>{t('view.common.confirm')}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

// ─── 两步关联弹窗 ────────────────────────────────────────────────────

interface ModalProps {
  partnership: CooperationRecord
  candidates: any[]
  linkedIds: Set<string>
  notify: Notify
  onClose: () => void
}

function AddLinksModal({ partnership, candidates, linkedIds, notify, onClose }: ModalProps) {
  const { t } = useTranslation('cooperation')
  const [step, setStep] = useState<1 | 2>(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))
  const [remark, setRemark] = useState('')
  const addLinks = useAddProductLinks()

  const selectable = useMemo(
    () => candidates.filter(p => {
      const pid = p.product_id ?? p.id
      return pid && !linkedIds.has(pid)
    }),
    [candidates, linkedIds],
  )

  const toggle = (pid: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(pid)) n.delete(pid); else n.add(pid)
      return n
    })
  }

  const submit = async () => {
    try {
      const res: any = await addLinks.mutateAsync({
        coopId: partnership.partnership_id,
        dto: {
          product_ids: Array.from(selected),
          effective_from: effectiveFrom || undefined,
          remark: remark.trim() || undefined,
        },
      })
      notify('success', t('view.toast.productLinked', {
        inserted: res?.inserted ?? selected.size,
        skipped: res?.skipped ? t('view.integration.skippedDupWrap', { count: res.skipped }) : '',
      }))
      onClose()
    } catch (e: any) {
      notify('error', e?.response?.data?.message ? String(e.response.data.message) : t('view.toast.productLinkFailed'))
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={addLinks.isPending ? undefined : onClose} />
      <div className="card" style={{
        position: 'relative', width: 640, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '22px 26px', margin: 0,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>
            {t('view.integration.addTitle')}
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* 步骤条 */}
        <div className="flex items-center" style={{ marginBottom: 18, fontSize: 12.5 }}>
          <span style={{ fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0058BC' : '#717786' }}>
            1. {t('view.integration.step1')}
          </span>
          <ChevronRight size={13} style={{ margin: '0 8px', color: '#9AA0B4' }} />
          <span style={{ fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0058BC' : '#717786' }}>
            2. {t('view.integration.step2')}
          </span>
        </div>

        {step === 1 ? (
          <>
            <div style={{ marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>
                  {t('view.integration.effectiveFrom')}
                </div>
                <input type="date" className="input-glass w-full" style={{ fontSize: 13 }}
                  value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} />
              </div>
              <div style={{ flex: '2 1 280px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>
                  {t('view.integration.linkRemark')}
                </div>
                <input className="input-glass w-full" style={{ fontSize: 13 }} maxLength={200}
                  value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder={t('view.integration.linkRemarkPlaceholder')} />
              </div>
            </div>

            {selectable.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#717786', fontSize: 13, border: '0.5px dashed rgba(193,198,215,0.5)', borderRadius: 12 }}>
                {t('view.integration.candidateEmpty')}
              </div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto', border: '0.5px solid rgba(193,198,215,0.35)', borderRadius: 10 }}>
                {selectable.map(p => {
                  const pid = p.product_id ?? p.id
                  const checked = selected.has(pid)
                  const active = p.status === 'Active' || p.status === 'active'
                  return (
                    <label key={pid} className="flex items-center gap-3"
                      style={{
                        padding: '11px 14px', cursor: 'pointer',
                        borderBottom: '0.5px solid rgba(193,198,215,0.22)',
                        background: checked ? 'rgba(0,88,188,0.05)' : 'transparent',
                      }}>
                      <input type="checkbox" style={{ accentColor: '#0058BC' }} checked={checked} onChange={() => toggle(pid)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{p.product_name}</span>
                          {p.product_code && (
                            <span className="badge badge-gray" style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>{p.product_code}</span>
                          )}
                          {p.line_of_business && <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{lobLabel(p.line_of_business)}</span>}
                          {!active && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{t('view.integration.productDelisted')}</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{statesText(p.available_states, t)}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
              <span style={{ fontSize: 12.5, color: '#717786' }}>
                {t('view.integration.selectedCount', { count: selected.size })}
              </span>
              <div className="flex gap-2">
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.cancel')}</button>
                <button className="btn-primary" style={{ fontSize: 13 }} disabled={selected.size === 0} onClick={() => setStep(2)}>
                  {t('view.integration.next')}<ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 12.5, color: '#414755' }}>
              <div>{t('view.integration.effectiveFromColon')}<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{effectiveFrom || '—'}</span></div>
              {remark.trim() && <div style={{ marginTop: 4 }}>{t('view.integration.linkRemarkWith', { text: remark.trim() })}</div>}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '0.5px solid rgba(193,198,215,0.35)', borderRadius: 10 }}>
              {selectable.filter(p => selected.has(p.product_id ?? p.id)).map(p => (
                <div key={p.product_id ?? p.id} className="flex items-center gap-2"
                  style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(193,198,215,0.22)', fontSize: 13 }}>
                  <Link2 size={13} style={{ color: '#0058BC' }} />
                  <span style={{ fontWeight: 600, color: '#181C23' }}>{p.product_name}</span>
                  {p.product_code && <span style={{ color: '#717786', fontSize: 12 }}>{p.product_code}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end" style={{ marginTop: 16 }}>
              <button className="btn-secondary" style={{ fontSize: 13 }} disabled={addLinks.isPending} onClick={() => setStep(1)}>
                {t('view.integration.back')}
              </button>
              <button className="btn-primary" style={{ fontSize: 13 }} disabled={addLinks.isPending} onClick={submit}>
                <Plus size={13} />{t('view.integration.confirmAddCount', { count: selected.size })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
