import { useState } from 'react'
import {
  ArrowLeft, Edit2, StopCircle, PlayCircle, FileText, Download, ExternalLink,
  Building2, MapPin, Globe, Calendar, Star, Phone, Mail, Briefcase,
  TrendingUp, TrendingDown, Package, Users, DollarSign, ShieldCheck,
  Upload, Eye, Trash2, Clock, CheckCircle, AlertTriangle, MoreHorizontal,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { insurers, products, channels, formatCurrency, formatPercent, premiumTrendData } from '../data/mockData'
import { changeHistory, documents, contacts } from '../data/insurerDetails'
import type { ViewId } from '../components/Sidebar'

interface Props {
  insurerId: string
  navigateTo: (view: ViewId, params?: { insurerId?: string; formMode?: string }) => void
  onDisable?: (id: string) => void
}

const TABS = [
  { id: 'info', label: '基本信息' },
  { id: 'ratings', label: '财务评级' },
  { id: 'products', label: '关联产品' },
  { id: 'channels', label: '合作渠道' },
  { id: 'performance', label: '业绩概览' },
  { id: 'documents', label: '资质附件' },
  { id: 'history', label: '变更历史' },
]

const sectionBg = 'rgba(255,255,255,0.7)'
const sectionBorder = '0.5px solid rgba(193,198,215,0.5)'
const fieldLabel = { fontSize: 12, color: '#717786', fontWeight: 500, marginBottom: 4 }
const fieldValue = { fontSize: 14, color: '#181C23', fontWeight: 500 }

const RATING_COLOR: Record<string, string> = {
  'A++': '#1a7a2e', 'A+': '#1a7a2e', 'A': '#0058BC', 'A-': '#0058BC',
  'B++': '#7a5c00', 'B+': '#7a5c00',
}

const lossData = [
  { month: 'Mar', ratio: 61.2 }, { month: 'Apr', ratio: 60.8 }, { month: 'May', ratio: 63.1 },
  { month: 'Jun', ratio: 61.5 }, { month: 'Jul', ratio: 59.8 }, { month: 'Aug', ratio: 62.2 },
]

const DOC_TYPE_COLOR: Record<string, string> = {
  '主合作协议': 'badge-blue',
  '保密协议 (NDA)': 'badge-gray',
  '数据处理协议 (DPA)': 'badge-purple',
  '评级报告': 'badge-yellow',
  '州营业执照': 'badge-green',
  '佣金补充协议': 'badge-orange',
}

export default function InsurerDetail({ insurerId, navigateTo, onDisable }: Props) {
  const [activeTab, setActiveTab] = useState('info')
  const ins = insurers.find(i => i.id === insurerId) ?? insurers[0]
  const insProducts = products.filter(p => p.insurerId === insurerId)
  const insChannels = channels.filter(c => !c.parentId).slice(0, 5)
  const insHistory = changeHistory.filter(c => c.insurerId === insurerId)
  const insDocs = documents.filter(d => d.insurerId === insurerId)
  const insContacts = contacts.filter(c => c.insurerId === insurerId)

  const coopColors: Record<string, string> = { active: '#1a7a2e', expiring: '#a05800', negotiating: '#0058BC', terminated: '#BA1A1A' }
  const coopLabels: Record<string, string> = { active: '正常', expiring: '即将到期', negotiating: '洽谈中', terminated: '已终止' }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back + actions bar */}
      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
          <ArrowLeft size={15} /> 返回列表
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" style={{ fontSize: 13 }}><Download size={14} />导出 PDF</button>
          {ins.status === 'active'
            ? <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => onDisable ? onDisable(insurerId) : undefined}>
                <StopCircle size={14} />停用
              </button>
            : <button className="btn-ghost" style={{ fontSize: 13, color: '#1a7a2e' }} onClick={() => onDisable ? onDisable(insurerId) : undefined}>
                <PlayCircle size={14} />启用
              </button>
          }
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-edit', { insurerId })}>
            <Edit2 size={14} />编辑
          </button>
        </div>
      </div>

      {/* Company header card */}
      <div
        className="glass-strong"
        style={{ borderRadius: 20, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 24 }}
      >
        {/* Logo placeholder */}
        <div style={{
          width: 72, height: 72, borderRadius: 18, flexShrink: 0,
          background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 60%, #60CDFF 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,88,188,0.28)',
          fontSize: 22, fontWeight: 800, color: '#fff',
        }}>
          {ins.shortName.slice(0, 2).toUpperCase()}
        </div>

        {/* Identity */}
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#181C23' }}>{ins.name}</h1>
            <span
              style={{
                fontSize: 13, fontWeight: 700, color: RATING_COLOR[ins.amBestRating] ?? '#414755',
                background: 'rgba(0,88,188,0.07)', padding: '3px 10px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              AM Best {ins.amBestRating}
            </span>
            <span className={`badge ${ins.status === 'active' ? 'badge-green' : ins.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
              <span className={`orb ${ins.status === 'active' ? 'orb-green' : ins.status === 'pending' ? 'orb-yellow' : 'orb-gray'}`} />
              {ins.status === 'active' ? '合作中' : ins.status === 'pending' ? '待审核' : '已停用'}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: '#414755', marginBottom: 16 }}>
            <span className="flex items-center gap-1.5"><Building2 size={13} />NAIC {ins.naicCode}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} />{ins.headquarters}</span>
            <span className="flex items-center gap-1.5"><Globe size={13} />{ins.website}</span>
            <span className="flex items-center gap-1.5"><Calendar size={13} />成立于 {ins.founded} 年</span>
            <span className="flex items-center gap-1.5">
              <span className={`badge ${ins.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>{ins.type}</span>
            </span>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: '总保费', value: formatCurrency(ins.totalPremium, true), sub: '本年' },
              { label: '保单数', value: ins.policyCount.toLocaleString(), sub: '有效保单' },
              { label: '赔付率', value: formatPercent(ins.lossRatio), sub: ins.lossRatio > 0.65 ? '⚠ 超预警' : '正常', warn: ins.lossRatio > 0.65 },
              { label: '续保率', value: formatPercent(ins.renewalRate), sub: '本年' },
              { label: '合作渠道', value: ins.channelCount.toString(), sub: '个渠道' },
              { label: '产品数量', value: ins.productCount.toString(), sub: '个产品' },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(236,237,249,0.6)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? '#BA1A1A' : '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                <div style={{ fontSize: 11, color: k.warn ? '#BA1A1A' : '#717786', marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coop status badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>合作状态</div>
          <div className="flex items-center gap-1.5 justify-end" style={{ marginBottom: 12 }}>
            <span className={`orb ${ins.coopStatus === 'active' ? 'orb-green' : ins.coopStatus === 'expiring' ? 'orb-orange' : 'orb-purple'}`} />
            <span style={{ fontSize: 14, fontWeight: 600, color: coopColors[ins.coopStatus] }}>{coopLabels[ins.coopStatus]}</span>
          </div>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>合同到期</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{ins.contractExpiry}</div>
          {ins.coopStatus === 'expiring' && (
            <div style={{ fontSize: 11, color: '#a05800', marginTop: 4 }}>
              剩余 {Math.round((new Date(ins.contractExpiry).getTime() - Date.now()) / 86400000)} 天
            </div>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 24px' }}>
          {TABS.map(t => (
            <div key={t.id} className={`tab-item${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.id === 'history' && insHistory.length > 0 && (
                <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{insHistory.length}</span>
              )}
              {t.id === 'documents' && insDocs.some(d => d.status !== 'valid') && (
                <span className="badge badge-yellow" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>!</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '24px' }}>

          {/* ─── 基本信息 ─── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Basic */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} style={{ color: '#0058BC' }} />公司基本信息
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['公司全称', ins.name],
                      ['公司简称', ins.shortName],
                      ['NAIC 编码', ins.naicCode],
                      ['公司类型', ins.type],
                      ['成立年份', ins.founded.toString()],
                      ['官方网站', ins.website],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={{ ...fieldValue, fontFamily: ['NAIC 编码'].includes(label) ? "'JetBrains Mono', monospace" : undefined }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* HQ */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#0058BC' }} />总部信息
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['总部地址', ins.headquarters],
                      ['所在州', ins.state],
                      ['大区', ins.region],
                      ['业务线', ins.lines.join(', ')],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={fieldValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Settlement */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={14} style={{ color: '#0058BC' }} />结算配置
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['结算周期', ins.settlementCycle === 'Monthly' ? '月度结算' : '季度结算'],
                      ['账单格式', 'API 自动拉取'],
                      ['账单截止日', '每月 25 日'],
                      ['付款期限', '对账后 30 天'],
                      ['结算货币', 'USD'],
                      ['保费归集', '渠道代收 → 平台归集'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={fieldValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contacts */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} style={{ color: '#0058BC' }} />对接人联络
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insContacts.slice(0, 4).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>{c.role} · {c.title}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, color: '#414755' }}>{c.email}</div>
                          <div style={{ fontSize: 11.5, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{c.phone}</div>
                        </div>
                      </div>
                    ))}
                    {insContacts.length > 4 && (
                      <button className="btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-start' }}>
                        查看全部 {insContacts.length} 个对接人
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ─── 财务评级 ─── */}
          {activeTab === 'ratings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>当前信用评级</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { agency: 'AM Best', rating: ins.amBestRating, date: '2026-07-15', type: 'Financial Strength Rating', positive: true },
                      { agency: 'S&P Global', rating: ins.spRating, date: '2026-01-10', type: 'Insurer Financial Strength', positive: true },
                      { agency: "Moody's", rating: 'Aa3', date: '2025-12-01', type: 'Insurance Financial Strength', positive: true },
                      { agency: 'Fitch', rating: 'A+', date: '2025-11-15', type: 'Insurer Financial Strength', positive: true },
                    ].map(r => (
                      <div key={r.agency} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(241,243,254,0.7)', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.agency}</div>
                          <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{r.type}</div>
                          <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>更新于 {r.date}</div>
                        </div>
                        <div style={{
                          fontSize: 28, fontWeight: 800, color: RATING_COLOR[r.rating] ?? '#0058BC',
                          fontFamily: "'JetBrains Mono', monospace",
                          background: r.positive ? 'rgba(52,199,89,0.08)' : 'rgba(186,26,26,0.08)',
                          padding: '6px 16px', borderRadius: 10,
                        }}>
                          {r.rating}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>赔付率走势（近6月）</div>
                  <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 14 }}>月度赔付率 · 预警阈值 65%</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lossData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} domain={[55, 70]} tickFormatter={v => `${v}%`} width={36} />
                      <Tooltip formatter={(v: any) => [`${v}%`, '赔付率']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="ratio" stroke="#0058BC" strokeWidth={2} dot={{ r: 4, fill: '#0058BC' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { label: '当前赔付率', value: formatPercent(ins.lossRatio), color: ins.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' },
                      { label: '行业均值', value: '63.5%', color: '#717786' },
                      { label: '本年目标', value: '60.0%', color: '#0058BC' },
                    ].map(m => (
                      <div key={m.label} style={{ flex: 1, background: 'rgba(236,237,249,0.7)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>财务健康指标</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '偿付能力充足率', value: '312%', status: 'good', threshold: '150%' },
                      { label: '综合成本率', value: '97.8%', status: 'ok', threshold: '100%' },
                      { label: '投资回报率', value: '4.2%', status: 'good', threshold: '3.5%' },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#181C23' }}>{m.label}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>监管阈值: {m.threshold}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: m.status === 'good' ? '#1a7a2e' : '#a05800', fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</span>
                          <CheckCircle size={14} style={{ color: m.status === 'good' ? '#34C759' : '#FFCC00' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ─── 关联产品 ─── */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>该保险公司下共 <strong style={{ color: '#181C23' }}>{ins.productCount}</strong> 个产品</div>
                <button className="btn-primary" style={{ fontSize: 13 }}>
                  <Package size={14} />新增产品
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>产品名称</th>
                    <th>产品代码</th>
                    <th>业务线</th>
                    <th>类型</th>
                    <th style={{ textAlign: 'right' }}>保费</th>
                    <th style={{ textAlign: 'right' }}>保单数</th>
                    <th style={{ textAlign: 'right' }}>赔付率</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(insProducts.length > 0 ? insProducts : products.slice(0, 3)).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</td>
                      <td><span className="font-data" style={{ fontSize: 12, background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.code}</span></td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11.5 }}>{p.line}</span></td>
                      <td style={{ fontSize: 13 }}>{p.type === 'Individual' ? '个人险' : '团体险'}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>{formatCurrency(p.premium, true)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{p.policyCount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: p.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>{formatPercent(p.lossRatio)}</span>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'on-sale' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {p.status === 'on-sale' ? '在售' : p.status === 'pending' ? '待审核' : '暂停'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-0.5">
                          <button className="btn-ghost" style={{ padding: 5 }}><Eye size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }}><Edit2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── 合作渠道 ─── */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>已授权合作渠道共 <strong style={{ color: '#181C23' }}>{ins.channelCount}</strong> 个</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>渠道名称</th>
                    <th>渠道类型</th>
                    <th>等级</th>
                    <th style={{ textAlign: 'right' }}>贡献保费</th>
                    <th style={{ textAlign: 'right' }}>保费占比</th>
                    <th style={{ textAlign: 'right' }}>赔付率</th>
                    <th style={{ textAlign: 'right' }}>续保率</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {insChannels.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{c.npnCode}</div>
                      </td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{c.type === 'Independent Agency' ? '独立代理' : c.type}</span></td>
                      <td><span className={`badge ${c.tier === 'Platinum' ? 'badge-purple' : c.tier === 'Gold' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>{c.tier === 'Platinum' ? '铂金' : c.tier === 'Gold' ? '金级' : '银级'}</span></td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>{formatCurrency(c.totalPremium * 0.18, true)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{(Math.random() * 15 + 5).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: c.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>{formatPercent(c.lossRatio)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{formatPercent(c.renewalRate)}</td>
                      <td><span className="flex items-center gap-1.5"><span className="orb orb-green" /><span style={{ fontSize: 12 }}>活跃</span></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── 业绩概览 ─── */}
          {activeTab === 'performance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>月度保费趋势</div>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 12 }}>近 6 个月 · 百万美元</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={premiumTrendData.slice(-6).map(d => ({ ...d, insurer: (d.premium * 0.19).toFixed(0) }))} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} width={44} />
                    <Tooltip formatter={(v: any) => [`$${v}M`, '保费']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="insurer" fill="#0058BC" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>核心业绩指标</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: '本年保费', value: formatCurrency(ins.totalPremium, true), change: '+12.4%', up: true },
                    { label: '件均保费', value: formatCurrency(ins.totalPremium / ins.policyCount, true), change: '+3.8%', up: true },
                    { label: '新单保费占比', value: '28.4%', change: '+2.1pp', up: true },
                    { label: '赔付率', value: formatPercent(ins.lossRatio), change: '-1.2pp', up: true },
                    { label: '续保率', value: formatPercent(ins.renewalRate), change: '+0.6pp', up: true },
                    { label: '佣金收入', value: formatCurrency(ins.commissionIncome, true), change: '+14.2%', up: true },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'rgba(241,243,254,0.7)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: m.up ? '#1a7a2e' : '#BA1A1A', marginTop: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{m.change} YoY
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─── 资质附件 ─── */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>共 {insDocs.length} 个文件</div>
                <button className="btn-primary" style={{ fontSize: 13 }}><Upload size={14} />上传文件</button>
              </div>
              {insDocs.some(d => d.status !== 'valid') && (
                <div style={{ background: 'rgba(255,149,0,0.08)', border: '0.5px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, color: '#7a5c00' }}>{insDocs.filter(d => d.status !== 'valid').length} 个文件即将到期或已过期，请及时更新</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insDocs.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.7)', border: sectionBorder, borderRadius: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} style={{ color: '#0058BC' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>
                        <span className={`badge ${DOC_TYPE_COLOR[doc.type] ?? 'badge-gray'}`} style={{ fontSize: 10.5, marginRight: 8 }}>{doc.type}</span>
                        {doc.size} · 上传于 {doc.uploadedAt} · {doc.uploadedBy}
                        {doc.expiry && ` · 有效期至 ${doc.expiry}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'expiring' && (
                        <span className="badge badge-yellow" style={{ fontSize: 11 }}><AlertTriangle size={10} />即将到期</span>
                      )}
                      {doc.status === 'expired' && (
                        <span className="badge badge-red" style={{ fontSize: 11 }}>已过期</span>
                      )}
                      <button className="btn-ghost" style={{ padding: 6 }}><Eye size={14} /></button>
                      <button className="btn-ghost" style={{ padding: 6 }}><Download size={14} /></button>
                      <button className="btn-ghost" style={{ padding: 6, color: '#BA1A1A' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {insDocs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#717786', fontSize: 14 }}>
                    暂无附件文件
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── 变更历史 ─── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>共 {insHistory.length} 条变更记录</div>
                <div className="flex gap-2">
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>全部字段</option>
                    <option>基本信息</option>
                    <option>财务评级</option>
                    <option>结算信息</option>
                  </select>
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>全部操作人</option>
                    <option>Liu Yang</option>
                    <option>Zhang Wei</option>
                  </select>
                  <button className="btn-ghost" style={{ fontSize: 12.5 }}><Download size={13} />导出日志</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(insHistory.length > 0 ? insHistory : changeHistory.slice(0, 5)).map((rec, idx, arr) => (
                  <div key={rec.id} style={{ display: 'flex', gap: 16, paddingBottom: 20 }}>
                    {/* Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: rec.status === 'approved' ? 'rgba(52,199,89,0.12)' : rec.status === 'auto' ? 'rgba(0,88,188,0.10)' : 'rgba(255,204,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1.5px solid ${rec.status === 'approved' ? '#34C759' : rec.status === 'auto' ? '#0058BC' : '#FFCC00'}`,
                      }}>
                        {rec.status === 'approved' ? <CheckCircle size={13} style={{ color: '#34C759' }} />
                          : rec.status === 'auto' ? <Clock size={13} style={{ color: '#0058BC' }} />
                          : <Clock size={13} style={{ color: '#FFCC00' }} />}
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ width: 1.5, flex: 1, background: 'rgba(193,198,215,0.5)', marginTop: 4 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{rec.field}</span>
                        <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{rec.section}</span>
                        <span style={{ fontSize: 12, color: '#717786', marginLeft: 'auto' }}>{rec.timestamp}</span>
                      </div>

                      {/* Before / after */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ flex: 1, background: 'rgba(186,26,26,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(186,26,26,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#BA1A1A', fontWeight: 600, marginBottom: 3 }}>变更前</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.oldValue}</div>
                        </div>
                        <div style={{ fontSize: 16, color: '#C1C6D7' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(52,199,89,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(52,199,89,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#1a7a2e', fontWeight: 600, marginBottom: 3 }}>变更后</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.newValue}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#717786' }}>
                        <span style={{ fontWeight: 500, color: '#414755' }}>{rec.operator}</span>
                        <span style={{ marginLeft: 4 }}>({rec.operatorRole})</span>
                        {rec.reason && <span style={{ marginLeft: 8 }}>· {rec.reason}</span>}
                        {rec.approvedBy && (
                          <span style={{ marginLeft: 8 }}>· 审批人: <span style={{ color: '#0058BC' }}>{rec.approvedBy}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
