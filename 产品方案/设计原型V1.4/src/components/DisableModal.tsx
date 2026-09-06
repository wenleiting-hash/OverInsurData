import { useState } from 'react'
import { X, AlertTriangle, StopCircle, PlayCircle, AlertCircle } from 'lucide-react'
import { insurers } from '../data/mockData'

interface Props {
  insurerId: string
  onClose: () => void
  onConfirm: () => void
}

const DISABLE_REASONS = [
  '合作协议到期，不再续约',
  '保险公司合规问题',
  '业务线调整，退出该市场',
  '系统迁移或整合',
  '双方协商终止',
  '保险公司主动要求终止',
  '其他原因（请在备注中说明）',
]

const ENABLE_REASONS = [
  '合规问题已解决',
  '完成系统迁移，恢复合作',
  '新合同已签署',
  '管理层决策恢复合作',
  '其他原因',
]

export default function DisableModal({ insurerId, onClose, onConfirm }: Props) {
  const ins = insurers.find(i => i.id === insurerId) ?? insurers[0]
  const isDisabling = ins.status !== 'inactive'
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [effectDate, setEffectDate] = useState('immediate')
  const [futureDate, setFutureDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const reasons = isDisabling ? DISABLE_REASONS : ENABLE_REASONS

  const impactData = {
    products: ins.productCount,
    channels: ins.channelCount,
    activePolicies: 12847,
    pendingQuotes: 234,
    pendingCommission: 892450,
  }

  const canConfirm = reason && (effectDate === 'immediate' || futureDate) && confirmed

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(24,28,35,0.35)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-strong"
        style={{ width: 580, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDisabling ? 'rgba(186,26,26,0.05)' : 'rgba(52,199,89,0.05)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isDisabling ? 'rgba(186,26,26,0.10)' : 'rgba(52,199,89,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDisabling
                ? <StopCircle size={18} style={{ color: '#BA1A1A' }} />
                : <PlayCircle size={18} style={{ color: '#34C759' }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                {isDisabling ? '停用保险公司' : '启用保险公司'}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{ins.shortName} · NAIC {ins.naicCode}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '70vh', overflowY: 'auto' }}>

          {/* Impact preview — only for disabling */}
          {isDisabling && (
            <div style={{ background: 'rgba(255,149,0,0.07)', border: '0.5px solid rgba(255,149,0,0.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div className="flex items-center gap-2 mb-12" style={{ marginBottom: 12 }}>
                <AlertTriangle size={14} style={{ color: '#a05800' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>停用影响范围</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: '关联产品', value: impactData.products },
                  { label: '合作渠道', value: impactData.channels },
                  { label: '有效保单', value: impactData.activePolicies.toLocaleString() },
                  { label: '在途报价', value: impactData.pendingQuotes },
                  { label: '待结佣金', value: `$${(impactData.pendingCommission / 1000).toFixed(0)}K` },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#7a5c00', marginTop: 12 }}>
                停用后：不再分配新业务，已有保单和佣金继续正常处理，渠道产品授权将被批量收回。
              </div>
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
              {isDisabling ? '停用原因' : '启用原因'}<span style={{ color: '#BA1A1A' }}> *</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map(r => (
                <label
                  key={r}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                    background: reason === r ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${reason === r ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                    transition: 'all 120ms',
                  }}
                >
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5, color: '#181C23' }}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 6 }}>
              备注说明
            </label>
            <textarea
              className="input-glass"
              style={{ width: '100%', minHeight: 80, resize: 'vertical', fontSize: 13.5 }}
              placeholder="可选填写详细说明或背景信息…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Effect date */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
              生效时间<span style={{ color: '#BA1A1A' }}> *</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'immediate', label: '立即生效' },
                { val: 'scheduled', label: '定时生效' },
              ].map(opt => (
                <label
                  key={opt.val}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                    background: effectDate === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${effectDate === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  }}
                >
                  <input type="radio" name="effectDate" value={opt.val} checked={effectDate === opt.val} onChange={() => setEffectDate(opt.val)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5 }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {effectDate === 'scheduled' && (
              <div style={{ marginTop: 10 }}>
                <input type="date" className="input-glass" style={{ fontSize: 13 }} min={today} value={futureDate} onChange={e => setFutureDate(e.target.value)} />
                {isDisabling && (
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 6 }}>
                    定时停用：该日期前渠道可继续处理在途业务（过渡期），到期后自动停用
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#0058BC', width: 15, height: 15, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#414755' }}>
              我已了解此操作的影响范围，确认{isDisabling ? '停用' : '启用'}
              <strong style={{ color: '#181C23' }}> {ins.name}</strong>，
              并已告知相关团队成员。本操作将记录至审计日志并需主管审批后生效。
            </span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onClose}>取消</button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 22px',
              background: canConfirm ? (isDisabling ? '#BA1A1A' : '#0058BC') : 'rgba(193,198,215,0.5)',
              color: canConfirm ? '#fff' : '#717786',
              borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'all 140ms',
            }}
          >
            {isDisabling ? <StopCircle size={14} /> : <PlayCircle size={14} />}
            {isDisabling ? '提交停用申请' : '确认启用'}
          </button>
        </div>
      </div>
    </div>
  )
}
