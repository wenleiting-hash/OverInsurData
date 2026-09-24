import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, MapPin, Star,
  DollarSign, FileText, X, AlertCircle, Info, Plus, Trash2,
} from 'lucide-react'
import { insurers } from '../data/mockData'
import { US_STATES, AM_BEST_RATINGS, SP_RATINGS } from '../data/insurerDetails'
import type { ViewId } from '../components/Sidebar'

interface Props {
  mode: 'create' | 'edit'
  insurerId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const STEPS = [
  { id: 'basic', label: '基本信息', icon: Building2, desc: '公司名称、简称、NAIC、官网' },
  { id: 'regulatory', label: '监管信息', icon: MapPin, desc: '公司类型、总部、大区' },
  { id: 'ratings', label: '财务评级', icon: Star, desc: 'AM Best、S&P、Moody\'s、Fitch' },
  { id: 'settlement', label: '结算配置', icon: DollarSign, desc: '结算周期、账单格式、账户' },
  { id: 'documents', label: '资质文件', icon: FileText, desc: '营业执照、合规文件、合同' },
]

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West']
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'P&C', 'Cyber', 'Specialty', 'D&O', 'E&O', 'E&S', 'Marine', 'Workers Comp']
const COOP_TYPES = ['直接代理', 'MGA（Managing General Agent）', '批发经纪', '推荐合作', '聚合平台合作']

const INPUT = { className: 'input-glass w-full', style: { fontSize: 13.5 } }

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

export default function InsurerForm({ mode, insurerId, navigateTo }: Props) {
  const existing = insurerId ? insurers.find(i => i.id === insurerId) : undefined
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    shortName: existing?.shortName ?? '',
    naicCode: existing?.naicCode ?? '',
    website: existing?.website ?? '',
    founded: existing?.founded?.toString() ?? '',
    type: existing?.type ?? 'Admitted',
    coopType: '直接代理',
    state: existing?.state ?? '',
    region: existing?.region ?? 'Northeast',
    lines: existing?.lines ?? [] as string[],
    amBest: existing?.amBestRating ?? '',
    amBestDate: '2026-07-15',
    sp: existing?.spRating ?? '',
    spDate: '2026-01-10',
    moodys: 'Aa3',
    moodysDate: '2025-12-01',
    fitch: 'A+',
    fitchDate: '2025-11-15',
    settlementCycle: existing?.settlementCycle ?? '',
    billingFormat: existing ? 'API' : '',
    billCutoffDay: '25',
    paymentDays: '30',
    currency: 'USD',
    premiumCollection: 'aggregate',
    uploadedFiles: [] as { name: string; type: string; size: string }[],
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const toggleLine = (line: string) => {
    set('lines', form.lines.includes(line) ? form.lines.filter(l => l !== line) : [...form.lines, line])
  }

  const completedSteps = STEPS.map((_, i) => {
    if (i === 0) return form.name && form.shortName && form.naicCode
    if (i === 1) return form.type && form.state && form.region
    if (i === 2) return form.amBest
    if (i === 3) return !!(form.settlementCycle && form.billingFormat)
    if (i === 4) return form.uploadedFiles.length > 0
    return false
  })

  const handleSaveDraft = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const handleSubmit = () => { navigateTo('insurer-list') }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigateTo(insurerId ? 'insurer-detail' : 'insurer-list', { insurerId })}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
              {mode === 'create' ? '新增保险公司' : `编辑 · ${existing?.shortName ?? ''}`}
            </h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
              {mode === 'create' ? '填写完整信息后提交审核，审核通过后完成入驻' : '修改字段后保存，变更将记录至审计日志'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={handleSaveDraft}>
            {saved ? <><Check size={14} />已保存</> : <><Save size={14} />保存草稿</>}
          </button>
          {step === STEPS.length - 1 && (
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
              <Send size={14} />{mode === 'create' ? '提交审核' : '保存修改'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step nav */}
        <div className="card" style={{ padding: '16px 12px', position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingLeft: 8 }}>
            填写步骤
          </div>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === i
            const isDone = completedSteps[i]
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(0,88,188,0.10)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 2,
                  transition: 'background 130ms',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isActive ? '#0058BC' : isDone ? 'rgba(52,199,89,0.12)' : 'rgba(193,198,215,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone && !isActive
                    ? <Check size={13} style={{ color: '#34C759' }} />
                    : <Icon size={13} style={{ color: isActive ? '#fff' : '#717786' }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0058BC' : '#181C23' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#717786', lineHeight: 1.3, marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}

        </div>

        {/* Form content */}
        <div className="card" style={{ padding: '28px 32px' }}>

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <>
              <Section title="公司基本信息">
                <Grid>
                  <div>
                    <FieldLabel label="公司全称" required hint="英文官方全称" />
                    <input {...INPUT} placeholder="e.g. Travelers Insurance Company" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="公司简称" required />
                    <input {...INPUT} placeholder="e.g. Travelers" value={form.shortName} onChange={e => set('shortName', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="NAIC 编码" required hint="National Association of Insurance Commissioners 编码" />
                    <input {...INPUT} placeholder="e.g. 25658" value={form.naicCode} onChange={e => set('naicCode', e.target.value)}
                      style={{ ...INPUT.style, fontFamily: "'JetBrains Mono', monospace" }} />
                    {form.naicCode && !/^\d{5}$/.test(form.naicCode) && (
                      <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} />NAIC 编码应为 5 位数字
                      </div>
                    )}
                  </div>
                  <div>
                    <FieldLabel label="成立年份" />
                    <input {...INPUT} type="number" placeholder="e.g. 1853" value={form.founded} onChange={e => set('founded', e.target.value)} min={1800} max={2026} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel label="官方网站" />
                    <input {...INPUT} placeholder="e.g. www.travelers.com" value={form.website} onChange={e => set('website', e.target.value)} />
                  </div>
                </Grid>
              </Section>

              <Section title="业务线">
                <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 10 }}>选择主营业务线（可多选）</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {LINES_OF_BUSINESS.map(line => (
                    <button
                      key={line}
                      onClick={() => toggleLine(line)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: form.lines.includes(line) ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.8)',
                        background: form.lines.includes(line) ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.7)',
                        color: form.lines.includes(line) ? '#0058BC' : '#414755',
                        transition: 'all 120ms',
                      }}
                    >
                      {form.lines.includes(line) && <Check size={11} style={{ display: 'inline', marginRight: 5 }} />}
                      {line}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Step 1: Regulatory */}
          {step === 1 && (
            <>
              <Section title="监管信息">
                <Grid>
                  <div>
                    <FieldLabel label="公司类型" required />
                    <select {...INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="Admitted">Admitted（已获批准入）</option>
                      <option value="Non-Admitted">Non-Admitted（未获批准入）</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="合作类型" required />
                    <select {...INPUT} value={form.coopType} onChange={e => set('coopType', e.target.value)}>
                      {COOP_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </Grid>
                {form.type === 'Non-Admitted' && (
                  <div style={{ marginTop: 12, background: 'rgba(0,102,135,0.07)', border: '0.5px solid rgba(0,102,135,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#006687' }}>
                    <Info size={13} style={{ display: 'inline', marginRight: 6 }} />
                    Non-Admitted 公司需额外确认各州的 Surplus Lines 合规要求
                  </div>
                )}
              </Section>

              <Section title="总部信息">
                <Grid cols={3}>
                  <div>
                    <FieldLabel label="总部所在州" required />
                    <select {...INPUT} value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">选择州</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="大区" required />
                    <select {...INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="城市" />
                    <input {...INPUT} placeholder="e.g. New York" />
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 2: Ratings */}
          {step === 2 && (
            <Section title="财务评级信息">
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 18 }}>
                请录入各评级机构的当前评级及评级日期。至少填写 AM Best 评级。
              </div>
              {[
                { agency: 'AM Best', key: 'amBest', dateKey: 'amBestDate', ratings: AM_BEST_RATINGS, required: true },
                { agency: 'Standard & Poors (S&P)', key: 'sp', dateKey: 'spDate', ratings: SP_RATINGS },
                { agency: "Moody's", key: 'moodys', dateKey: 'moodysDate', ratings: ['Aaa','Aa1','Aa2','Aa3','A1','A2','A3','Baa1','Baa2','NR'] },
                { agency: 'Fitch', key: 'fitch', dateKey: 'fitchDate', ratings: SP_RATINGS },
              ].map(r => (
                <div key={r.agency} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)', alignItems: 'center' }}>
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.agency}</div>
                    {r.required && <span style={{ fontSize: 11, color: '#BA1A1A' }}>必填</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label="评级" />
                    <select
                      className="input-glass"
                      style={{ fontSize: 13.5, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                      value={(form as any)[r.key]}
                      onChange={e => set(r.key, e.target.value)}
                    >
                      <option value="">— 未评级 —</option>
                      {r.ratings.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label="评级日期" />
                    <input type="date" className="input-glass" style={{ fontSize: 13, width: '100%' }}
                      value={(form as any)[r.dateKey]}
                      onChange={e => set(r.dateKey, e.target.value)} />
                  </div>
                  {(form as any)[r.key] && (
                    <div style={{
                      fontSize: 28, fontWeight: 800, color: (form as any)[r.key]?.startsWith('A') ? '#1a7a2e' : '#a05800',
                      fontFamily: "'JetBrains Mono', monospace",
                      width: 64, textAlign: 'center', flexShrink: 0,
                    }}>
                      {(form as any)[r.key]}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Step 3: Settlement */}
          {step === 3 && (
            <>
              <Section title="佣金结算配置">
                <Grid>
                  <div>
                    <FieldLabel label="结算周期" required />
                    <select {...INPUT} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                      <option value="" disabled>请选择</option>
                      <option value="Monthly">月度结算（每月）</option>
                      <option value="Quarterly">季度结算（每季）</option>
                      <option value="SemiAnnual">半年度结算</option>
                      <option value="Annual">年度结算</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="账单格式" required />
                    <select {...INPUT} value={form.billingFormat} onChange={e => set('billingFormat', e.target.value)}>
                      <option value="" disabled>请选择</option>
                      <option value="API" disabled style={{ color: '#A0A5B1' }}>API 自动拉取（待开放）</option>
                      <option value="CSV">CSV 文件</option>
                      <option value="Excel">Excel 文件</option>
                      <option value="EDI" disabled style={{ color: '#A0A5B1' }}>EDI 835（待开放）</option>
                      <option value="Manual">人工录入</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="账单截止日" hint="每月/季第几天为数据截止日" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>每月第</span>
                      <input {...INPUT} type="number" value={form.billCutoffDay} onChange={e => set('billCutoffDay', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={28} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>天</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="付款期限" hint="对账完成后多少天内支付" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>对账后</span>
                      <input {...INPUT} type="number" value={form.paymentDays} onChange={e => set('paymentDays', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={90} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>天内</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="结算货币" />
                    <select {...INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="USD">USD（美元）</option>
                      <option value="CAD">CAD（加拿大元）</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="保费归集方式" />
                    <select {...INPUT} value={form.premiumCollection} onChange={e => set('premiumCollection', e.target.value)}>
                      <option value="aggregate">渠道代收 → 平台归集 → 转付保险公司</option>
                      <option value="direct">渠道直接支付保险公司</option>
                      <option value="platform">平台代收后统一结算</option>
                    </select>
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <Section title="资质文件上传">
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>
                请上传保险公司相关资质文件。合同类文件提交后将进入法务审核流程。
              </div>

              {/* Required doc list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { type: '营业执照', required: true },
                  { type: '主合作协议', required: true },
                  { type: '保密协议 (NDA)', required: true },
                  { type: '数据处理协议 (DPA)', required: false },
                  { type: 'AM Best 评级报告', required: false },
                ].map(doc => {
                  const uploaded = form.uploadedFiles.find(f => f.type === doc.type)
                  return (
                    <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.4)', borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.10)' : 'rgba(193,198,215,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} style={{ color: uploaded ? '#34C759' : '#717786' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>
                          {doc.type}
                          {doc.required && <span style={{ fontSize: 11, color: '#BA1A1A', marginLeft: 6 }}>必须</span>}
                        </div>
                        {uploaded
                          ? <div style={{ fontSize: 11.5, color: '#1a7a2e', marginTop: 2 }}>{uploaded.name} · {uploaded.size}</div>
                          : <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>未上传</div>
                        }
                      </div>
                      {uploaded
                        ? <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} onClick={() => set('uploadedFiles', form.uploadedFiles.filter(f => f.type !== doc.type))}><X size={14} /></button>
                        : <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => {
                            const fake = { name: `${doc.type}_${Date.now()}.pdf`, type: doc.type, size: '1.2 MB' }
                            set('uploadedFiles', [...form.uploadedFiles, fake])
                          }}>上传</button>
                      }
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
            <button
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
              style={{ fontSize: 13, opacity: step === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14} />上一步
            </button>
            <div style={{ fontSize: 12.5, color: '#717786' }}>步骤 {step + 1} / {STEPS.length}</div>
            {step < STEPS.length - 1
              ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)}>
                  下一步 <ArrowRight size={14} />
                </button>
              : <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
                  <Send size={14} />{mode === 'create' ? '提交审核' : '保存修改'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
