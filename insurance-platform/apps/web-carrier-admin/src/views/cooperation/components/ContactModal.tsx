import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useAddContact, useUpdateContact } from '@/services/cooperationService'
import type { ContactRecord, CooperationRecord } from '@/lib/user-api-client'
import type { Notify } from '../constants'

interface Props {
  coop?: CooperationRecord | null
  contact?: ContactRecord | null
  notify: Notify
  onClose: () => void
}

/** Create/edit a partner contact person. */
export default function ContactModal({ coop, contact, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const isEdit = !!contact
  const partnershipId = contact?.partnership_id ?? coop?.partnership_id ?? ''
  const carrierId = contact?.carrier_id ?? coop?.carrier_id ?? ''

  const [fullName, setFullName] = useState(contact?.full_name ?? '')
  const [position, setPosition] = useState(contact?.position ?? '')
  const [department, setDepartment] = useState(contact?.department ?? '')
  const [role, setRole] = useState(contact?.role ?? 'Senior Management')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [mobile, setMobile] = useState(contact?.mobile_phone ?? '')
  const [address, setAddress] = useState(contact?.office_address ?? '')
  const [active, setActive] = useState(contact?.is_active ?? true)
  const [primary, setPrimary] = useState(contact?.is_primary ?? false)

  const add = useAddContact()
  const update = useUpdateContact()
  const busy = add.isPending || update.isPending

  const save = async () => {
    if (!fullName.trim()) return
    try {
      if (isEdit && contact) {
        await update.mutateAsync({
          contactId: contact.contact_id,
          dto: {
            full_name: fullName.trim(), position: position || undefined, department: department || undefined,
            role, email: email || undefined, phone: phone || undefined, mobile_phone: mobile || undefined,
            office_address: address || undefined, is_active: active,
          },
        })
      } else {
        await add.mutateAsync({
          coopId: partnershipId,
          dto: {
            carrier_id: carrierId, partnership_id: partnershipId,
            full_name: fullName.trim(), position: position || undefined, department: department || undefined,
            role, email: email || undefined, phone: phone || undefined, mobile_phone: mobile || undefined,
            office_address: address || undefined, is_primary: primary,
          },
        })
      }
      notify('success', t('view.toast.contactSaved'))
      onClose()
    } catch {
      notify('error', t('view.toast.contactSaveFailed'))
    }
  }

  const field = (label: string, node: React.ReactNode) => (
    <div style={{ marginBottom: 13 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{label}</div>
      {node}
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={busy ? undefined : onClose} />
      <div className="card" style={{
        position: 'relative', width: 580, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '22px 26px', margin: 0,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>
            {isEdit ? t('view.contacts.editTitle') : t('view.contacts.addTitle')}
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            {field(t('view.form.contactName') + ' *',
              <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={fullName} onChange={e => setFullName(e.target.value)} />)}
          </div>
          {field(t('view.form.position'),
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={position} onChange={e => setPosition(e.target.value)} />)}
          {field(t('view.form.department'),
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={department} onChange={e => setDepartment(e.target.value)} />)}
          {field(t('view.form.role'),
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={role} onChange={e => setRole(e.target.value)}>
              {Object.keys(ROLES).map(r => <option key={r} value={r}>{t(ROLES[r])}</option>)}
            </select>)}
          {field(t('view.form.phone'),
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={phone} onChange={e => setPhone(e.target.value)} />)}
          <div style={{ gridColumn: '1 / -1' }}>
            {field(t('view.form.email'),
              <input type="email" className="input-glass w-full" style={{ fontSize: 13.5 }} value={email} onChange={e => setEmail(e.target.value)} />)}
          </div>
          {field(t('view.form.mobile'),
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={mobile} onChange={e => setMobile(e.target.value)} />)}
          {field(t('view.form.contactStatus'),
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={active ? '1' : '0'} onChange={e => setActive(e.target.value === '1')}>
              <option value="1">{t('view.contactStatus.active')}</option>
              <option value="0">{t('view.contactStatus.inactive')}</option>
            </select>)}
          <div style={{ gridColumn: '1 / -1' }}>
            {field(t('view.form.officeAddress'),
              <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={address} onChange={e => setAddress(e.target.value)} />)}
          </div>
        </div>

        {!isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)} style={{ accentColor: '#0058BC' }} />
            <span style={{ fontSize: 13, color: '#414755' }}>{t('view.form.setPrimary')}</span>
          </label>
        )}

        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.cancel')}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={busy || !fullName.trim()} onClick={save}>{t('view.common.save')}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const ROLES: Record<string, string> = {
  'Senior Management': 'view.form.roles.executive',
  Underwriting: 'view.form.roles.underwriting',
  Claims: 'view.form.roles.claims',
  Billing: 'view.form.roles.finance',
  'IT/API': 'view.form.roles.it',
  Legal: 'view.form.roles.legal',
  Marketing: 'view.form.roles.marketing',
}
