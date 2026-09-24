import { useState, useRef } from 'react'
import {
  ArrowLeft, Edit2, StopCircle, PlayCircle, FileText, Download, ExternalLink,
  Building2, MapPin, Globe, Calendar, Star, Phone, Mail, Briefcase,
  TrendingUp, TrendingDown, Package, Users, DollarSign, ShieldCheck,
  Upload, Eye, Trash2, Clock, CheckCircle, AlertTriangle, MoreHorizontal,
  Plus, X, ChevronDown,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { insurers, products, channels, formatCurrency, formatPercent, premiumTrendData } from '../data/mockData'
import { changeHistory, documents, contacts } from '../data/insurerDetails'
import { cooperations } from '../data/cooperationData'
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
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productLineFilter, setProductLineFilter] = useState('all')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [productLinked, setProductLinked] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDragging, setUploadDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState('')
  const [uploadExpiry, setUploadExpiry] = useState('')
  const [uploadSaved, setUploadSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

          {/* KPI row — 4 items per V1.0.1 */}
          {(() => {
            const coopRecord = cooperations.find(c => c.insurerId === ins.id && (c.status === 'Active' || c.status === 'Signed' || c.status === 'PendingSign'))
            const coopProducts = products.filter(p => p.insurerId === ins.id && p.status === 'on-sale')
            const coopStatusLabel = coopRecord ? '合作中' : '未合作'
            const coopStatusColor = coopRecord ? '#1E8033' : '#717786'
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: '合作产品数', value: coopProducts.length.toString(), sub: '在售产品', color: '#0058BC', bg: 'rgba(0,88,188,0.08)', border: 'rgba(0,88,188,0.2)' },
                  { label: '合作状态',   value: coopStatusLabel, sub: coopRecord ? `起：${coopRecord.startDate.slice(0,7)}` : '尚未建立合作关系', color: coopStatusColor, bg: coopRecord ? 'rgba(52,199,89,0.08)' : 'rgba(193,198,215,0.10)', border: coopRecord ? 'rgba(52,199,89,0.22)' : 'rgba(193,198,215,0.3)' },
                  { label: '累计账单数', value: (ins.policyCount ? Math.floor(ins.policyCount / 120) + 24 : 24).toString(), sub: '历史账单导入', color: '#AF52DE', bg: 'rgba(175,82,222,0.08)', border: 'rgba(175,82,222,0.22)' },
                  { label: '累计结算金额', value: formatCurrency(ins.totalPremium * 0.12, true), sub: '基于账单佣金', color: '#B06000', bg: 'rgba(255,159,10,0.08)', border: 'rgba(255,159,10,0.22)' },
                ].map(k => (
                  <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 14, padding: '14px 18px' }}>
                    <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* Coop status badge — driven by cooperation records */}
        {(() => {
          const coopRecord = cooperations.find(c => c.insurerId === ins.id && (c.status === 'Active' || c.status === 'Signed' || c.status === 'PendingSign'))
          const expiresIn90 = coopRecord && new Date(coopRecord.endDate) <= new Date(Date.now() + 90 * 86400000)
          const statusLabel = !coopRecord ? '未合作' : expiresIn90 ? '即将到期' : '合作中'
          const statusColor = !coopRecord ? '#717786' : expiresIn90 ? '#a05800' : '#1E8033'
          const orbCls = !coopRecord ? 'orb-gray' : expiresIn90 ? 'orb-orange' : 'orb-green'
          return (
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>合作状态</div>
          <div className="flex items-center gap-1.5 justify-end" style={{ marginBottom: 12 }}>
            <span className={`orb ${orbCls}`} />
            <span style={{ fontSize: 14, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
          </div>
          {coopRecord && <>
            <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>合作到期</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{coopRecord.endDate.slice(0, 10)}</div>
            {expiresIn90 && (
              <div style={{ fontSize: 11, color: '#a05800', marginTop: 4 }}>
                剩余 {Math.round((new Date(coopRecord.endDate).getTime() - Date.now()) / 86400000)} 天
              </div>
            )}
          </>}
        </div>
          )
        })()}
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
              <div className="flex items-center justify-between mb-3">
                <div style={{ fontSize: 14, color: '#717786' }}>
                  共关联 <strong style={{ color: '#181C23' }}>{(insProducts.length > 0 ? insProducts : products.slice(0, 3)).length}</strong> 个产品
                  &nbsp;·&nbsp;<span style={{ color: '#0058BC' }}>{(insProducts.length > 0 ? insProducts : products.slice(0, 3)).filter(p => p.status === 'on-sale').length} 个在售</span>
                </div>
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { setProductSearch(''); setProductLineFilter('all'); setSelectedProductIds(new Set()); setProductLinked(false); setShowProductModal(true) }}>
                  <Plus size={14} />关联已有产品
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#A0A5B1', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0058BC', flexShrink: 0, display: 'inline-block' }} />
                产品由新建保险公司或接入流程自动关联；可通过「关联已有产品」手动补充挂靠
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>产品名称</th>
                    <th>产品代码</th>
                    <th>险种</th>
                    <th>类型</th>
                    <th>可售州</th>
                    <th style={{ textAlign: 'right' }}>保费</th>
                    <th style={{ textAlign: 'right' }}>保单数</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(insProducts.length > 0 ? insProducts : products.slice(0, 3)).map((p, idx) => {
                    const stateCount = [12, 8, 23, 5, 17, 31][idx % 6]
                    return (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigateTo('product-detail', { productId: p.id } as any)}>
                        <td style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</td>
                        <td><span className="font-data" style={{ fontSize: 12, background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.code}</span></td>
                        <td><span className="badge badge-blue" style={{ fontSize: 11.5 }}>{p.line}</span></td>
                        <td style={{ fontSize: 13 }}>{p.type === 'Individual' ? '个人险' : p.type === 'Group' ? '团体险' : '自愿福利险'}</td>
                        <td>
                          <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: stateCount >= 20 ? '#1a7a2e' : stateCount >= 10 ? '#0058BC' : '#a05800', fontWeight: 500 }}>
                            {stateCount} 州
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>{formatCurrency(p.premium, true)}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{p.policyCount.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${p.status === 'on-sale' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                            <span className={`orb ${p.status === 'on-sale' ? 'orb-green' : p.status === 'pending' ? 'orb-yellow' : 'orb-gray'}`} />
                            {p.status === 'on-sale' ? '在售' : p.status === 'pending' ? '待激活' : '暂停'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="btn-ghost" style={{ padding: 5 }} title="查看详情" onClick={() => navigateTo('product-detail', { productId: p.id } as any)}><Eye size={14} /></button>
                        </td>
                      </tr>
                    )
                  })}
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
                    { label: '总保费', value: formatCurrency(ins.totalPremium, true), change: '+12.4%', up: true },
                    { label: '件均保费', value: formatCurrency(ins.totalPremium / ins.policyCount, true), change: '+3.8%', up: true },
                    { label: '新业务占比', value: '28.4%', change: '+2.1pp', up: true },
                    { label: '合作佣金', value: formatCurrency(ins.commissionIncome, true), change: '+14.2%', up: true },
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
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setUploadFile(null); setUploadType(''); setUploadExpiry(''); setShowUploadModal(true) }}><Upload size={14} />上传文件</button>
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

      {/* ─── 新增/编辑产品 Modal ─── */}
      {showProductModal && (() => {
        const alreadyLinked = new Set((insProducts.length > 0 ? insProducts : products.slice(0, 3)).map(p => p.id))
        const candidates = products.filter(p => {
          if (alreadyLinked.has(p.id)) return false
          const q = productSearch.toLowerCase()
          const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
          const matchLine = productLineFilter === 'all' || p.line === productLineFilter
          return matchQ && matchLine
        })
        const allLines = [...new Set(products.map(p => p.line))].sort()
        const togglePick = (id: string) => setSelectedProductIds(prev => {
          const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
        })
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowProductModal(false)}>
            <div style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 20, width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding: '24px 28px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
                <div className="flex items-center justify-between mb-1">
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>关联已有产品</h2>
                  <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowProductModal(false)}><X size={16} /></button>
                </div>
                <p style={{ fontSize: 13, color: '#717786' }}>
                  从产品主数据中选择尚未关联至 <strong style={{ color: '#0058BC' }}>{ins.shortName}</strong> 的产品
                </p>

                {productLinked && (
                  <div style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.3)', borderRadius: 10, padding: '9px 14px', marginTop: 12, fontSize: 13, color: '#1a7a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} />已成功关联 {selectedProductIds.size} 个产品
                  </div>
                )}

                {/* Search + filter */}
                <div className="flex gap-2 mt-14px" style={{ marginTop: 14 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Package size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
                    <input
                      className="input-glass w-full"
                      style={{ paddingLeft: 30, fontSize: 13 }}
                      placeholder="搜索产品名称、产品代码…"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select className="input-glass" style={{ fontSize: 13, paddingRight: 28 }} value={productLineFilter} onChange={e => setProductLineFilter(e.target.value)}>
                      <option value="all">全部险种</option>
                      {allLines.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#717786', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {candidates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#A0A5B1', fontSize: 13.5 }}>
                    <Package size={32} style={{ color: '#C8CEDD', margin: '0 auto 12px' }} />
                    {productSearch || productLineFilter !== 'all' ? '没有符合条件的产品' : '产品主数据中暂无未关联的产品'}
                  </div>
                ) : candidates.map(p => {
                  const picked = selectedProductIds.has(p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePick(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 28px',
                        cursor: 'pointer', transition: 'background 0.1s',
                        background: picked ? 'rgba(0,88,188,0.05)' : 'transparent',
                        borderLeft: `3px solid ${picked ? '#0058BC' : 'transparent'}`,
                      }}
                    >
                      <input type="checkbox" readOnly checked={picked} style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#0058BC', flexShrink: 0 }} />
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: picked ? 'rgba(0,88,188,0.10)' : 'rgba(236,237,249,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' }}>
                        <Package size={16} style={{ color: picked ? '#0058BC' : '#717786' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: picked ? '#0058BC' : '#181C23' }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="font-data" style={{ fontSize: 11, background: 'rgba(236,237,249,0.9)', padding: '1px 6px', borderRadius: 4 }}>{p.code}</span>
                          <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{p.line}</span>
                          <span>{p.type === 'Individual' ? '个人险' : '团体险'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(p.premium, true)}</div>
                        <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{p.policyCount.toLocaleString()} 保单</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 28px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#717786' }}>
                  {selectedProductIds.size > 0
                    ? <span style={{ color: '#0058BC', fontWeight: 600 }}>已选 {selectedProductIds.size} 个产品</span>
                    : `共 ${candidates.length} 个可关联产品`}
                </span>
                <div className="flex gap-3">
                  <button className="btn-secondary" onClick={() => setShowProductModal(false)}>取消</button>
                  <button
                    className="btn-primary"
                    disabled={selectedProductIds.size === 0}
                    onClick={() => { setProductLinked(true); setTimeout(() => setShowProductModal(false), 1200) }}
                  >
                    <Plus size={14} />确认关联 {selectedProductIds.size > 0 ? `(${selectedProductIds.size})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── 上传资质附件 Modal ─── */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowUploadModal(false)}>
          <div style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 20, padding: '28px 32px', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>上传资质附件</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowUploadModal(false)}><X size={16} /></button>
            </div>

            {uploadSaved && (
              <div style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1a7a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} />文件已成功上传
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setUploadDragging(true) }}
              onDragLeave={() => setUploadDragging(false)}
              onDrop={e => { e.preventDefault(); setUploadDragging(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${uploadDragging ? '#0058BC' : uploadFile ? 'rgba(52,199,89,0.6)' : 'rgba(193,198,215,0.6)'}`,
                borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: uploadDragging ? 'rgba(0,88,188,0.04)' : uploadFile ? 'rgba(52,199,89,0.04)' : 'rgba(246,248,255,0.7)',
                marginBottom: 20, transition: 'all 0.15s',
              }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png" onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]) }} />
              {uploadFile ? (
                <div>
                  <CheckCircle size={28} style={{ color: '#34C759', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{uploadFile.name}</div>
                  <div style={{ fontSize: 12, color: '#717786' }}>{(uploadFile.size / 1024).toFixed(0)} KB · 点击更换文件</div>
                </div>
              ) : (
                <div>
                  <Upload size={28} style={{ color: '#A0A5B1', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#414755', marginBottom: 4 }}>拖拽文件到此处，或点击选择文件</div>
                  <div style={{ fontSize: 12, color: '#A0A5B1' }}>支持 PDF、Word、Excel、图片，单文件最大 20 MB</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#717786', fontWeight: 500, display: 'block', marginBottom: 5 }}>文件类型 <span style={{ color: '#BA1A1A' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    <option value="" disabled>请选择</option>
                    <option>主合作协议</option>
                    <option>保密协议 (NDA)</option>
                    <option>数据处理协议 (DPA)</option>
                    <option>评级报告</option>
                    <option>州营业执照</option>
                    <option>佣金补充协议</option>
                    <option>其他</option>
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#717786', fontWeight: 500, display: 'block', marginBottom: 5 }}>有效期至（可选）</label>
                <input className="input-glass w-full" type="date" style={{ fontSize: 13.5 }} value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#717786', fontWeight: 500, display: 'block', marginBottom: 5 }}>到期提醒（天前）</label>
                <div style={{ position: 'relative' }}>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} defaultValue="30">
                    <option value="90">90 天</option>
                    <option value="60">60 天</option>
                    <option value="30">30 天</option>
                    <option value="0">不提醒</option>
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>取消</button>
              <button
                className="btn-primary"
                disabled={!uploadFile || !uploadType}
                onClick={() => { setUploadSaved(true); setTimeout(() => { setShowUploadModal(false); setUploadSaved(false) }, 1500) }}
              >
                <Upload size={14} />确认上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
