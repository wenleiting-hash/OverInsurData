// AddUnderwritingRuleModal —— 产品详情 · 核保规则 Tab 的「新增 / 编辑规则」弹窗
// 分类 / 动作 / 状态均限定为 ProductDetail 已能渲染的枚举值（ruleCatLabels / RULE_ACTION_COLOR），
// 后端 DTO 也做同样的 @IsIn 校验，双层保证不会生成无法显示的规则卡片。
// 提交由父视图通过 React Query mutation 执行；成功后父视图 invalidate 规则列表并关闭弹窗。
// 传入 editing 即进入编辑模式：表单以现有值预填，标题与提交按钮切换为「编辑」文案。

import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CreateUnderwritingRulePayload, ProductUnderwritingRule } from '@/lib/user-api-client'

interface Props {
  /** Priority suggested for the new rule (current rule count + 1) so it lands at the end of the list. */
  nextPriority: number
  isSubmitting: boolean
  /** 非 null 即编辑该规则；undefined/null 为新增模式 */
  editing?: ProductUnderwritingRule | null
  onClose: () => void
  /** 编辑模式下 dto 作为 PATCH 负载（UpdateUnderwritingRulePayload = Partial<Create…>），全量字段直接兼容。 */
  onSubmit: (dto: CreateUnderwritingRulePayload) => void
}

const CATEGORIES: ProductUnderwritingRule['category'][] = ['eligibility', 'rating', 'exclusion', 'referral']
const ACTIONS: ProductUnderwritingRule['action'][] = ['approve', 'decline', 'refer', 'surcharge', 'discount']
const STATUSES: ProductUnderwritingRule['status'][] = ['active', 'testing', 'inactive']

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

export default function AddUnderwritingRuleModal({ nextPriority, isSubmitting, editing, onClose, onSubmit }: Props) {
  const { t } = useTranslation('product')
  const isEdit = !!editing

  // 枚举字段可能存着库里的旧值（不在枚举内），预填时先校验，否则 <select> 会展示空白
  const pickEnum = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    (typeof v === 'string' && (allowed as readonly string[]).includes(v)) ? (v as T) : fallback

  const [name, setName] = useState(editing?.name ?? '')
  const [nameEn, setNameEn] = useState(editing?.nameEn ?? '')
  const [category, setCategory] = useState<ProductUnderwritingRule['category']>(
    pickEnum(editing?.category, CATEGORIES, 'eligibility'))
  const [priority, setPriority] = useState(String(editing?.priority ?? nextPriority))
  const [condition, setCondition] = useState(editing?.condition ?? '')
  const [conditionEn, setConditionEn] = useState(editing?.conditionEn ?? '')
  const [conditionDetail, setConditionDetail] = useState(editing?.conditionDetail ?? '')
  const [conditionDetailEn, setConditionDetailEn] = useState(editing?.conditionDetailEn ?? '')
  const [action, setAction] = useState<ProductUnderwritingRule['action']>(
    pickEnum(editing?.action, ACTIONS, 'decline'))
  const [actionValue, setActionValue] = useState(editing?.actionValue ?? '')
  const [actionValueEn, setActionValueEn] = useState(editing?.actionValueEn ?? '')
  const [status, setStatus] = useState<ProductUnderwritingRule['status']>(
    pickEnum(editing?.status, STATUSES, 'active'))
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!name.trim()) { setError(t('modals.addRule.nameRequired')); return }
    if (!condition.trim()) { setError(t('modals.addRule.conditionRequired')); return }
    const parsedPriority = parseInt(priority, 10)
    setError(null)
    onSubmit({
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      category,
      priority: Number.isFinite(parsedPriority) ? parsedPriority : undefined,
      condition: condition.trim(),
      conditionEn: conditionEn.trim() || undefined,
      conditionDetail: conditionDetail.trim() || undefined,
      conditionDetailEn: conditionDetailEn.trim() || undefined,
      action,
      // actionValue is what the rule card shows after "THEN →"; fall back to the raw action when empty
      actionValue: actionValue.trim() || undefined,
      actionValueEn: actionValueEn.trim() || undefined,
      status,
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
    >
      <div className="glass-strong" style={{ width: 620, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={17} style={{ color: '#0058BC' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>{isEdit ? t('modals.editRule.title') : t('modals.addRule.title')}</div>
            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{isEdit ? t('modals.editRule.subtitle') : t('modals.addRule.subtitle')}</div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={18} style={{ color: '#717786' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '66vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRule.name')} required>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={t('modals.addRule.namePlaceholder')} />
            </Row>
            <Row label={t('modals.addRule.nameEn')}>
              <input style={inputStyle} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Decline applicants without a license" />
            </Row>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRule.category')} required>
              <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value as ProductUnderwritingRule['category'])}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t(`detail.underwriting.${c}`)}</option>)}
              </select>
            </Row>
            <Row label={t('modals.addRule.action')} required>
              <select style={inputStyle} value={action} onChange={e => setAction(e.target.value as ProductUnderwritingRule['action'])}>
                {ACTIONS.map(a => <option key={a} value={a}>{t(`modals.addRule.actions.${a}`)}</option>)}
              </select>
            </Row>
            <Row label={t('modals.addRule.priority')}>
              <input style={inputStyle} type="number" min={1} value={priority} onChange={e => setPriority(e.target.value)} />
            </Row>
          </div>

          <Row label={t('modals.addRule.condition')} required>
            <input
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              value={condition} onChange={e => setCondition(e.target.value)}
              placeholder={t('modals.addRule.conditionPlaceholder')}
            />
          </Row>
          <Row label={t('modals.addRule.conditionEn')}>
            <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} value={conditionEn} onChange={e => setConditionEn(e.target.value)} placeholder="IF applicant has no driver's license" />
          </Row>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRule.conditionDetail')}>
              <input style={inputStyle} value={conditionDetail} onChange={e => setConditionDetail(e.target.value)} />
            </Row>
            <Row label={t('modals.addRule.conditionDetailEn')}>
              <input style={inputStyle} value={conditionDetailEn} onChange={e => setConditionDetailEn(e.target.value)} />
            </Row>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.addRule.actionValue')}>
              <input style={inputStyle} value={actionValue} onChange={e => setActionValue(e.target.value)} placeholder={t('modals.addRule.actionValuePlaceholder')} />
            </Row>
            <Row label={t('modals.addRule.actionValueEn')}>
              <input style={inputStyle} value={actionValueEn} onChange={e => setActionValueEn(e.target.value)} />
            </Row>
          </div>

          <Row label={t('modals.addRule.status')}>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as ProductUnderwritingRule['status'])}>
              {STATUSES.map(s => <option key={s} value={s}>{t(`modals.addRule.statuses.${s}`)}</option>)}
            </select>
          </Row>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)', fontSize: 12.5, color: '#BA1A1A' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose} disabled={isSubmitting}>
            {t('modals.addRule.cancel')}
          </button>
          <button className="btn-primary" style={{ fontSize: 13, opacity: isSubmitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? (isEdit ? t('modals.editRule.submitting') : t('modals.addRule.submitting'))
              : (isEdit ? t('modals.editRule.submit') : t('modals.addRule.submit'))}
          </button>
        </div>
      </div>
    </div>
  )
}
