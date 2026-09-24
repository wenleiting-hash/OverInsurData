import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, ArrowRight, Save, Check, Users, MapPin, DollarSign, FileText,
  Info, AlertCircle, Plus, Trash2,
} from 'lucide-react'
import type { Channel } from './data/mockData'
import { channelStore } from './data/mockChannelStore'
import type { ViewId } from '@/App'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
  channelId?: string
}

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West']
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]
const CHANNEL_TYPES = [
  { value: 'Independent Agency', labelKey: 'type.independent' },
  { value: 'Broker', labelKey: 'type.Broker' },
  { value: 'MGA', labelKey: 'newChannelView.typeMgaFull' },
  { value: 'Wholesale Broker', labelKey: 'type.wholesale' },
  { value: 'Direct', labelKey: 'type.direct' },
]
const TIER_OPTIONS = [
  { value: 'Platinum', labelKey: 'tier.platinum' },
  { value: 'Gold', labelKey: 'tier.gold' },
  { value: 'Silver', labelKey: 'tier.silver' },
  { value: 'Standard', labelKey: 'tier.standard' },
]
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'P&C', 'Cyber', 'Specialty']

// 品牌蓝（对齐 Figma 原型 V1.3 设计系统 #0058BC）
const BRAND = '#0058BC'
const DONE = '#1a7a2e'
const MUTED = '#717786'
const FAINT = '#C1C6D7'

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 5 }}>
      {label}
      {required && <span style={{ color: '#BA1A1A' }}>*</span>}
      {hint && (
        <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}>
          <Info size={11} style={{ color: FAINT }} />
        </span>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#181C23', marginBottom: 16, paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const INPUT = { className: 'input-glass w-full', style: { fontSize: 13.5 } as React.CSSProperties }

export default function ChannelNewView({ navigateTo, channelId }: Props) {
  const { t } = useTranslation('channel')
  // 编辑模式：有 channelId 时从共享 store 读渠道预填已填字段
  const isEdit = !!channelId
  // 渠道详情从共享 store 加载（保证列表删除/编辑后的数据一致）
  const existing = channelId ? channelStore.getChannels().find(c => c.id === channelId) : undefined
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)
  const [contacts, setContacts] = useState([{ name: '', phone: '', email: '', role: '' }])
  // 持牌州：编辑时默认勾选渠道主营州（渠道在主营州必然持牌）
  const [selectedStates, setSelectedStates] = useState<string[]>(existing?.state ? [existing.state] : [])
  const [selectedLines, setSelectedLines] = useState<string[]>([])

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    npnCode: existing?.npnCode ?? '',
    type: existing?.type ?? 'Independent Agency',
    tier: existing?.tier ?? 'Standard',
    status: existing?.status ?? 'onboarding',
    manager: existing?.manager ?? '',
    region: existing?.region ?? 'Northeast',
    parentId: existing?.parentId ?? '',
    website: '',
    address: '',
    city: '',
    state: existing?.state ?? '',
    commissionRate: existing ? (existing.commissionRate * 100).toFixed(0) : '10',
    settlementCycle: '月结',
    bonusThreshold: '',
    bonusRate: '',
    bankName: '',
    bankAccount: '',
    bankRouting: '',
    joinDate: existing?.joinDate ?? new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const toggleState = (s: string) =>
    setSelectedStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleLine = (l: string) =>
    setSelectedLines(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])

  const handleSave = () => {
    // 表单填写的可持久化字段（回写共享 store，返回列表即时生效）
    const patch = {
      name: form.name.trim() || existing?.name || t('form.unnamed'),
      npnCode: form.npnCode.trim(),
      type: form.type as Channel['type'],
      tier: form.tier as Channel['tier'],
      status: form.status as Channel['status'],
      manager: form.manager.trim(),
      region: form.region as Channel['region'],
      state: form.state,
      commissionRate: Number(form.commissionRate) > 0 ? Number(form.commissionRate) / 100 : (existing?.commissionRate ?? 0.1),
      joinDate: form.joinDate,
      ...(form.parentId ? { parentId: form.parentId } : { parentId: undefined }),
      level: form.parentId ? 2 : 1,
    }

    if (isEdit && channelId) {
      channelStore.updateChannel(channelId, patch)
    } else {
      const newChannel: Channel = {
        id: `c-${Date.now()}`,
        agentCount: 0,
        totalPremium: 0,
        policyCount: 0,
        lossRatio: 0,
        renewalRate: 0,
        name: patch.name,
        npnCode: patch.npnCode || '—',
        type: patch.type,
        tier: patch.tier,
        status: patch.status,
        manager: patch.manager || '—',
        region: patch.region,
        state: patch.state || '—',
        commissionRate: patch.commissionRate,
        joinDate: patch.joinDate,
        level: patch.level,
        ...(patch.parentId ? { parentId: patch.parentId } : {}),
      }
      channelStore.addChannel(newChannel)
    }

    setSaved(true)
    setTimeout(() => navigateTo('channel-list'), 1200)
  }

  const topLevelChannels = channelStore.getChannels().filter(c => !c.parentId && c.id !== channelId)

  const STEPS = [
    { id: 'basic', icon: Users, label: t('newChannelView.steps.basic'), desc: t('newChannelView.steps.basicDesc') },
    { id: 'region', icon: MapPin, label: t('newChannelView.steps.region'), desc: t('newChannelView.steps.regionDesc') },
    { id: 'commission', icon: DollarSign, label: t('newChannelView.steps.commission'), desc: t('newChannelView.steps.commissionDesc') },
    { id: 'documents', icon: FileText, label: t('newChannelView.steps.documents'), desc: t('newChannelView.steps.documentsDesc') },
  ]

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Section title={t('newChannelView.sectionBasic')}>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '14px 20px' }}>
                <div>
                  <FieldLabel label={t('newChannelView.fieldName')} required />
                  <input {...INPUT} value={form.name} placeholder={t('newChannelView.phName')} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldNpn')} required hint={t('newChannelView.hintNpn')} />
                  <input {...INPUT} value={form.npnCode} placeholder={t('newChannelView.phNpn')} onChange={e => set('npnCode', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldType')} required />
                  <select {...INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                    {CHANNEL_TYPES.map(tp => (
                      <option key={tp.value} value={tp.value}>{t(tp.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldTier')} />
                  <select {...INPUT} value={form.tier} onChange={e => set('tier', e.target.value)}>
                    {TIER_OPTIONS.map(tp => (
                      <option key={tp.value} value={tp.value}>{t(tp.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldStatus')} />
                  <select {...INPUT} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="onboarding">{t('status.onboarding')}</option>
                    <option value="active">{t('status.active')}</option>
                    <option value="inactive">{t('newChannelView.statusInactiveOption')}</option>
                    <option value="suspended">{t('status.suspended')}</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldJoinDate')} required />
                  <input {...INPUT} type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldManager')} required />
                  <input {...INPUT} value={form.manager} placeholder={t('newChannelView.phManager')} onChange={e => set('manager', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldWebsite')} />
                  <input {...INPUT} value={form.website} placeholder="https://" onChange={e => set('website', e.target.value)} />
                </div>
              </div>
            </Section>

            <Section title={t('newChannelView.sectionContact')}>
              <div className="flex flex-col gap-2.5">
                {contacts.map((c, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] items-end" style={{ gap: 10 }}>
                    <div>
                      {i === 0 && <FieldLabel label={t('newChannelView.contactName')} required />}
                      <input {...INPUT} value={c.name} placeholder={t('newChannelView.phContactName')} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={t('newChannelView.contactRole')} />}
                      <input {...INPUT} value={c.role} placeholder={t('newChannelView.phContactRole')} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={t('newChannelView.contactPhone')} />}
                      <input {...INPUT} value={c.phone} placeholder={t('newChannelView.phContactPhone')} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={t('newChannelView.contactEmail')} />}
                      <input {...INPUT} value={c.email} placeholder={t('newChannelView.phContactEmail')} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                    </div>
                    <div style={{ paddingBottom: 1 }}>
                      {contacts.length > 1 && (
                        <button className="btn-ghost" style={{ color: '#BA1A1A', padding: 6 }} onClick={() => setContacts(prev => prev.filter((_, j) => j !== i))}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button className="btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-start', color: BRAND, paddingLeft: 0 }}
                  onClick={() => setContacts(prev => [...prev, { name: '', phone: '', email: '', role: '' }])}>
                  <Plus size={13} /> {t('newChannelView.addContact')}
                </button>
              </div>
            </Section>

            <Section title={t('newChannelView.sectionBiz')}>
              <FieldLabel label={t('newChannelView.fieldLines')} />
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {LINES_OF_BUSINESS.map(l => (
                  <button key={l}
                    onClick={() => toggleLine(l)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: selectedLines.includes(l) ? BRAND : 'rgba(193,198,215,0.25)',
                      color: selectedLines.includes(l) ? '#fff' : '#414755',
                      transition: 'all 0.15s',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              {selectedLines.length === 0 && (
                <div style={{ fontSize: 12, color: FAINT, marginTop: 6 }}>{t('newChannelView.linesEmpty')}</div>
              )}
            </Section>
          </>
        )

      case 1:
        return (
          <>
            <Section title={t('newChannelView.sectionRegion')}>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '14px 20px' }}>
                <div>
                  <FieldLabel label={t('newChannelView.fieldRegion')} required />
                  <select {...INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldParent')} hint={t('newChannelView.hintParent')} />
                  <select {...INPUT} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
                    <option value="">{t('newChannelView.parentNone')}</option>
                    {topLevelChannels.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldCity')} />
                  <input {...INPUT} value={form.city} placeholder={t('newChannelView.phCity')} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldState')} />
                  <select {...INPUT} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">{t('newChannelView.stateSelect')}</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel label={t('newChannelView.fieldAddress')} />
                  <input {...INPUT} value={form.address} placeholder={t('newChannelView.phAddress')} onChange={e => set('address', e.target.value)} />
                </div>
              </div>
            </Section>

            <Section title={t('newChannelView.sectionLicensed')}>
              <FieldLabel label={t('newChannelView.licensedStates')} hint={t('newChannelView.hintLicensed')} />
              <div className="flex flex-wrap" style={{ gap: 6, marginTop: 4 }}>
                {US_STATES.map(s => (
                  <button key={s}
                    onClick={() => toggleState(s)}
                    style={{
                      width: 44, padding: '4px 0', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'center',
                      background: selectedStates.includes(s) ? BRAND : 'rgba(193,198,215,0.25)',
                      color: selectedStates.includes(s) ? '#fff' : '#414755',
                      transition: 'all 0.15s',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                {t('newChannelView.statesSelected', { n: selectedStates.length })}
              </div>
            </Section>
          </>
        )

      case 2:
        return (
          <>
            <Section title={t('newChannelView.sectionCommission')}>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '14px 20px' }}>
                <div>
                  <FieldLabel label={t('newChannelView.fieldCommRate')} required hint={t('newChannelView.hintCommRate')} />
                  <input {...INPUT} type="number" min="0" max="100" value={form.commissionRate} placeholder="10" onChange={e => set('commissionRate', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldCycle')} required />
                  <select {...INPUT} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                    <option value="周结">{t('newChannelView.cycleWeek')}</option>
                    <option value="月结">{t('newChannelView.cycleMonth')}</option>
                    <option value="季结">{t('newChannelView.cycleQuarter')}</option>
                    <option value="年结">{t('newChannelView.cycleYear')}</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldBonusThreshold')} hint={t('newChannelView.hintBonusThreshold')} />
                  <input {...INPUT} type="number" min="0" value={form.bonusThreshold} placeholder="1,000,000" onChange={e => set('bonusThreshold', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldBonusRate')} />
                  <input {...INPUT} type="number" min="0" max="100" value={form.bonusRate} placeholder="12" onChange={e => set('bonusRate', e.target.value)} />
                </div>
              </div>
            </Section>

            <Section title={t('newChannelView.sectionBank')}>
              <div style={{ background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.18)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div className="flex items-center" style={{ gap: 6, fontSize: 12.5, color: BRAND }}>
                  <Info size={13} /> {t('newChannelView.bankTip')}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '14px 20px' }}>
                <div>
                  <FieldLabel label={t('newChannelView.fieldBankName')} />
                  <input {...INPUT} value={form.bankName} placeholder="Bank of America" onChange={e => set('bankName', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={t('newChannelView.fieldRouting')} />
                  <input {...INPUT} value={form.bankRouting} placeholder="021000021" onChange={e => set('bankRouting', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel label={t('newChannelView.fieldAccount')} />
                  <input {...INPUT} value={form.bankAccount} placeholder={t('newChannelView.phAccount')} onChange={e => set('bankAccount', e.target.value)} />
                </div>
              </div>
            </Section>

            <Section title={t('newChannelView.sectionNotes')}>
              <textarea
                className="input-glass w-full"
                style={{ fontSize: 13.5, minHeight: 80, resize: 'vertical' }}
                value={form.notes}
                placeholder={t('newChannelView.phNotes')}
                onChange={e => set('notes', e.target.value)}
              />
            </Section>
          </>
        )

      case 3:
        return (
          <>
            <Section title={t('newChannelView.sectionDocs')}>
              <div style={{ background: 'rgba(255,249,231,0.6)', border: '0.5px solid rgba(219,166,21,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                <div className="flex" style={{ gap: 6, fontSize: 12.5, color: '#a05800' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  {t('newChannelView.docsWarning')}
                </div>
              </div>
              {[
                { label: t('newChannelView.doc1'), hint: t('newChannelView.doc1Hint'), required: true },
                { label: t('newChannelView.doc2'), hint: t('newChannelView.doc2Hint'), required: true },
                { label: t('newChannelView.doc3'), hint: t('newChannelView.doc3Hint'), required: false },
                { label: t('newChannelView.doc4'), hint: t('newChannelView.doc4Hint'), required: false },
              ].map(doc => (
                <div key={doc.label} className="flex items-center justify-between gap-3" style={{ marginBottom: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.6)', border: '0.5px dashed rgba(193,198,215,0.7)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>
                      {doc.label}
                      {doc.required && <span style={{ color: '#BA1A1A', marginLeft: 4 }}>*</span>}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{doc.hint}</div>
                  </div>
                  <button className="btn-secondary shrink-0" style={{ fontSize: 12.5 }}>
                    <FileText size={13} /> {t('newChannelView.uploadBtn')}
                  </button>
                </div>
              ))}
            </Section>

            <Section title={t('newChannelView.sectionConfirm')}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 12, padding: '16px 20px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 32px', fontSize: 13 }}>
                  {[
                    [t('newChannelView.fieldName'), form.name || '—'],
                    [t('newChannelView.fieldNpn'), form.npnCode || '—'],
                    [t('newChannelView.fieldType'), CHANNEL_TYPES.find(tp => tp.value === form.type) ? t(CHANNEL_TYPES.find(tp => tp.value === form.type)!.labelKey) : '—'],
                    [t('newChannelView.fieldTier'), TIER_OPTIONS.find(tp => tp.value === form.tier) ? t(TIER_OPTIONS.find(tp => tp.value === form.tier)!.labelKey) : '—'],
                    [t('newChannelView.fieldManager'), form.manager || '—'],
                    [t('newChannelView.fieldRegion'), form.region || '—'],
                    [t('newChannelView.confirmCommRate'), form.commissionRate ? `${form.commissionRate}%` : '—'],
                    [t('newChannelView.fieldCycle'), form.settlementCycle],
                    [t('newChannelView.confirmStatesCount'), selectedStates.length > 0 ? t('newChannelView.confirmStatesValue', { n: selectedStates.length }) : '—'],
                    [t('newChannelView.fieldLines'), selectedLines.length > 0 ? selectedLines.join(', ') : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex" style={{ gap: 8 }}>
                      <span style={{ color: MUTED, flexShrink: 0 }}>{k}：</span>
                      <span style={{ color: '#181C23', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </>
        )
    }
  }

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost shrink-0" style={{ padding: 6 }} onClick={() => navigateTo('channel-list')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{isEdit ? t('form.editTitle') : t('newChannelView.title')}</h1>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
            {isEdit ? t('form.editSubtitle', { name: existing?.name ?? channelId }) : t('newChannelView.subtitle')}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="flex items-center flex-wrap gap-y-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isDone = i < step
            return (
              <div key={s.id} className={i < STEPS.length - 1 ? 'flex items-center flex-1 min-w-fit' : 'flex items-center'}>
                <button
                  onClick={() => setStep(i)}
                  className="flex items-center shrink-0 whitespace-nowrap"
                  style={{ gap: 8, padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(0,88,188,0.08)' : 'transparent' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: isDone ? DONE : isActive ? BRAND : 'rgba(193,198,215,0.35)',
                    color: isDone || isActive ? '#fff' : MUTED,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {isDone ? <Check size={13} /> : <Icon size={13} />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? BRAND : isDone ? DONE : MUTED }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: FAINT, display: isActive ? 'block' : 'none' }}>{s.desc}</div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block flex-1" style={{ height: 1, background: i < step ? 'rgba(26,122,46,0.4)' : 'rgba(193,198,215,0.4)', margin: '0 4px', minWidth: 16 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form body */}
      <div className="card" style={{ padding: '28px 32px', marginBottom: 16 }}>
        {renderStep()}
      </div>

      {/* Footer actions */}
      <div className="card flex items-center justify-between gap-3" style={{ padding: '14px 20px' }}>
        <button className="btn-secondary" onClick={() => step > 0 ? setStep(step - 1) : navigateTo('channel-list')} style={{ fontSize: 13 }}>
          <ArrowLeft size={14} /> {step > 0 ? t('newChannelView.prev') : t('newChannelView.cancel')}
        </button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)} style={{ fontSize: 13 }}>
              {t('newChannelView.next')} <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saved}
              style={{ fontSize: 13, background: saved ? DONE : undefined, minWidth: 100 }}>
              {saved ? <><Check size={14} /> {t('newChannelView.saved')}</> : <><Save size={14} /> {isEdit ? t('form.saveChanges') : t('newChannelView.submit')}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
