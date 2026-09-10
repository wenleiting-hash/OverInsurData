import { useState } from 'react'
import {
  ArrowLeft, FileCheck, ShieldCheck, Building2, MapPin, FileText,
  CheckCircle2, Info, Check,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId) => void
}

const STEPS = [
  { label: '选择渠道',    sub: '选择申请渠道商',      icon: ShieldCheck },
  { label: '选择保险公司', sub: '选择目标保险公司',    icon: Building2 },
  { label: '配置详情',    sub: '州 · 业务线 · 说明', icon: MapPin },
  { label: '确认提交',    sub: '核对信息并提交',      icon: FileText },
]

const CHANNELS = [
  { id: 'c1', name: 'Pacific Coast Insurance Group',   npn: 'NPN12348901', state: 'CA', agents: 142 },
  { id: 'c2', name: 'Lone Star Brokerage',             npn: 'NPN23459012', state: 'TX', agents: 98  },
  { id: 'c3', name: 'Great Lakes Insurance Partners',  npn: 'NPN34560123', state: 'IL', agents: 76  },
  { id: 'c4', name: 'Empire State Insurance Services', npn: 'NPN45671234', state: 'NY', agents: 210 },
  { id: 'c5', name: 'Sunshine State Brokers',          npn: 'NPN56782345', state: 'FL', agents: 63  },
]

const INSURERS = [
  { name: 'Travelers',          lines: ['P&C', 'Auto', 'Commercial'] },
  { name: 'Liberty Mutual',     lines: ['Auto', 'Home', 'Commercial'] },
  { name: 'Nationwide',         lines: ['P&C', 'Life', 'Health'] },
  { name: 'Chubb',              lines: ['Specialty', 'Commercial', 'P&C'] },
  { name: 'AIG',                lines: ['Specialty', 'Commercial', 'Surplus Lines'] },
  { name: 'Zurich',             lines: ['Commercial', 'Specialty'] },
  { name: 'Berkshire Hathaway', lines: ['P&C', 'Commercial'] },
  { name: 'Hartford',           lines: ['P&C', 'Auto', 'Commercial'] },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const LINES = ['P&C', 'Auto', 'Life', 'Health', 'Commercial', 'Specialty', 'Professional', 'Surplus Lines']

function FldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: '#414755', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
      {children}{required && <span style={{ color: '#BA1A1A', fontSize: 13 }}>*</span>}
    </label>
  )
}

export default function AppointmentNewView({ navigateTo }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ channelId: '', insurer: '', state: '', line: '', reason: '', urgent: false })

  const canNext = [!!form.channelId, !!form.insurer, !!form.state && !!form.line, true]
  const selectedChannel = CHANNELS.find(c => c.id === form.channelId)
  const selectedInsurer = INSURERS.find(i => i.name === form.insurer)

  const handleSubmit = () => {
    setSaving(true)
    setTimeout(() => navigateTo('appointment'), 1200)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <button
            className="btn-ghost"
            style={{ fontSize: 13, marginBottom: 10, padding: '6px 10px' }}
            onClick={() => navigateTo('appointment')}
          >
            <ArrowLeft size={14} /> 返回合规管理
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px', margin: 0 }}>
            新建 Appointment 申请
          </h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 4 }}>
            通过 NIPR 为渠道商提交 Appointment 申请，处理周期通常为 2–6 周
          </p>
        </div>
      </div>

      {/* ── Main layout: left step nav + right content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: vertical step list ── */}
        <div className="card" style={{ padding: '20px 16px', position: 'sticky', top: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#A0A5B4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingLeft: 4 }}>
            申请进度
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const state = i < step ? 'done' : i === step ? 'active' : 'upcoming'
              return (
                <div
                  key={s.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 10px', borderRadius: 10,
                    background: state === 'active' ? 'rgba(0,88,188,0.08)' : 'transparent',
                    cursor: i < step ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                  }}
                  onClick={() => i < step && setStep(i)}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: state === 'done' ? '#0058BC' : state === 'active' ? 'rgba(0,88,188,0.12)' : 'rgba(193,198,215,0.2)',
                    border: state === 'active' ? '2px solid #0058BC' : state === 'done' ? '2px solid #0058BC' : '1.5px solid rgba(193,198,215,0.5)',
                    boxShadow: state === 'active' ? '0 0 0 3px rgba(0,88,188,0.12)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {state === 'done'
                      ? <Check size={13} color="#fff" strokeWidth={2.5} />
                      : <Icon size={13} color={state === 'active' ? '#0058BC' : '#A0A5B4'} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: state === 'active' ? 700 : 500, color: state === 'upcoming' ? '#A0A5B4' : state === 'active' ? '#0058BC' : '#181C23', lineHeight: 1.2 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#A0A5B4', marginTop: 1 }}>{s.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected summary */}
          {(selectedChannel || selectedInsurer) && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A0A5B4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>已选信息</div>
              {selectedChannel && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#A0A5B4', marginBottom: 2 }}>渠道商</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#181C23', lineHeight: 1.3 }}>{selectedChannel.name}</div>
                  <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{selectedChannel.npn}</div>
                </div>
              )}
              {selectedInsurer && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#A0A5B4', marginBottom: 2 }}>保险公司</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#181C23' }}>{selectedInsurer.name}</div>
                </div>
              )}
              {form.state && (
                <div>
                  <div style={{ fontSize: 11, color: '#A0A5B4', marginBottom: 2 }}>申请州 / 业务线</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>
                    {form.state}{form.line ? ` · ${form.line}` : ''}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: step content ── */}
        <div>
          <div className="card" style={{ padding: '28px 32px' }}>

            {/* Step 0 — 选择渠道 */}
            {step === 0 && (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#181C23', margin: '0 0 6px' }}>选择渠道商</h2>
                  <p style={{ fontSize: 13, color: '#717786' }}>选择要申请 Appointment 的渠道商，已排除无效牌照渠道</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CHANNELS.map(ch => {
                    const active = form.channelId === ch.id
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setForm(f => ({ ...f, channelId: ch.id }))}
                        style={{
                          textAlign: 'left', width: '100%', borderRadius: 12, padding: '14px 18px',
                          border: active ? '1px solid rgba(0,88,188,0.4)' : '0.5px solid rgba(193,198,215,0.55)',
                          background: active ? 'rgba(0,88,188,0.06)' : 'rgba(255,255,255,0.7)',
                          boxShadow: active ? '0 0 0 3px rgba(0,88,188,0.10)' : 'none',
                          cursor: 'pointer', transition: 'all 0.13s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: active ? 'rgba(0,88,188,0.12)' : 'rgba(193,198,215,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <ShieldCheck size={16} color={active ? '#0058BC' : '#717786'} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#181C23', lineHeight: 1.3 }}>{ch.name}</div>
                            <div style={{ fontSize: 12, color: '#717786', marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                              NPN: {ch.npn} · {ch.state} · {ch.agents} 名代理人
                            </div>
                          </div>
                          {active && (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0058BC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Check size={12} color="#fff" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 1 — 选择保险公司 */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#181C23', margin: '0 0 6px' }}>选择保险公司</h2>
                  <p style={{ fontSize: 13, color: '#717786' }}>选择要申请 Appointment 的保险公司</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {INSURERS.map(ins => {
                    const active = form.insurer === ins.name
                    return (
                      <button
                        key={ins.name}
                        onClick={() => setForm(f => ({ ...f, insurer: ins.name }))}
                        style={{
                          textAlign: 'left', borderRadius: 12, padding: '14px 16px',
                          border: active ? '1px solid rgba(0,88,188,0.4)' : '0.5px solid rgba(193,198,215,0.55)',
                          background: active ? 'rgba(0,88,188,0.06)' : 'rgba(255,255,255,0.7)',
                          boxShadow: active ? '0 0 0 3px rgba(0,88,188,0.10)' : 'none',
                          cursor: 'pointer', transition: 'all 0.13s',
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: active ? '#0058BC' : '#181C23', marginBottom: 5 }}>{ins.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ins.lines.map(l => (
                              <span key={l} style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: active ? 'rgba(0,88,188,0.10)' : 'rgba(193,198,215,0.2)', color: active ? '#0058BC' : '#717786' }}>{l}</span>
                            ))}
                          </div>
                        </div>
                        {active && <Check size={15} color="#0058BC" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — 配置详情 */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ marginBottom: 2 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#181C23', margin: '0 0 6px' }}>配置申请详情</h2>
                  <p style={{ fontSize: 13, color: '#717786' }}>选择申请州、业务线，并填写补充说明</p>
                </div>

                <div>
                  <FldLabel required>申请州</FldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                    {US_STATES.map(s => {
                      const active = form.state === s
                      return (
                        <button
                          key={s}
                          onClick={() => setForm(f => ({ ...f, state: s }))}
                          style={{
                            borderRadius: 7, padding: '6px 2px', fontSize: 11.5, fontWeight: 700,
                            border: active ? '1px solid rgba(0,88,188,0.45)' : '0.5px solid rgba(193,198,215,0.55)',
                            background: active ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.65)',
                            color: active ? '#0058BC' : '#717786',
                            cursor: 'pointer', transition: 'all 0.10s',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >{s}</button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <FldLabel required>业务线</FldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {LINES.map(l => {
                      const active = form.line === l
                      return (
                        <button
                          key={l}
                          onClick={() => setForm(f => ({ ...f, line: l }))}
                          style={{
                            borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
                            border: active ? '1px solid rgba(0,88,188,0.45)' : '0.5px solid rgba(193,198,215,0.55)',
                            background: active ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.65)',
                            color: active ? '#0058BC' : '#414755',
                            cursor: 'pointer', transition: 'all 0.10s',
                          }}
                        >{l}</button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <FldLabel>申请说明</FldLabel>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    rows={4}
                    placeholder="请输入申请原因、业务背景等补充说明…"
                    className="input-glass w-full"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    padding: '12px 16px', borderRadius: 12,
                    border: `0.5px solid ${form.urgent ? 'rgba(255,59,48,0.3)' : 'rgba(193,198,215,0.5)'}`,
                    background: form.urgent ? 'rgba(255,59,48,0.04)' : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.urgent}
                    onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: form.urgent ? '#C0392B' : '#181C23' }}>标记为紧急申请</div>
                    <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>启用加急处理通道，预计 3 个工作日内完成审批</div>
                  </div>
                </label>
              </div>
            )}

            {/* Step 3 — 确认提交 */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ marginBottom: 2 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#181C23', margin: '0 0 6px' }}>确认申请信息</h2>
                  <p style={{ fontSize: 13, color: '#717786' }}>提交前请仔细核对以下信息，提交后将自动进入 NIPR 处理流程</p>
                </div>

                <div style={{ borderRadius: 12, border: '0.5px solid rgba(0,88,188,0.2)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', background: 'rgba(0,88,188,0.05)', borderBottom: '0.5px solid rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={15} color="#0058BC" />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#181C23' }}>申请摘要</span>
                  </div>
                  <div style={{ padding: '4px 18px 10px' }}>
                    {[
                      ['渠道商',   selectedChannel?.name ?? '—'],
                      ['渠道 NPN', selectedChannel?.npn ?? '—'],
                      ['保险公司', form.insurer || '—'],
                      ['申请州',   form.state || '—'],
                      ['业务线',   form.line || '—'],
                      ['优先级',   form.urgent ? '紧急（加急通道）' : '普通'],
                      ...(form.reason ? [['申请说明', form.reason]] as const : []),
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '0.5px solid rgba(193,198,215,0.3)', padding: '10px 0', fontSize: 13, gap: 12 }}>
                        <span style={{ color: '#717786', flexShrink: 0 }}>{k}</span>
                        <span style={{
                          fontWeight: 600,
                          color: k === '优先级' && form.urgent ? '#C0392B' : '#181C23',
                          fontFamily: k === '渠道 NPN' ? "'JetBrains Mono', monospace" : undefined,
                          textAlign: 'right',
                        }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,159,10,0.07)', border: '0.5px solid rgba(255,159,10,0.28)', lineHeight: 1.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13, color: '#7A5000', marginBottom: 6 }}>
                    <Info size={14} /> 提交前注意事项
                  </div>
                  <p style={{ fontSize: 12.5, color: '#7A5000', margin: 0 }}>
                    提交后系统将自动通过 NIPR 提交 Appointment 申请，处理周期通常为 2–6 周，具体视州监管机构而定。请确保渠道牌照在申请州有效且未过期。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Step navigation ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: 13 }}
              onClick={() => step > 0 ? setStep(s => s - 1) : navigateTo('appointment')}
            >
              <ArrowLeft size={14} />{step === 0 ? '取消' : '上一步'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#A0A5B4' }}>
                {step + 1} / {STEPS.length}
              </span>
              <button
                className="btn-primary"
                style={{ fontSize: 13, ...(canNext[step] ? {} : { opacity: 0.4, cursor: 'not-allowed' }) }}
                onClick={() => {
                  if (!canNext[step]) return
                  if (step < STEPS.length - 1) setStep(s => s + 1)
                  else handleSubmit()
                }}
              >
                {step < STEPS.length - 1
                  ? <>下一步 <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} /></>
                  : saving
                    ? <><CheckCircle2 size={13} className="animate-spin" />提交中…</>
                    : <><CheckCircle2 size={13} />确认提交</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
