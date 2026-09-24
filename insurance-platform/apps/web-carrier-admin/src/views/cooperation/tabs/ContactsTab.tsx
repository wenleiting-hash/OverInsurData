import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Users, Mail, Phone, Edit2, Star, Trash2, CheckCircle, X, MoreHorizontal } from 'lucide-react'
import {
  useGetContacts, useSetPrimaryContact, useDeleteContact,
} from '@/services/cooperationService'
import type { ContactRecord, CooperationRecord } from '@/lib/user-api-client'
import { ROLE_ICON, ROLE_COLOR, type Notify } from '../constants'
import ContactModal from '../components/ContactModal'
import RowMenu, { MenuItem, MenuDivider, type MenuPos } from '../components/RowMenu'

interface Props {
  partnership: CooperationRecord
  notify: Notify
}

/** Contacts panel scoped to one cooperation (prototype 2026-09-11 dual-column cards). */
export default function ContactsPanel({ partnership, notify }: Props) {
  const { t } = useTranslation('cooperation')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContactRecord | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<{ id: string; pos: MenuPos } | null>(null)

  const { data: contacts = [], isLoading, isError, refetch } = useGetContacts(partnership.partnership_id)
  const setPrimary = useSetPrimaryContact()
  const deleteContact = useDeleteContact()

  const makePrimary = async (ct: ContactRecord) => {
    try {
      await setPrimary.mutateAsync({ contactId: ct.contact_id })
      notify('success', t('view.toast.primarySet'))
    } catch {
      notify('error', t('view.toast.primarySetFailed'))
    }
  }

  const remove = async (ct: ContactRecord) => {
    try {
      await deleteContact.mutateAsync({ contactId: ct.contact_id })
      notify('success', t('view.toast.contactDeleted'))
      setConfirmDeleteId(null)
    } catch {
      notify('error', t('view.toast.contactDeleteFailed'))
    }
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#414755' }}>
        {t('view.contacts.count', { count: contacts.length })}
      </span>
      <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setModalOpen(true)}>
        <Plus size={14} />{t('view.contacts.addContact')}
      </button>
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
      {contacts.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.contacts')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {contacts.map(ct => {
            const RoleIcon = ROLE_ICON[ct.role ?? ''] ?? Users
            const roleColor = ROLE_COLOR[ct.role ?? ''] ?? '#717786'
            return (
              <div key={ct.contact_id} className="card" style={{ padding: '16px 18px' }}>
                <div className="flex items-start gap-3">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: roleColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RoleIcon size={16} style={{ color: roleColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{ct.full_name}</span>
                      {ct.is_primary && <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{t('view.contacts.primary')}</span>}
                      {ct.is_active === false && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{t('view.contactStatus.inactive')}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{[ct.position, ct.department].filter(Boolean).join(' · ') || '—'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ct.email && (
                        <a href={`mailto:${ct.email}`} className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#0058BC', textDecoration: 'none' }}>
                          <Mail size={12} />{ct.email}
                        </a>
                      )}
                      {ct.phone && (
                        <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#414755' }}>
                          <Phone size={12} />{ct.phone}
                          {ct.mobile_phone && <span style={{ color: '#717786' }}>· {ct.mobile_phone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <span className="badge badge-gray" style={{ fontSize: 10.5, background: roleColor + '14', color: roleColor, borderColor: roleColor + '30' }}>{ct.role ?? '—'}</span>
                    <div className="flex gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }} title={t('view.common.edit')} onClick={() => setEditing(ct)}><Edit2 size={12} /></button>
                      <button
                        className="btn-ghost"
                        style={{ padding: 5 }}
                        title={t('view.common.more')}
                        onClick={(e) => {
                          if (menuFor?.id === ct.contact_id) { setMenuFor(null); return }
                          const rect = e.currentTarget.getBoundingClientRect()
                          setConfirmDeleteId(null)
                          setMenuFor({ id: ct.contact_id, pos: { x: rect.right - 160, y: rect.bottom + 4 } })
                        }}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 行「更多」菜单 */}
      {menuFor && (() => {
        const ct = contacts.find(c => c.contact_id === menuFor.id)
        if (!ct) return null
        const confirming = confirmDeleteId === ct.contact_id
        return (
          <RowMenu pos={menuFor.pos} onClose={() => { setMenuFor(null); setConfirmDeleteId(null) }} minWidth={160}>
            {confirming ? (
              <>
                <div style={{ padding: '6px 10px 2px', fontSize: 12.5, color: '#BA1A1A', fontWeight: 600 }}>
                  {t('view.contacts.deleteConfirm')}
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
                {!ct.is_primary && (
                  <MenuItem icon={<Star size={13} />} onClick={() => { setMenuFor(null); makePrimary(ct) }}>
                    {t('view.contacts.setPrimary')}
                  </MenuItem>
                )}
                {!ct.is_primary && <MenuDivider />}
                <MenuItem danger icon={<Trash2 size={13} />} onClick={() => setConfirmDeleteId(ct.contact_id)}>
                  {t('view.common.delete')}
                </MenuItem>
              </>
            )}
          </RowMenu>
        )
      })()}

      {modalOpen && <ContactModal coop={partnership} notify={notify} onClose={() => setModalOpen(false)} />}
      {editing && <ContactModal contact={editing} notify={notify} onClose={() => setEditing(null)} />}
    </div>
  )
}
