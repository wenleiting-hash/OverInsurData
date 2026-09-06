import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Save, Check, Users, MapPin, DollarSign, FileText,
  Info, AlertCircle, Plus, Trash2,
} from 'lucide-react'
import { channelStore } from '../data/channelStore'
import type { Channel } from '../data/mockData'
import { useLang } from '../i18n'
import type { ViewId } from '../components/Sidebar'

interface Props {
  mode: 'create' | 'edit'
  channelId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const STEPS = [
  { id: 'basic', label: { zh: '基本信息', en: 'Basic Info' }, icon: Users, desc: { zh: '渠道名称、类型、负责人', en: 'Channel name, type, manager' } },
  { id: 'region', label: { zh: '区域配置', en: 'Region & Licensing' }, icon: MapPin, desc: { zh: '所属大区、合作州、上级渠道', en: 'Region, licensed states, parent channel' } },
  { id: 'commission', label: { zh: '佣金配置', en: 'Commission' }, icon: DollarSign, desc: { zh: '佣金率、分润结构', en: 'Commission rates, payment setup' } },
  { id: 'documents', label: { zh: '资质文件', en: 'Documents' }, icon: FileText, desc: { zh: '执照、合规文件、合同', en: 'Licenses, compliance, contracts' } },
]

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West']
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]
const CHANNEL_TYPES = [
  { value: 'Independent Agency', zh: '独立代理', en: 'Independent Agency' },
  { value: 'Broker', zh: '经纪商', en: 'Broker' },
  { value: 'MGA', zh: 'MGA（Managing General Agent）', en: 'MGA (Managing General Agent)' },
  { value: 'Wholesale Broker', zh: '批发经纪', en: 'Wholesale Broker' },
  { value: 'Direct', zh: '直销', en: 'Direct' },
]
const TIER_OPTIONS = [
  { value: 'Platinum', zh: '铂金', en: 'Platinum' },
  { value: 'Gold', zh: '金级', en: 'Gold' },
  { value: 'Silver', zh: '银级', en: 'Silver' },
  { value: 'Standard', zh: '标准', en: 'Standard' },
]
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'P&C', 'Cyber', 'Specialty']

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      {label}
      {required && <span style={{ color: '#BA1A1A' }}>*</span>}
      {hint && <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}><Info size={11} style={{ color: '#C1C6D7' }} /></span>}
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

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 20px' }}>
      {children}
    </div>
  )
}

const INPUT = { className: 'input-glass w-full', style: { fontSize: 13.5 } }

export default function ChannelForm({ mode, channelId, navigateTo }: Props) {
  const { lang } = useLang()
  const en = lang === 'en'
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
    zip: '',
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
      name: form.name.trim() || existing?.name || '未命名渠道',
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

    if (mode === 'edit' && channelId) {
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

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Section title={en ? 'Channel Information' : '渠道基本信息'}>
              <Grid cols={2}>
                <div>
                  <FieldLabel label={en ? 'Channel Name' : '渠道名称'} required />
                  <input {...INPUT} value={form.name} placeholder={en ? 'e.g. Pacific Coast Insurance Agency' : '例：Pacific Coast Insurance Agency'} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'NPN Code' : 'NPN编码'} required hint={en ? 'National Producer Number' : 'National Producer Number，全国生产者编号'} />
                  <input {...INPUT} value={form.npnCode} placeholder={en ? 'e.g. NPN-20340001' : '例：NPN-20340001'} onChange={e => set('npnCode', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'Channel Type' : '渠道类型'} required />
                  <select {...INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                    {CHANNEL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{en ? t.en : t.zh}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'Tier' : '渠道等级'} />
                  <select {...INPUT} value={form.tier} onChange={e => set('tier', e.target.value)}>
                    {TIER_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{en ? t.en : t.zh}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'Status' : '渠道状态'} />
                  <select {...INPUT} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="onboarding">{en ? 'Onboarding' : '入驻中'}</option>
                    <option value="active">{en ? 'Active' : '活跃'}</option>
                    <option value="inactive">{en ? 'Inactive' : '停用'}</option>
                    <option value="suspended">{en ? 'Suspended' : '已暂停'}</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'Join Date' : '入驻日期'} required />
                  <input {...INPUT} type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'Manager' : '负责人'} required />
                  <input {...INPUT} value={form.manager} placeholder={en ? 'Primary contact name' : '渠道对接负责人姓名'} onChange={e => set('manager', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'Website' : '官网'} />
                  <input {...INPUT} value={form.website} placeholder="https://" onChange={e => set('website', e.target.value)} />
                </div>
              </Grid>
            </Section>

            <Section title={en ? 'Contacts' : '联系人信息'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contacts.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      {i === 0 && <FieldLabel label={en ? 'Name' : '姓名'} required />}
                      <input {...INPUT} value={c.name} placeholder={en ? 'Contact name' : '联系人姓名'} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={en ? 'Title' : '职位'} />}
                      <input {...INPUT} value={c.role} placeholder={en ? 'Job title' : '职位头衔'} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={en ? 'Phone' : '电话'} />}
                      <input {...INPUT} value={c.phone} placeholder="+1 (555) 000-0000" onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                    </div>
                    <div>
                      {i === 0 && <FieldLabel label={en ? 'Email' : '邮箱'} />}
                      <input {...INPUT} value={c.email} placeholder="email@example.com" onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
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
                <button className="btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-start', color: '#4F46E5', paddingLeft: 0 }}
                  onClick={() => setContacts(prev => [...prev, { name: '', phone: '', email: '', role: '' }])}>
                  <Plus size={13} /> {en ? 'Add Contact' : '添加联系人'}
                </button>
              </div>
            </Section>

            <Section title={en ? 'Lines of Business' : '业务范围'}>
              <FieldLabel label={en ? 'Lines of Business' : '承保险种'} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LINES_OF_BUSINESS.map(l => (
                  <button key={l}
                    onClick={() => toggleLine(l)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: selectedLines.includes(l) ? '#4F46E5' : 'rgba(193,198,215,0.25)',
                      color: selectedLines.includes(l) ? '#fff' : '#414755',
                      transition: 'all 0.15s',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              {selectedLines.length === 0 && (
                <div style={{ fontSize: 12, color: '#C1C6D7', marginTop: 6 }}>{en ? 'Select at least one line of business' : '未选择险种，请至少选择一项'}</div>
              )}
            </Section>
          </>
        )

      case 1:
        return (
          <>
            <Section title={en ? 'Region & Licensing' : '区域配置'}>
              <Grid cols={2}>
                <div>
                  <FieldLabel label={en ? 'Region' : '所属大区'} required />
                  <select {...INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'Parent Channel' : '上级渠道'} hint={en ? 'Select the parent if this is a sub-channel' : '若为子渠道，选择所属上级'} />
                  <select {...INPUT} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
                    <option value="">{en ? 'None (top-level channel)' : '无（顶级渠道）'}</option>
                    {topLevelChannels.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'City' : '城市'} />
                  <input {...INPUT} value={form.city} placeholder={en ? 'City' : '城市'} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'State' : '州'} />
                  <select {...INPUT} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">{en ? 'Select state' : '选择州'}</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel label={en ? 'Address' : '地址'} />
                  <input {...INPUT} value={form.address} placeholder={en ? 'Street address' : '街道地址'} onChange={e => set('address', e.target.value)} />
                </div>
              </Grid>
            </Section>

            <Section title={en ? 'Licensed States' : '持牌州'}>
              <FieldLabel label={en ? 'Licensed states (multi-select)' : '已持牌州（可多选）'} hint={en ? 'States where this channel is licensed to operate' : '渠道在哪些州拥有合法经营许可'} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {US_STATES.map(s => (
                  <button key={s}
                    onClick={() => toggleState(s)}
                    style={{
                      width: 44, padding: '4px 0', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'center',
                      background: selectedStates.includes(s) ? '#4F46E5' : 'rgba(193,198,215,0.25)',
                      color: selectedStates.includes(s) ? '#fff' : '#414755',
                      transition: 'all 0.15s',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#717786', marginTop: 8 }}>
                {en
                  ? <><strong>{selectedStates.length}</strong> state{selectedStates.length !== 1 ? 's' : ''} selected</>
                  : <>已选 <strong>{selectedStates.length}</strong> 个州</>}
              </div>
            </Section>
          </>
        )

      case 2:
        return (
          <>
            <Section title={en ? 'Commission Setup' : '佣金基础配置'}>
              <Grid cols={2}>
                <div>
                  <FieldLabel label={en ? 'Base Commission Rate (%)' : '基础佣金率（%）'} required hint={en ? 'New-business commission rate' : '新单佣金比例'} />
                  <input {...INPUT} type="number" min="0" max="100" value={form.commissionRate} placeholder="10" onChange={e => set('commissionRate', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'Settlement Cycle' : '结算周期'} required />
                  <select {...INPUT} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                    <option value="周结">{en ? 'Weekly' : '周结'}</option>
                    <option value="月结">{en ? 'Monthly' : '月结'}</option>
                    <option value="季结">{en ? 'Quarterly' : '季结'}</option>
                    <option value="年结">{en ? 'Annual' : '年结'}</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label={en ? 'Bonus Threshold ($)' : '超额奖励门槛（$）'} hint={en ? 'Premium above this volume is paid at the bonus rate' : '超过此保费额度后按奖励佣金率结算'} />
                  <input {...INPUT} type="number" min="0" value={form.bonusThreshold} placeholder="1,000,000" onChange={e => set('bonusThreshold', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label={en ? 'Bonus Commission Rate (%)' : '超额奖励佣金率（%）'} />
                  <input {...INPUT} type="number" min="0" max="100" value={form.bonusRate} placeholder="12" onChange={e => set('bonusRate', e.target.value)} />
                </div>
              </Grid>
            </Section>

            <Section title={en ? 'Payment Account' : '收款账户'}>
              <div style={{ background: 'rgba(79,70,229,0.04)', border: '0.5px solid rgba(79,70,229,0.18)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4F46E5' }}>
                  <Info size={13} /> {en ? 'Account details are used for settlement payouts. Please verify carefully.' : '账户信息将用于结算打款，请确保信息准确无误'}
                </div>
              </div>
              <Grid cols={2}>
                <div>
                  <FieldLabel label={en ? 'Bank Name' : '开户银行'} />
                  <input {...INPUT} value={form.bankName} placeholder="Bank of America" onChange={e => set('bankName', e.target.value)} />
                </div>
                <div>
                  <FieldLabel label="ABA Routing Number" />
                  <input {...INPUT} value={form.bankRouting} placeholder="021000021" onChange={e => set('bankRouting', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel label={en ? 'Account Number' : '账户号码'} />
                  <input {...INPUT} value={form.bankAccount} placeholder={en ? 'Account number' : '账户号码'} onChange={e => set('bankAccount', e.target.value)} />
                </div>
              </Grid>
            </Section>

            <Section title={en ? 'Notes' : '备注'}>
              <textarea
                className="input-glass w-full"
                style={{ fontSize: 13.5, minHeight: 80, resize: 'vertical' }}
                value={form.notes}
                placeholder={en ? 'Additional notes…' : '其他备注信息…'}
                onChange={e => set('notes', e.target.value)}
              />
            </Section>
          </>
        )

      case 3:
        return (
          <>
            <Section title={en ? 'Document Upload' : '资质文件上传'}>
              <div style={{ background: 'rgba(255,249,231,0.6)', border: '0.5px solid rgba(219,166,21,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 6, fontSize: 12.5, color: '#a05800' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  {en ? 'Please upload the latest valid versions. Expired documents will delay channel review.' : '请上传最新有效版本的文件，过期文件将影响渠道审核进度'}
                </div>
              </div>
              {[
                { label: en ? 'Business License / E&O Certificate' : '营业执照 / E&O保险证书', required: true, hint: en ? 'Valid insurance broker license' : '有效期内的保险经纪执照' },
                { label: en ? 'Channel Cooperation Agreement' : '渠道合作协议', required: true, hint: en ? 'Signed master cooperation agreement' : '已签署的合作框架协议' },
                { label: en ? 'Compliance Statement' : '合规声明文件', required: false, hint: en ? 'Compliance statement or W-9 form' : 'Compliance statement 或 W-9 表格' },
                { label: en ? 'NPN Verification Screenshot' : 'NPN核验截图', required: false, hint: en ? 'License screenshot from NIPR' : '来自 NIPR 的持牌截图' },
              ].map(doc => (
                <div key={doc.label} style={{ marginBottom: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.6)', border: '0.5px dashed rgba(193,198,215,0.7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>
                      {doc.label}
                      {doc.required && <span style={{ color: '#BA1A1A', marginLeft: 4 }}>*</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#717786', marginTop: 3 }}>{doc.hint}</div>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: 12.5 }}>
                    <FileText size={13} /> {en ? 'Upload' : '上传文件'}
                  </button>
                </div>
              ))}
            </Section>

            <Section title={en ? 'Review & Confirm' : '信息确认'}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', fontSize: 13 }}>
                  {[
                    [en ? 'Channel Name' : '渠道名称', form.name || '—'],
                    ['NPN', form.npnCode || '—'],
                    [en ? 'Channel Type' : '渠道类型', en ? (CHANNEL_TYPES.find(t => t.value === form.type)?.en ?? '—') : (CHANNEL_TYPES.find(t => t.value === form.type)?.zh ?? '—')],
                    [en ? 'Tier' : '渠道等级', en ? (TIER_OPTIONS.find(t => t.value === form.tier)?.en ?? '—') : (TIER_OPTIONS.find(t => t.value === form.tier)?.zh ?? '—')],
                    [en ? 'Manager' : '负责人', form.manager || '—'],
                    [en ? 'Region' : '所属大区', form.region || '—'],
                    [en ? 'Base Commission Rate' : '基础佣金率', form.commissionRate ? `${form.commissionRate}%` : '—'],
                    [en ? 'Settlement Cycle' : '结算周期', { '周结': en ? 'Weekly' : '周结', '月结': en ? 'Monthly' : '月结', '季结': en ? 'Quarterly' : '季结', '年结': en ? 'Annual' : '年结' }[form.settlementCycle] || form.settlementCycle],
                    [en ? 'Licensed States' : '持牌州数量', selectedStates.length > 0 ? (en ? `${selectedStates.length} state${selectedStates.length !== 1 ? 's' : ''}` : `${selectedStates.length} 个州`) : '—'],
                    [en ? 'Lines of Business' : '承保险种', selectedLines.length > 0 ? selectedLines.join(', ') : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#717786', flexShrink: 0 }}>{k}：</span>
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost" style={{ padding: 6 }} onClick={() => navigateTo('channel-list')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
            {mode === 'create' ? (en ? 'Add Channel' : '新增渠道') : (en ? 'Edit Channel' : '编辑渠道')}
          </h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {mode === 'create'
              ? (en ? 'Complete the channel onboarding setup' : '填写渠道信息，完成入驻配置')
              : (en ? `Editing: ${existing?.name ?? channelId}` : `编辑渠道：${existing?.name ?? channelId}`)}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isDone = i < step
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
                <button
                  onClick={() => setStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(79,70,229,0.1)' : 'transparent',
                    flexShrink: 0,
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: isDone ? '#1a7a2e' : isActive ? '#4F46E5' : 'rgba(193,198,215,0.35)',
                    color: isDone || isActive ? '#fff' : '#717786',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {isDone ? <Check size={13} /> : <Icon size={13} />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#4F46E5' : isDone ? '#1a7a2e' : '#717786' }}>{en ? s.label.en : s.label.zh}</div>
                    <div style={{ fontSize: 11, color: '#C1C6D7', display: isActive ? 'block' : 'none' }}>{en ? s.desc.en : s.desc.zh}</div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(26,122,46,0.4)' : 'rgba(193,198,215,0.4)', margin: '0 4px' }} />
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
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn-secondary" onClick={() => step > 0 ? setStep(step - 1) : navigateTo('channel-list')} style={{ fontSize: 13 }}>
          <ArrowLeft size={14} /> {step > 0 ? (en ? 'Back' : '上一步') : (en ? 'Cancel' : '取消')}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)} style={{ fontSize: 13 }}>
              {en ? 'Next' : '下一步'} <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saved}
              style={{ fontSize: 13, background: saved ? '#1a7a2e' : undefined, minWidth: 100 }}>
              {saved
                ? <><Check size={14} /> {en ? 'Saved' : '已保存'}</>
                : <><Save size={14} /> {mode === 'create' ? (en ? 'Submit Onboarding' : '提交入驻') : (en ? 'Save Changes' : '保存修改')}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
