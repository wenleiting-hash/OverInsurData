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
import { useLang } from '../i18n'

interface Props {
  insurerId: string
  navigateTo: (view: ViewId, params?: { insurerId?: string; formMode?: string }) => void
  onDisable?: (id: string) => void
}

const TABS = [
  { id: 'info' },
  { id: 'ratings' },
  { id: 'products' },
  { id: 'channels' },
  { id: 'performance' },
  { id: 'documents' },
  { id: 'history' },
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
  masterAgreement: 'badge-blue',
  nda: 'badge-gray',
  dpa: 'badge-purple',
  ratingReport: 'badge-yellow',
  stateLicense: 'badge-green',
  commissionSupplement: 'badge-orange',
}

export default function InsurerDetail({ insurerId, navigateTo, onDisable }: Props) {
  const { lang, t } = useLang()
  const [activeTab, setActiveTab] = useState('info')
  const ins = insurers.find(i => i.id === insurerId) ?? insurers[0]
  const insProducts = products.filter(p => p.insurerId === insurerId)
  const insChannels = channels.filter(c => !c.parentId).slice(0, 5)
  const insHistory = changeHistory.filter(c => c.insurerId === insurerId)
  const insDocs = documents.filter(d => d.insurerId === insurerId)
  const insContacts = contacts.filter(c => c.insurerId === insurerId)

  const tabLabel: Record<string, string> = {
    info: t.insTabInfo,
    ratings: t.insTabRatings,
    products: t.insTabProducts,
    channels: t.insTabChannels,
    performance: t.insTabPerformance,
    documents: t.insTabDocuments,
    history: t.insTabHistory,
  }

  const coopColors: Record<string, string> = { active: '#1a7a2e', expiring: '#a05800', negotiating: '#0058BC', terminated: '#BA1A1A' }
  const coopLabels: Record<string, string> = { active: t.insCoopActive, expiring: t.insCoopExpiring, negotiating: t.insCoopNegotiating, terminated: t.insCoopTerminated }
  const roleLabel: Record<string, string> = {
    accountManager: t.insRoleAccountManager,
    underwriting: t.insRoleUnderwriting,
    finance: t.insRoleFinance,
    itIntegration: t.insRoleIt,
    compliance: t.insRoleCompliance,
  }
  const docTypeLabel: Record<string, string> = {
    masterAgreement: t.insDocTypeMaster,
    nda: t.insDocTypeNda,
    dpa: t.insDocTypeDpa,
    ratingReport: t.insDocTypeRatingReport,
    stateLicense: t.insDocTypeStateLicense,
    commissionSupplement: t.insDocTypeCommission,
  }
  const sectionLabel: Record<string, string> = {
    basic: t.insSecChangeBasic,
    rating: t.insSecChangeRating,
    settlement: t.insSecChangeSettlement,
    coop: t.insSecChangeCoop,
    contact: t.insSecChangeContact,
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back + actions bar */}
      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
          <ArrowLeft size={15} /> {t.insBackToList}
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" style={{ fontSize: 13 }}><Download size={14} />{t.insExportPdf}</button>
          {ins.status === 'active'
            ? <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => onDisable ? onDisable(insurerId) : undefined}>
                <StopCircle size={14} />{t.insDisable}
              </button>
            : <button className="btn-ghost" style={{ fontSize: 13, color: '#1a7a2e' }} onClick={() => onDisable ? onDisable(insurerId) : undefined}>
                <PlayCircle size={14} />{t.insEnable}
              </button>
          }
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-edit', { insurerId })}>
            <Edit2 size={14} />{t.insEdit}
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
              {ins.status === 'active' ? t.insStatusActive : ins.status === 'pending' ? t.insStatusPending : t.insStatusInactive}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: '#414755', marginBottom: 16 }}>
            <span className="flex items-center gap-1.5"><Building2 size={13} />NAIC {ins.naicCode}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} />{ins.headquarters}</span>
            <span className="flex items-center gap-1.5"><Globe size={13} />{ins.website}</span>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{t.insFoundedIn(ins.founded)}</span>
            <span className="flex items-center gap-1.5">
              <span className={`badge ${ins.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>{ins.type}</span>
            </span>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: t.insColPremium, value: formatCurrency(ins.totalPremium, true), sub: t.insSubThisYear },
              { label: t.insColPolicies, value: ins.policyCount.toLocaleString(), sub: t.insSubActivePolicies },
              { label: t.insColLossRatio, value: formatPercent(ins.lossRatio), sub: ins.lossRatio > 0.65 ? t.insSubOverThreshold : t.insSubNormal, warn: ins.lossRatio > 0.65 },
              { label: t.insColRenewal, value: formatPercent(ins.renewalRate), sub: t.insSubThisYear },
              { label: t.insTabChannels, value: ins.channelCount.toString(), sub: t.insSubChannels },
              { label: t.insTabProducts, value: ins.productCount.toString(), sub: t.insSubProducts },
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
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>{t.insColCoopStatus}</div>
          <div className="flex items-center gap-1.5 justify-end" style={{ marginBottom: 12 }}>
            <span className={`orb ${ins.coopStatus === 'active' ? 'orb-green' : ins.coopStatus === 'expiring' ? 'orb-orange' : 'orb-purple'}`} />
            <span style={{ fontSize: 14, fontWeight: 600, color: coopColors[ins.coopStatus] }}>{coopLabels[ins.coopStatus]}</span>
          </div>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>{t.insContractExpiry}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{ins.contractExpiry}</div>
          {ins.coopStatus === 'expiring' && (
            <div style={{ fontSize: 11, color: '#a05800', marginTop: 4 }}>
              {t.insDaysRemaining(Math.round((new Date(ins.contractExpiry).getTime() - Date.now()) / 86400000))}
            </div>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 24px' }}>
          {TABS.map(tab => (
            <div key={tab.id} className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tabLabel[tab.id]}
              {tab.id === 'history' && insHistory.length > 0 && (
                <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{insHistory.length}</span>
              )}
              {tab.id === 'documents' && insDocs.some(d => d.status !== 'valid') && (
                <span className="badge badge-yellow" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>!</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '24px' }}>

          {/* ─── Basic info ─── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Basic */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} style={{ color: '#0058BC' }} />{t.insSecBasic}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t.insFFullName, value: ins.name, mono: false },
                      { label: t.insFShortName, value: ins.shortName, mono: false },
                      { label: t.insFNaic, value: ins.naicCode, mono: true },
                      { label: t.insFType, value: ins.type, mono: false },
                      { label: t.insFFounded, value: ins.founded.toString(), mono: false },
                      { label: t.insFWebsite, value: ins.website, mono: false },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={fieldLabel}>{f.label}</div>
                        <div style={{ ...fieldValue, fontFamily: f.mono ? "'JetBrains Mono', monospace" : undefined }}>
                          {f.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* HQ */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#0058BC' }} />{t.insSecHq}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t.insFHqAddress, value: ins.headquarters },
                      { label: t.insFState, value: ins.state },
                      { label: t.insFRegion, value: ins.region },
                      { label: t.insFLines, value: ins.lines.join(', ') },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={fieldLabel}>{f.label}</div>
                        <div style={fieldValue}>{f.value}</div>
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
                    <DollarSign size={14} style={{ color: '#0058BC' }} />{t.insSecSettlement}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t.insFSettlementCycle, value: ins.settlementCycle === 'Monthly' ? t.insSettlementMonthlyFull : t.insSettlementQuarterlyFull },
                      { label: t.insFBillingFormat, value: t.insBillingApiValue },
                      { label: t.insFBillCutoff, value: t.insBillCutoffValue },
                      { label: t.insFPaymentTerm, value: t.insPaymentTermValue },
                      { label: t.insFCurrency, value: 'USD' },
                      { label: t.insFPremiumCollection, value: t.insPremiumCollectionValue },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={fieldLabel}>{f.label}</div>
                        <div style={fieldValue}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contacts */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} style={{ color: '#0058BC' }} />{t.insSecContacts}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insContacts.slice(0, 4).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>{roleLabel[c.role]} · {c.title}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, color: '#414755' }}>{c.email}</div>
                          <div style={{ fontSize: 11.5, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{c.phone}</div>
                        </div>
                      </div>
                    ))}
                    {insContacts.length > 4 && (
                      <button className="btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-start' }}>
                        {t.insViewAllContacts(insContacts.length)}
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ─── Financial ratings ─── */}
          {activeTab === 'ratings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.insSecRatings}</div>
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
                          <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{t.insUpdatedAt(r.date)}</div>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{t.insSecLossTrend}</div>
                  <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 14 }}>{t.insLossTrendSub}</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lossData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} domain={[55, 70]} tickFormatter={v => `${v}%`} width={36} />
                      <Tooltip formatter={(v: any) => [`${v}%`, t.insColLossRatio]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="ratio" stroke="#0058BC" strokeWidth={2} dot={{ r: 4, fill: '#0058BC' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { label: t.insLossCurrent, value: formatPercent(ins.lossRatio), color: ins.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' },
                      { label: t.insLossIndustry, value: '63.5%', color: '#717786' },
                      { label: t.insLossTarget, value: '60.0%', color: '#0058BC' },
                    ].map(m => (
                      <div key={m.label} style={{ flex: 1, background: 'rgba(236,237,249,0.7)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>{t.insSecHealth}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: t.insHealthSolvency, value: '312%', status: 'good', threshold: '150%' },
                      { label: t.insHealthCombined, value: '97.8%', status: 'ok', threshold: '100%' },
                      { label: t.insHealthRoi, value: '4.2%', status: 'good', threshold: '3.5%' },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#181C23' }}>{m.label}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>{t.insRegThreshold(m.threshold)}</div>
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

          {/* ─── Products ─── */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>{t.insProductsCountPre}<strong style={{ color: '#181C23' }}>{ins.productCount}</strong>{t.insProductsCountPost}</div>
                <button className="btn-primary" style={{ fontSize: 13 }}>
                  <Package size={14} />{t.insAddProduct}
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.insColProductName}</th>
                    <th>{t.insColProductCode}</th>
                    <th>{t.insColLine}</th>
                    <th>{t.insColPType}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColPremiumShort}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColPolicies}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColLossRatio}</th>
                    <th>{t.insColStatus}</th>
                    <th>{t.insColActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {(insProducts.length > 0 ? insProducts : products.slice(0, 3)).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</td>
                      <td><span className="font-data" style={{ fontSize: 12, background: 'rgba(236,237,249,0.8)', padding: '2px 7px', borderRadius: 5 }}>{p.code}</span></td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11.5 }}>{p.line}</span></td>
                      <td style={{ fontSize: 13 }}>{p.type === 'Individual' ? t.insTypeIndividual : t.insTypeGroup}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>{formatCurrency(p.premium, true)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{p.policyCount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: p.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>{formatPercent(p.lossRatio)}</span>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'on-sale' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {p.status === 'on-sale' ? t.insProdOnSale : p.status === 'pending' ? t.insStatusPending : t.insProdPaused}
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

          {/* ─── Channels ─── */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>{t.insChannelsCountPre}<strong style={{ color: '#181C23' }}>{ins.channelCount}</strong>{t.insChannelsCountPost}</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.insColChannelName}</th>
                    <th>{t.insColChannelType}</th>
                    <th>{t.insColTier}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColContribPremium}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColPremiumShare}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColLossRatio}</th>
                    <th style={{ textAlign: 'right' }}>{t.insColRenewal}</th>
                    <th>{t.insColStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {insChannels.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{c.npnCode}</div>
                      </td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{c.type === 'Independent Agency' ? t.insChanIndependent : c.type}</span></td>
                      <td><span className={`badge ${c.tier === 'Platinum' ? 'badge-purple' : c.tier === 'Gold' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>{c.tier === 'Platinum' ? t.insTierPlatinum : c.tier === 'Gold' ? t.insTierGold : t.insTierSilver}</span></td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>{formatCurrency(c.totalPremium * 0.18, true)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{(Math.random() * 15 + 5).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: c.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>{formatPercent(c.lossRatio)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{formatPercent(c.renewalRate)}</td>
                      <td><span className="flex items-center gap-1.5"><span className="orb orb-green" /><span style={{ fontSize: 12 }}>{t.insChanActive}</span></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Performance ─── */}
          {activeTab === 'performance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{t.insPerfTrendTitle}</div>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 12 }}>{t.insPerfTrendSub}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={premiumTrendData.slice(-6).map(d => ({ ...d, insurer: (d.premium * 0.19).toFixed(0) }))} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} width={44} />
                    <Tooltip formatter={(v: any) => [`$${v}M`, t.insColPremiumShort]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="insurer" fill="#0058BC" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.insSecKpi}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: t.insPerfPremium, value: formatCurrency(ins.totalPremium, true), change: '+12.4%', up: true },
                    { label: t.insPerfAvgPremium, value: formatCurrency(ins.totalPremium / ins.policyCount, true), change: '+3.8%', up: true },
                    { label: t.insPerfNewBizShare, value: '28.4%', change: '+2.1pp', up: true },
                    { label: t.insPerfLossRatio, value: formatPercent(ins.lossRatio), change: '-1.2pp', up: true },
                    { label: t.insPerfRenewal, value: formatPercent(ins.renewalRate), change: '+0.6pp', up: true },
                    { label: t.insPerfCommission, value: formatCurrency(ins.commissionIncome, true), change: '+14.2%', up: true },
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

          {/* ─── Documents ─── */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>{t.insDocsCount(insDocs.length)}</div>
                <button className="btn-primary" style={{ fontSize: 13 }}><Upload size={14} />{t.insUploadDoc}</button>
              </div>
              {insDocs.some(d => d.status !== 'valid') && (
                <div style={{ background: 'rgba(255,149,0,0.08)', border: '0.5px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, color: '#7a5c00' }}>{t.insDocsAlert(insDocs.filter(d => d.status !== 'valid').length)}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insDocs.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.7)', border: sectionBorder, borderRadius: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} style={{ color: '#0058BC' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'en' ? doc.nameEn : doc.name}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>
                        <span className={`badge ${DOC_TYPE_COLOR[doc.type] ?? 'badge-gray'}`} style={{ fontSize: 10.5, marginRight: 8 }}>{docTypeLabel[doc.type]}</span>
                        {doc.size} · {t.insUploadedInfo(doc.uploadedAt, doc.uploadedBy)}
                        {doc.expiry && t.insValidUntil(doc.expiry)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'expiring' && (
                        <span className="badge badge-yellow" style={{ fontSize: 11 }}><AlertTriangle size={10} />{t.insDocExpiring}</span>
                      )}
                      {doc.status === 'expired' && (
                        <span className="badge badge-red" style={{ fontSize: 11 }}>{t.insDocExpired}</span>
                      )}
                      <button className="btn-ghost" style={{ padding: 6 }}><Eye size={14} /></button>
                      <button className="btn-ghost" style={{ padding: 6 }}><Download size={14} /></button>
                      <button className="btn-ghost" style={{ padding: 6, color: '#BA1A1A' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {insDocs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#717786', fontSize: 14 }}>
                    {t.insNoDocs}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Change history ─── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>{t.insHistoryCount(insHistory.length)}</div>
                <div className="flex gap-2">
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>{t.insHistAllFields}</option>
                    <option>{t.insSecChangeBasic}</option>
                    <option>{t.insSecChangeRating}</option>
                    <option>{t.insSecChangeSettlement}</option>
                  </select>
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>{t.insHistAllOperators}</option>
                    <option>Liu Yang</option>
                    <option>Zhang Wei</option>
                  </select>
                  <button className="btn-ghost" style={{ fontSize: 12.5 }}><Download size={13} />{t.insExportLog}</button>
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
                        <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{sectionLabel[rec.section]}</span>
                        <span style={{ fontSize: 12, color: '#717786', marginLeft: 'auto' }}>{rec.timestamp}</span>
                      </div>

                      {/* Before / after */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ flex: 1, background: 'rgba(186,26,26,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(186,26,26,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#BA1A1A', fontWeight: 600, marginBottom: 3 }}>{t.insChangeBefore}</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.oldValue}</div>
                        </div>
                        <div style={{ fontSize: 16, color: '#C1C6D7' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(52,199,89,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(52,199,89,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#1a7a2e', fontWeight: 600, marginBottom: 3 }}>{t.insChangeAfter}</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.newValue}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#717786' }}>
                        <span style={{ fontWeight: 500, color: '#414755' }}>{rec.operator}</span>
                        <span style={{ marginLeft: 4 }}>({rec.operatorRole})</span>
                        {rec.reason && <span style={{ marginLeft: 8 }}>· {lang === 'en' ? rec.reasonEn : rec.reason}</span>}
                        {rec.approvedBy && (
                          <span style={{ marginLeft: 8 }}>{t.insApprovedByPrefix}<span style={{ color: '#0058BC' }}>{rec.approvedBy}</span></span>
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
