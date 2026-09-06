import { useState } from 'react'
import {
  ArrowLeft, ChevronRight, CheckCircle, Info, Plus, X, Upload,
  FileText, Package, Shield, Globe, BookOpen, AlertTriangle,
} from 'lucide-react'
import { products, insurers } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  mode: 'create' | 'edit'
  productId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'E&O', 'Marine', 'Specialty']
const SUB_LINES: Record<string, string[]> = {
  Auto: ['Personal Auto', 'Commercial Auto', 'Fleet Auto'],
  Home: ['Homeowners', 'High-Value Home', 'Renters', 'Condo'],
  Commercial: ['Commercial Property', 'BOP', 'General Liability', 'Workers Comp'],
  Cyber: ['SME Cyber', 'Enterprise Cyber', 'Technology E&O'],
  Life: ['Term Life', 'Whole Life', 'Universal Life', 'Variable Life'],
  Travel: ['Travel Insurance', 'Trip Cancellation', 'Medical Evacuation'],
  Professional: ['E&O', 'Miscellaneous Professional', 'Medical Malpractice'],
  "D&O": ["Directors & Officers", "Employment Practices", "Fiduciary"],
  "E&O": ["Technology E&O", "Media Liability", "Design Professional"],
  Marine: ['Ocean Marine', 'Inland Marine', 'Yacht'],
  Specialty: ['Excess & Surplus', 'Admitted Specialty', 'Non-Standard'],
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const STEPS = [
  { id: 0, label: '基本信息', icon: Package },
  { id: 1, label: '费率配置', icon: FileText },
  { id: 2, label: '核保规则', icon: Shield },
  { id: 3, label: '可售州', icon: Globe },
  { id: 4, label: '合规文件', icon: BookOpen },
]

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        {label}
        {required && <span style={{ color: '#BA1A1A' }}>*</span>}
        {hint && <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}><Info size={11} style={{ color: '#C1C6D7' }} /></span>}
      </label>
      {children}
    </div>
  )
}

export default function ProductForm({ mode, productId, navigateTo }: Props) {
  const existing = products.find(p => p.id === productId)

  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  // Step 0 — 基本信息
  const [name, setName] = useState(existing?.name ?? '')
  const [code, setCode] = useState(existing?.code ?? '')
  const [insurerId, setInsurerId] = useState(existing?.insurerId ?? '')
  const [line, setLine] = useState(existing?.line ?? '')
  const [subLine, setSubLine] = useState(existing?.subLine ?? '')
  const [prodType, setProdType] = useState<'Individual' | 'Group' | 'Voluntary'>(existing?.type ?? 'Individual')
  const [description, setDescription] = useState('')
  const [coverages, setCoverages] = useState<string[]>(['责任险', '综合险', '碰撞险'])

  // Step 1 — 费率配置
  const [rateType, setRateType] = useState<'flat' | 'tiered' | 'usage'>('tiered')
  const [baseRate, setBaseRate] = useState('')
  const [minPremium, setMinPremium] = useState('')
  const [maxPremium, setMaxPremium] = useState('')
  const [rateFactors, setRateFactors] = useState<string[]>(['驾驶记录', '车型系数', '信用评分'])

  // Step 2 — 核保规则
  const [ageMin, setAgeMin] = useState('18')
  const [ageMax, setAgeMax] = useState('80')
  const [excludeDUI, setExcludeDUI] = useState(true)
  const [referHighValue, setReferHighValue] = useState(true)
  const [referThreshold, setReferThreshold] = useState('150000')

  // Step 3 — 可售州
  const [selectedStates, setSelectedStates] = useState<Set<string>>(
    new Set(existing?.states?.[0] === 'ALL' ? US_STATES : (existing?.states ?? []))
  )

  // Step 4 — 文件
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const toggleState = (s: string) => setSelectedStates(prev => {
    const n = new Set(prev)
    n.has(s) ? n.delete(s) : n.add(s)
    return n
  })

  const stepDone = (i: number) => {
    if (i === 0) return !!name && !!code && !!insurerId && !!line
    if (i === 1) return !!baseRate && !!minPremium && !!maxPremium
    if (i === 2) return !!ageMin && !!ageMax
    if (i === 3) return selectedStates.size > 0
    return true
  }

  const handleSubmit = () => {
    setSaved(true)
    setTimeout(() => navigateTo('product-list'), 1200)
  }

  const back = () => navigateTo(productId ? 'product-detail' : 'product-list', { productId })

  if (saved) return (
    <div style={{ maxWidth: 680, margin: '80px auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: '60px 40px' }}>
        <CheckCircle size={48} style={{ color: '#34C759', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>
          {mode === 'create' ? '产品创建成功' : '产品信息已更新'}
        </div>
        <p style={{ fontSize: 14, color: '#717786' }}>正在跳转至产品列表…</p>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost" onClick={back}><ArrowLeft size={15} /></button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
            {mode === 'create' ? '新增产品' : `编辑产品 — ${existing?.name ?? ''}`}
          </h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {mode === 'create' ? '填写产品信息，配置费率、核保规则与可售区域' : '修改产品配置，变更将记录至审计日志'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step nav */}
        <div className="card" style={{ padding: '18px 16px', position: 'sticky', top: 24 }}>
          {STEPS.map((s, i) => {
            const done = stepDone(i)
            const active = step === i
            return (
              <div
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                  background: active ? 'rgba(0,88,188,0.09)' : 'transparent',
                  transition: 'background 120ms',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done && !active ? 'rgba(52,199,89,0.12)' : active ? 'rgba(0,88,188,0.15)' : 'rgba(193,198,215,0.2)',
                }}>
                  {done && !active
                    ? <CheckCircle size={13} style={{ color: '#34C759' }} />
                    : <s.icon size={13} style={{ color: active ? '#0058BC' : '#717786' }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#0058BC' : '#414755' }}>{s.label}</div>
                  {done && !active && <div style={{ fontSize: 10.5, color: '#34C759' }}>已完成</div>}
                </div>
              </div>
            )
          })}
          <div style={{ marginTop: 16, padding: '0 4px' }}>
            <div style={{ height: 4, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(STEPS.filter((_, i) => stepDone(i)).length / STEPS.length) * 100}%`, background: '#34C759', borderRadius: 3, transition: 'width 300ms' }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#717786', marginTop: 6, textAlign: 'center' }}>
              {STEPS.filter((_, i) => stepDone(i)).length} / {STEPS.length} 步完成
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="card" style={{ padding: '28px 32px' }}>
          {/* ── Step 0: 基本信息 ── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 24 }}>产品基本信息</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <Field label="产品全称" required>
                  <input className="input-glass w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Travelers Auto Insurance" style={{ fontSize: 13.5 }} />
                </Field>
                <Field label="产品代码" required hint="格式：承保方-业务线-序号（如 TRV-AUTO-001）">
                  <input className="input-glass w-full" value={code} onChange={e => setCode(e.target.value)} placeholder="TRV-AUTO-001" style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                </Field>
                <Field label="承保保险公司" required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={insurerId} onChange={e => setInsurerId(e.target.value)}>
                    <option value="">选择保险公司</option>
                    {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName} — {i.name}</option>)}
                  </select>
                </Field>
                <Field label="产品类型" required>
                  <div className="flex gap-2">
                    {(['Individual', 'Group', 'Voluntary'] as const).map(t => (
                      <label key={t} style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                        background: prodType === t ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                        border: `0.5px solid ${prodType === t ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                      }}>
                        <input type="radio" name="prodType" checked={prodType === t} onChange={() => setProdType(t)} style={{ accentColor: '#0058BC' }} />
                        <span style={{ fontSize: 12.5 }}>{t === 'Individual' ? '个人险' : t === 'Group' ? '团体险' : '自愿福利险'}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="业务线" required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={line} onChange={e => { setLine(e.target.value); setSubLine('') }}>
                    <option value="">选择业务线</option>
                    {LINES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="业务子线" required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={subLine} onChange={e => setSubLine(e.target.value)} disabled={!line}>
                    <option value="">选择业务子线</option>
                    {(SUB_LINES[line] ?? []).map(sl => <option key={sl} value={sl}>{sl}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="产品描述">
                <textarea className="input-glass w-full" style={{ minHeight: 88, resize: 'vertical', fontSize: 13.5 }}
                  placeholder="描述产品的核心价值、目标客群和主要特点…"
                  value={description} onChange={e => setDescription(e.target.value)} />
              </Field>
              <Field label="主要承保范围" hint="选择本产品包含的承保类别">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['责任险', '综合险', '碰撞险', '医疗赔付', '未保险驾驶员', '道路救援', '车辆替代', '新车价值保障', '自付额豁免'].map(c => (
                    <label key={c} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      background: coverages.includes(c) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                      border: `0.5px solid ${coverages.includes(c) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      color: coverages.includes(c) ? '#0058BC' : '#414755',
                    }}>
                      <input type="checkbox" checked={coverages.includes(c)}
                        onChange={() => setCoverages(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                        style={{ display: 'none' }} />
                      {coverages.includes(c) && <CheckCircle size={11} />}
                      {c}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 1: 费率配置 ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 24 }}>费率结构配置</div>
              <Field label="费率类型" required>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { val: 'flat', label: '固定费率', desc: '统一基础费率' },
                    { val: 'tiered', label: '分级费率', desc: '按风险等级分层' },
                    { val: 'usage', label: '按用量计费', desc: 'Usage-Based / Telematics' },
                  ].map(t => (
                    <label key={t.val} style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: rateType === t.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${rateType === t.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                    }}>
                      <input type="radio" name="rateType" checked={rateType === t.val} onChange={() => setRateType(t.val as any)} style={{ display: 'none' }} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: rateType === t.val ? '#0058BC' : '#181C23' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 3 }}>{t.desc}</div>
                    </label>
                  ))}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
                <Field label="基础费率（年）" required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={baseRate} onChange={e => setBaseRate(e.target.value)}
                      placeholder="1,200" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
                <Field label="最低保费" required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={minPremium} onChange={e => setMinPremium(e.target.value)}
                      placeholder="480" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
                <Field label="最高保费" required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={maxPremium} onChange={e => setMaxPremium(e.target.value)}
                      placeholder="4,200" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
              </div>
              <Field label="费率影响因子" hint="选择影响最终保费计算的关键变量">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['驾驶记录', '车型系数', '驾龄', '信用评分', '地区系数', '用途系数', '年龄段', '出险历史', '车辆价值', '安全设备'].map(f => (
                    <label key={f} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      background: rateFactors.includes(f) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                      border: `0.5px solid ${rateFactors.includes(f) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      color: rateFactors.includes(f) ? '#0058BC' : '#414755',
                    }}>
                      <input type="checkbox" checked={rateFactors.includes(f)}
                        onChange={() => setRateFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                        style={{ display: 'none' }} />
                      {rateFactors.includes(f) && <CheckCircle size={11} />}
                      {f}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 2: 核保规则 ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 6 }}>核保规则配置</div>
              <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>设定基本的资格规则和自动化决策逻辑，高级规则可在产品上架后进一步配置。</p>

              <div style={{ background: 'rgba(255,149,0,0.06)', border: '0.5px solid rgba(255,149,0,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 22 }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>核保规则说明</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#7a5c00' }}>此处配置的规则将在渠道提交报价时自动执行。规则生效前请与承保团队确认。</p>
              </div>

              <Field label="投保人年龄要求">
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: '#414755' }}>最小年龄</span>
                    <input className="input-glass" value={ageMin} onChange={e => setAgeMin(e.target.value)}
                      style={{ width: 80, textAlign: 'center', fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                    <span style={{ fontSize: 13, color: '#717786' }}>岁</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: '#414755' }}>最大年龄</span>
                    <input className="input-glass" value={ageMax} onChange={e => setAgeMax(e.target.value)}
                      style={{ width: 80, textAlign: 'center', fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                    <span style={{ fontSize: 13, color: '#717786' }}>岁</span>
                  </div>
                </div>
              </Field>

              <Field label="自动核保规则">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: excludeDUI ? 'rgba(186,26,26,0.05)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${excludeDUI ? 'rgba(186,26,26,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                    <input type="checkbox" checked={excludeDUI} onChange={e => setExcludeDUI(e.target.checked)} style={{ accentColor: '#BA1A1A', marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>DUI 记录拒保 <span style={{ color: '#BA1A1A', fontSize: 12 }}>（排除规则）</span></div>
                      <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>过去 5 年内有 DUI/DWI 记录的申请人自动拒保</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: referHighValue ? 'rgba(255,149,0,0.05)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${referHighValue ? 'rgba(255,149,0,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                    <input type="checkbox" checked={referHighValue} onChange={e => setReferHighValue(e.target.checked)} style={{ accentColor: '#FF9500', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>高价值标的转人工核保 <span style={{ color: '#a05800', fontSize: 12 }}>（转介规则）</span></div>
                      <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>标的价值超过阈值时，转专业核保团队审核</div>
                      {referHighValue && (
                        <div className="flex items-center gap-3 mt-8" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 13, color: '#414755' }}>转介阈值</span>
                          <div className="relative">
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                            <input className="input-glass" value={referThreshold} onChange={e => setReferThreshold(e.target.value)}
                              style={{ paddingLeft: 22, width: 120, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3: 可售州 ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>可售州配置</div>
              <div className="flex items-center justify-between mb-16" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#717786' }}>
                  已选 <strong style={{ color: '#0058BC' }}>{selectedStates.size}</strong> 个州 / 50 州
                </p>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setSelectedStates(new Set(US_STATES))}>全选</button>
                  <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setSelectedStates(new Set())}>清空</button>
                  {/* Common presets */}
                  {[
                    { label: '东北', states: ['NY', 'NJ', 'CT', 'MA', 'PA', 'VT', 'NH', 'ME', 'RI'] },
                    { label: '加州+德州', states: ['CA', 'TX'] },
                  ].map(p => (
                    <button key={p.label} className="btn-ghost" style={{ fontSize: 12.5 }}
                      onClick={() => setSelectedStates(new Set([...selectedStates, ...p.states]))}>
                      +{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 7 }}>
                {US_STATES.map(s => (
                  <div
                    key={s}
                    onClick={() => toggleState(s)}
                    style={{
                      padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      background: selectedStates.has(s) ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.5)',
                      border: `0.5px solid ${selectedStates.has(s) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      transition: 'all 100ms',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: selectedStates.has(s) ? '#0058BC' : '#717786' }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: 合规文件 ── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>合规文件上传</div>
              <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>上传产品上架所需的合规文件，带 * 为必传材料。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { type: '产品备案表', required: true, hint: '各州监管机构要求的产品备案文件', accept: '.pdf' },
                  { type: '费率文件', required: true, hint: '费率测算模型及备案费率表', accept: '.pdf,.xlsx' },
                  { type: '产品指南', required: true, hint: '渠道销售用产品说明手册', accept: '.pdf' },
                  { type: '核保规则手册', required: false, hint: '详细核保规则和操作指引', accept: '.pdf' },
                  { type: '培训课件', required: false, hint: '渠道培训演示文稿', accept: '.pdf,.pptx' },
                ].map(doc => {
                  const uploaded = uploadedFiles.includes(doc.type)
                  return (
                    <div key={doc.type} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                      background: uploaded ? 'rgba(52,199,89,0.06)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${uploaded ? 'rgba(52,199,89,0.25)' : 'rgba(193,198,215,0.4)'}`,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.12)' : 'rgba(241,243,254,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploaded ? <CheckCircle size={16} style={{ color: '#34C759' }} /> : <FileText size={16} style={{ color: '#717786' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>
                          {doc.type} {doc.required && <span style={{ color: '#BA1A1A' }}>*</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{doc.hint} · 支持 {doc.accept}</div>
                        {uploaded && <div style={{ fontSize: 12, color: '#34C759', marginTop: 2 }}>{doc.type}-v1.0.pdf — 刚刚上传</div>}
                      </div>
                      {uploaded
                        ? <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setUploadedFiles(f => f.filter(x => x !== doc.type))}>
                            <X size={13} />移除
                          </button>
                        : <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={() => setUploadedFiles(f => [...f, doc.type])}>
                            <Upload size={13} />上传
                          </button>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-28" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : back()}>
              <ArrowLeft size={14} /> {step === 0 ? '取消' : '上一步'}
            </button>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ fontSize: 13 }}>保存草稿</button>
              {step < STEPS.length - 1
                ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={!stepDone(step)}>
                    下一步 <ChevronRight size={14} />
                  </button>
                : <button className="btn-primary" style={{ fontSize: 13, background: '#1a7a2e' }} onClick={handleSubmit}>
                    <CheckCircle size={14} /> {mode === 'create' ? '提交上架申请' : '保存更改'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
