// AddRatePlanModal —— 产品详情 · 费率方案 Tab 的「新增 / 编辑费率方案」弹窗（问题11 + 遗留项）
// tier / status 均限定为 ProductDetail 已能渲染的枚举值（rpStatusLabels），
// 后端 CreateRatePlanDto / UpdateRatePlanDto 也做同样的 @IsIn 校验，双层保证不会生成无法显示的方案卡片。
// 本系统没有审批流程，所以这里既没有「待审批(pending)」状态选项，也没有监管备案(filingStatus)下拉。
// rating_factors 是 jsonb，weight 在库里以小数存储（详情页按 weight * 100 展示），
// 所以表单里输入百分数、提交前除以 100；编辑模式回填时反向乘回 100。
// 传入 editing 即进入编辑模式，onSubmit 的负载作为 PATCH 体（UpdateRatePlanPayload = Partial<Create…>），
// 本组件始终提交全量字段，所以两种模式共用同一个 onSubmit 签名。

import { useState } from 'react'
import { X, BarChart2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CreateRatePlanPayload, ProductRatePlan, RatingFactorKey } from '@/lib/user-api-client'

interface Props {
  isSubmitting: boolean
  /** 非 null 即编辑该费率方案；缺省为新增模式。 */
  editing?: ProductRatePlan | null
  onClose: () => void
  onSubmit: (dto: CreateRatePlanPayload) => void
}

const TIERS: ProductRatePlan['tier'][] = ['Standard', 'Enhanced', 'Premium', 'Basic']
const STATUSES: ProductRatePlan['status'][] = ['active', 'draft', 'expired']

// 可选因子与详情页 factorLabels 保持同一套 i18n 键，避免下拉里出现未翻译的裸 key
const FACTOR_LABEL_KEYS: Record<RatingFactorKey, string> = {
  drivingRecord: 'detail.rates.facDrivingRecord',
  vehicleType: 'detail.rates.facVehicleType',
  drivingExperience: 'detail.rates.facDrivingExp',
  creditScore: 'detail.rates.facCredit',
  territory: 'detail.rates.facTerritory',
  usage: 'detail.rates.facUsage',
  homeRebuildCost: 'detail.rates.facHomeRebuildCost',
  securityFeatures: 'detail.rates.facSecurityFeatures',
  naturalRisk: 'detail.rates.facNatRisk',
  lossHistory: 'detail.rates.facLossHistory',
  annualRevenue: 'detail.rates.facAnnualRevenue',
  industryRisk: 'detail.rates.facIndustryRisk',
  securityPosture: 'detail.rates.facSecurityPosture',
  incidentHistory: 'detail.rates.facIncidentHistory',
  employeeCount: 'detail.rates.facEmployeeCount',
  supplyChain: 'detail.rates.facSupplyChain',
}
const FACTOR_KEYS = Object.keys(FACTOR_LABEL_KEYS) as RatingFactorKey[]

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', fontSize: 13,
  border: '0.5px solid rgba(193,198,215,0.6)', borderRadius: 10,
  background: 'rgba(255,255,255,0.85)', color: '#181C23', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6, display: 'block',
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#BA1A1A', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

/** yyyy-mm-dd（本地时区），用作生效日默认值 */
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** 失效日默认给一年期，避免详情页「有效期：～ 」出现空白 */
const plusOneYear = () => {
  const d = new Date()
  return `${d.getFullYear() + 1}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 库里可能存着不在枚举内的旧值（历史种子数据）；预填前先校验，否则 <select> 会展示空白。 */
function pickEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (typeof v === 'string' && (allowed as readonly string[]).includes(v)) ? (v as T) : fallback
}

/** 库里的小数权重 → 表单百分数字符串。乘 1000 再除 10 是为了避开 0.155 * 100 的浮点噪声。 */
function weightToPct(w: unknown): string {
  const n = typeof w === 'number' ? w : Number(w)
  return Number.isFinite(n) ? String(Math.round(n * 1000) / 10) : ''
}

/** NULL 保费在 mapRatePlan 里被 num() 归零，回填时把 0 当作「未设置」留空，避免弹窗里出现无意义的 0。 */
function premiumToStr(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? String(n) : ''
}

interface FactorRow {
  factor: RatingFactorKey
  weightPct: string
  description: string
  descriptionEn: string
}

export default function AddRatePlanModal({ isSubmitting, editing, onClose, onSubmit }: Props) {
  const { t } = useTranslation('product')
  const isEdit = !!editing

  const [name, setName] = useState(editing?.name ?? '')
  const [tier, setTier] = useState<ProductRatePlan['tier']>(pickEnum(editing?.tier, TIERS, 'Standard'))
  const [baseRate, setBaseRate] = useState(editing ? String(editing.baseRate ?? '') : '')
  const [minPremium, setMinPremium] = useState(premiumToStr(editing?.minPremium))
  const [maxPremium, setMaxPremium] = useState(premiumToStr(editing?.maxPremium))
  // 编辑时沿用记录里的有效期（可能为 null → 留空）；新增才给「今天起一年」的默认值
  const [effectiveDate, setEffectiveDate] = useState(editing ? (editing.effectiveDate ?? '') : today())
  const [expiryDate, setExpiryDate] = useState(editing ? (editing.expiryDate ?? '') : plusOneYear())
  const [status, setStatus] = useState<ProductRatePlan['status']>(pickEnum(editing?.status, STATUSES, 'active'))
  const [factors, setFactors] = useState<FactorRow[]>(
    Array.isArray(editing?.ratingFactors)
      ? editing!.ratingFactors.map(f => ({
          // 未知因子键原样保留（见下方 select 的兜底 option），否则保存一次就会静默丢掉这条数据
          factor: f?.factor as RatingFactorKey,
          weightPct: weightToPct(f?.weight),
          description: f?.description ?? '',
          descriptionEn: f?.descriptionEn ?? '',
        }))
      : [],
  )
  const [error, setError] = useState<string | null>(null)

  // 标题/提交文案按模式切换；字段标签与校验文案两种模式含义完全一致，沿用 modals.addRatePlan.* 不重复维护一份
  const TK = isEdit ? 'modals.editRatePlan' : 'modals.addRatePlan'

  // 数字输入框是受控字符串，空串必须转成 undefined（不能是 0，否则详情页会显示 $0）
  const numOrUndef = (v: string): number | undefined => {
    if (!v.trim()) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  const totalWeight = factors.reduce((sum, f) => sum + (Number(f.weightPct) || 0), 0)

  const updateFactor = (idx: number, patch: Partial<FactorRow>) => {
    setFactors(prev => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const addFactor = () => {
    // 默认选中第一个尚未使用的因子，减少重复选择
    const used = new Set(factors.map(f => f.factor))
    const next = FACTOR_KEYS.find(k => !used.has(k)) ?? FACTOR_KEYS[0]
    setFactors(prev => [...prev, { factor: next, weightPct: '', description: '', descriptionEn: '' }])
  }

  const handleSubmit = () => {
    if (!name.trim()) { setError(t('modals.addRatePlan.nameRequired')); return }
    const rate = numOrUndef(baseRate)
    if (rate === undefined) { setError(t('modals.addRatePlan.baseRateRequired')); return }
    const min = numOrUndef(minPremium)
    const max = numOrUndef(maxPremium)
    if (min !== undefined && max !== undefined && min > max) {
      setError(t('modals.addRatePlan.premiumRangeInvalid'))
      return
    }
    if (effectiveDate && expiryDate && expiryDate < effectiveDate) {
      setError(t('modals.addRatePlan.dateRangeInvalid'))
      return
    }
    setError(null)
    onSubmit({
      name: name.trim(),
      tier,
      baseRate: rate,
      minPremium: min,
      maxPremium: max,
      effectiveDate: effectiveDate || undefined,
      expiryDate: expiryDate || undefined,
      status,
      // 只提交填了权重的因子；weight 以小数入库，description 兜底为因子标签，避免详情页出现空说明
      ratingFactors: factors
        .filter(f => f.weightPct.trim() !== '')
        .map(f => ({
          factor: f.factor,
          weight: (Number(f.weightPct) || 0) / 100,
          description: f.description.trim() || t(FACTOR_LABEL_KEYS[f.factor] ?? '', f.factor),
          descriptionEn: f.descriptionEn.trim() || f.factor,
        })),
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
    >
      <div className="glass-strong" style={{ width: 660, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BarChart2 size={17} style={{ color: '#0058BC' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>{t(`${TK}.title`)}</div>
            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{t(`${TK}.subtitle`)}</div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={18} style={{ color: '#717786' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '66vh', overflowY: 'auto' }}>
          <Row label={t('modals.addRatePlan.name')} required>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={t('modals.addRatePlan.namePlaceholder')} />
          </Row>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRatePlan.tier')} required>
              <select style={inputStyle} value={tier} onChange={e => setTier(e.target.value as ProductRatePlan['tier'])}>
                {TIERS.map(v => <option key={v} value={v}>{t(`modals.addRatePlan.tiers.${v}`)}</option>)}
              </select>
            </Row>
            <Row label={t('modals.addRatePlan.status')}>
              <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as ProductRatePlan['status'])}>
                {STATUSES.map(v => <option key={v} value={v}>{t(`detail.rates.${v}`)}</option>)}
              </select>
            </Row>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Row label={t('detail.rates.baseRate')} required>
              <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} type="number" min={0} step="0.01"
                value={baseRate} onChange={e => setBaseRate(e.target.value)} placeholder="0.00" />
            </Row>
            <Row label={t('detail.rates.minPremium')}>
              <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} type="number" min={0} step="1"
                value={minPremium} onChange={e => setMinPremium(e.target.value)} placeholder="0" />
            </Row>
            <Row label={t('detail.rates.maxPremium')}>
              <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} type="number" min={0} step="1"
                value={maxPremium} onChange={e => setMaxPremium(e.target.value)} placeholder="0" />
            </Row>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRatePlan.effectiveDate')}>
              <input style={inputStyle} type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
            </Row>
            <Row label={t('modals.addRatePlan.expiryDate')}>
              <input style={inputStyle} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </Row>
          </div>

          {/* Rating factors */}
          <div style={{ marginTop: 4, marginBottom: 14 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t('modals.addRatePlan.ratingFactors')}</label>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={addFactor} type="button">
                <Plus size={12} />{t('modals.addRatePlan.addFactor')}
              </button>
            </div>
            {factors.length === 0 ? (
              <div style={{ fontSize: 12, color: '#717786', padding: '10px 12px', background: 'rgba(241,243,254,0.6)', borderRadius: 9 }}>
                {t('modals.addRatePlan.noFactor')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {factors.map((f, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 68px 1fr 1fr 30px', gap: 8, alignItems: 'center' }}>
                    <select style={{ ...inputStyle, height: 36 }} value={f.factor}
                      onChange={e => updateFactor(idx, { factor: e.target.value as RatingFactorKey })}>
                      {/* 库里存了未知因子键时补一个兜底 option，否则 select 会显示空白且保存后丢数据 */}
                      {!FACTOR_KEYS.includes(f.factor) && f.factor && (
                        <option value={f.factor}>{f.factor}</option>
                      )}
                      {FACTOR_KEYS.map(k => <option key={k} value={k}>{t(FACTOR_LABEL_KEYS[k])}</option>)}
                    </select>
                    <input style={{ ...inputStyle, height: 36, padding: '0 8px', fontFamily: "'JetBrains Mono', monospace" }}
                      type="number" min={0} max={100} step="1" value={f.weightPct} placeholder="%"
                      onChange={e => updateFactor(idx, { weightPct: e.target.value })} />
                    <input style={{ ...inputStyle, height: 36 }} value={f.description}
                      placeholder={t('modals.addRatePlan.factorDesc')}
                      onChange={e => updateFactor(idx, { description: e.target.value })} />
                    <input style={{ ...inputStyle, height: 36 }} value={f.descriptionEn}
                      placeholder={t('modals.addRatePlan.factorDescEn')}
                      onChange={e => updateFactor(idx, { descriptionEn: e.target.value })} />
                    <button
                      type="button" onClick={() => setFactors(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={t('actions.delete')}
                    >
                      <Trash2 size={13} style={{ color: '#BA1A1A' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {factors.length > 0 && Math.round(totalWeight) !== 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11.5, color: '#a05800' }}>
                <AlertCircle size={11} />{t('modals.addRatePlan.weightSumWarn', { sum: Math.round(totalWeight) })}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)', fontSize: 12.5, color: '#BA1A1A' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </button>
          <button className="btn-primary" style={{ fontSize: 13, opacity: isSubmitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t(`${TK}.submitting`) : t(`${TK}.submit`)}
          </button>
        </div>
      </div>
    </div>
  )
}
