import { useState } from 'react';
import {
  ArrowLeft, Edit2, StopCircle, PlayCircle, Download,
  Building2, MapPin, Globe, Calendar, Package, Users,
  DollarSign, Upload, Eye, Trash2, Clock, CheckCircle, AlertTriangle, FileText,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { insurers, premiumTrendData, marketShareData, formatCurrency, formatPercent } from './data/mockDashboardData';
import { products, channels, documents, changeHistory, contacts } from './data/insurerDetails';
import type { ViewId } from '@/App';
import { useTranslation } from 'react-i18next';
import DisableModal from '@/components/DisableModal';

interface Props {
  carrierId: string;
  navigateTo: (view: ViewId, params?: any) => void;
}

const TABS = [
  { id: 'info', label: 'detail.tabs.info' },
  { id: 'ratings', label: 'detail.tabs.ratings' },
  { id: 'products', label: 'detail.tabs.products' },
  { id: 'channels', label: 'detail.tabs.channels' },
  { id: 'performance', label: 'detail.tabs.performance' },
  { id: 'documents', label: 'detail.tabs.documents' },
  { id: 'history', label: 'detail.tabs.history' },
];

const sectionBg = 'rgba(255,255,255,0.7)';
const sectionBorder = '0.5px solid rgba(193,198,215,0.5)';
const fieldLabel = { fontSize: 12 as const, color: '#717786' as const, fontWeight: 500 as const, marginBottom: 4 };
const fieldValue = { fontSize: 14 as const, color: '#181C23' as const, fontWeight: 500 as const };

const RATING_COLOR: Record<string, string> = {
  'A++': '#1a7a2e', 'A+': '#1a7a2e', 'A': '#0058BC', 'A-': '#0058BC',
  'B++': '#7a5c00', 'B+': '#7a5c00',
};

const lossData = [
  { month: 'Mar', ratio: 61.2 }, { month: 'Apr', ratio: 60.8 }, { month: 'May', ratio: 63.1 },
  { month: 'Jun', ratio: 61.5 }, { month: 'Jul', ratio: 59.8 }, { month: 'Aug', ratio: 62.2 },
];

const DOC_TYPE_COLOR: Record<string, string> = {
  masterAgreement: 'badge-blue',
  nda: 'badge-gray',
  dpa: 'badge-purple',
  ratingReport: 'badge-yellow',
  stateLicense: 'badge-green',
  commissionSupplement: 'badge-orange',
};

export default function CarrierDetail({ carrierId, navigateTo }: Props) {
  const { t, i18n } = useTranslation('insurer');
  const [activeTab, setActiveTab] = useState('info');
  const [showDisable, setShowDisable] = useState(false);
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const findCarrier = (id: string) => insurers.find(i => i.carrierId === id) || insurers[0];
  const carrier = findCarrier(carrierId);

  const carrierProducts = products.filter(p => p.insurerId === carrierId);
  const carrierChannels = channels.filter(c => !c.parentId).slice(0, 5);
  const carrierDocs = documents.filter(d => d.insurerId === carrierId);
  const carrierHistory = changeHistory.filter(h => h.insurerId === carrierId);
  const carrierContacts = contacts.filter(c => c.insurerId === carrierId);
  const channelPremiumTotal = carrierChannels.reduce((s, c) => s + c.totalPremium, 0);

  const coopColors: Record<string, string> = {
    active: '#1a7a2e',
    expiring: '#a05800',
    negotiating: '#0058BC',
    pending: '#0058BC',
    suspended: '#BA1A1A',
    terminated: '#BA1A1A',
  };
  const coopLabels: Record<string, string> = {
    active: 'detail.coop.active',
    expiring: 'detail.coop.expiring',
    negotiating: 'detail.coop.negotiating',
    pending: 'detail.coop.negotiating',
    suspended: 'detail.coop.terminated',
    terminated: 'detail.coop.terminated',
  };
  const coopKey = (carrier.coopStatus ?? carrier.status) as string;
  const coopOrb = coopKey === 'active' ? 'orb-green' : coopKey === 'expiring' ? 'orb-orange' : coopKey === 'pending' || coopKey === 'negotiating' ? 'orb-purple' : 'orb-gray';

  const roleLabel: Record<string, string> = {
    accountManager: t('detail.contacts.roleAccountManager'),
    underwriting: t('detail.contacts.roleUnderwriting'),
    finance: t('detail.contacts.roleFinance'),
    itIntegration: t('detail.contacts.roleIt'),
    compliance: t('detail.contacts.roleCompliance'),
  };
  const docTypeLabel: Record<string, string> = {
    masterAgreement: t('detail.documents.docTypes.master'),
    nda: t('detail.documents.docTypes.nda'),
    dpa: t('detail.documents.docTypes.dpa'),
    ratingReport: t('detail.documents.docTypes.ratingReport'),
    stateLicense: t('detail.documents.docTypes.stateLicense'),
    commissionSupplement: t('detail.documents.docTypes.commission'),
  };
  const productTypeLabel: Record<string, string> = {
    individual: t('detail.products.typeIndividual'),
    group: t('detail.products.typeGroup'),
    voluntary: t('detail.products.typeVoluntary'),
  };
  const channelTypeLabel: Record<string, string> = {
    direct: t('detail.channelTypes.direct'),
    mga: t('detail.channelTypes.mga'),
    broker: t('detail.channelTypes.broker'),
    aggregator: t('detail.channelTypes.aggregator'),
  };
  const tierLabel: Record<string, string> = {
    platinum: t('detail.channels.tierPlatinum'),
    gold: t('detail.channels.tierGold'),
    silver: t('detail.channels.tierSilver'),
  };
  const sectionLabel: Record<string, string> = {
    basic: t('detail.history.sections.basic'),
    rating: t('detail.history.sections.rating'),
    settlement: t('detail.history.sections.settlement'),
    coop: t('detail.history.sections.coop'),
    contact: t('detail.history.sections.contact'),
  };

  const lossItems = [
    t('detail.lossTable.items.auto'),
    t('detail.lossTable.items.home'),
    t('detail.lossTable.items.health'),
    t('detail.lossTable.items.liability'),
    t('detail.lossTable.items.accident'),
  ];

  const formatFileSize = (kb: number): string => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Back + Actions Bar */}
      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
          <ArrowLeft size={15} /> {t('detail.backToList')}
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={14} /> {t('detail.exportPdf')}
          </button>
          {carrier.status !== 'inactive' ? (
            <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => setShowDisable(true)}>
              <StopCircle size={14} /> {t('detail.actions.disable')}
            </button>
          ) : (
            <button className="btn-ghost" style={{ fontSize: 13, color: '#1a7a2e' }} onClick={() => setShowDisable(true)}>
              <PlayCircle size={14} /> {t('detail.actions.enable')}
            </button>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-edit', { carrierId })}>
            <Edit2 size={14} /> {t('detail.edit')}
          </button>
        </div>
      </div>

      {/* Company Header Card */}
      <div className="glass-strong" style={{
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24
      }}>
        {/* Logo Placeholder */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 60%, #60CDFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,88,188,0.28)',
        }}>
          {carrier.shortName.slice(0, 2).toUpperCase()}
        </div>

        {/* Identity */}
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#181C23' }}>{carrier.carrierName}</h1>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: RATING_COLOR[carrier.amBestRating || ''] ?? '#414755',
              background: 'rgba(0,88,188,0.07)',
              padding: '3px 10px',
              borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              AM Best {carrier.amBestRating || '-'}
            </span>
            <span className={`badge ${carrier.status === 'active' ? 'badge-green' : carrier.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
              <span className={`orb ${carrier.status === 'active' ? 'orb-green' : carrier.status === 'pending' ? 'orb-yellow' : 'orb-gray'}`} />
              {carrier.status === 'active' ? t('detail.status.active') : carrier.status === 'pending' ? t('detail.status.pending') : t('detail.status.inactive')}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: '#414755', marginBottom: 16 }}>
            <span className="flex items-center gap-1.5"><Building2 size={13} />NAIC {carrier.naicCode}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} />{carrier.region || '-'}</span>
            <span className="flex items-center gap-1.5"><Globe size={13} />{carrier.website || '-'}</span>
            {carrier.founded && (
              <span className="flex items-center gap-1.5"><Calendar size={13} />{t('detail.foundedIn', { year: carrier.founded })}</span>
            )}
            <span className="flex items-center gap-1.5">
              <span className={`badge ${carrier.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>{carrier.type}</span>
            </span>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: t('detail.kpi.totalPremium'), value: formatCurrency(carrier.revenue ?? 0, true), sub: t('detail.kpi.thisYear') },
              { label: t('detail.kpi.policyCount'), value: (carrier.policyCount ?? 0).toLocaleString(), sub: t('detail.kpi.activePolicies') },
              { label: t('detail.kpi.lossRatio'), value: formatPercent(carrier.lossRatio ?? 0), sub: (carrier.lossRatio ?? 0) > 0.65 ? t('detail.kpi.overThreshold') : t('detail.kpi.normal'), warn: (carrier.lossRatio ?? 0) > 0.65 },
              { label: t('detail.kpi.renewalRate'), value: formatPercent(carrier.renewalRate ?? 0), sub: t('detail.kpi.thisYear') },
              { label: t('detail.kpi.channelCount'), value: String(carrier.channelCount ?? 0), sub: t('detail.kpi.channelUnit') },
              { label: t('detail.kpi.productCount'), value: String(carrier.productCount ?? 0), sub: t('detail.kpi.productUnit') },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(236,237,249,0.6)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? '#BA1A1A' : '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: k.warn ? '#BA1A1A' : '#717786', marginTop: 2 }}>
                  {k.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coop status badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>{t('detail.coopStatus')}</div>
          <div className="flex items-center gap-1.5 justify-end" style={{ marginBottom: 12 }}>
            <span className={`orb ${coopOrb}`} />
            <span style={{ fontSize: 14, fontWeight: 600, color: coopColors[coopKey] ?? '#414755' }}>
              {coopLabels[coopKey] ? t(coopLabels[coopKey]) : '-'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>{t('detail.contractExpiry')}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{carrier.contractExpiry || '-'}</div>
          {coopKey === 'expiring' && carrier.contractExpiry && (
            <div style={{ fontSize: 11, color: '#a05800', marginTop: 4 }}>
              {t('detail.daysRemaining', { days: Math.round((new Date(carrier.contractExpiry).getTime() - Date.now()) / 86400000) })}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 24px' }}>
          {TABS.map(tab => (
            <div key={tab.id} className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {t(tab.label)}
              {tab.id === 'history' && carrierHistory.length > 0 && (
                <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{carrierHistory.length}</span>
              )}
              {tab.id === 'documents' && carrierDocs.some(d => d.status !== 'valid') && (
                <span className="badge badge-yellow" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>!</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ─── Basic Info Tab ─── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Basic Info */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} style={{ color: '#0058BC' }} />{t('detail.sections.basicInfo')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t('detail.fields.fullName'), value: carrier.carrierName, mono: false },
                      { label: t('detail.fields.shortName'), value: carrier.shortName, mono: false },
                      { label: t('detail.fields.naicCode'), value: carrier.naicCode, mono: true },
                      { label: t('detail.fields.companyType'), value: carrier.type, mono: false },
                      { label: t('detail.fields.foundedYear'), value: carrier.founded ? String(carrier.founded) : '-', mono: false },
                      { label: t('detail.fields.website'), value: carrier.website || '-', mono: false },
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
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#0058BC' }} />{t('detail.sections.hq')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t('detail.fields.hqAddress'), value: carrier.state ? `${carrier.state}, US` : '-' },
                      { label: t('detail.fields.state'), value: carrier.state || '-' },
                      { label: t('detail.fields.region'), value: carrier.region || 'National' },
                      { label: t('detail.fields.businessLines'), value: carrier.lines?.join(', ') || '-' },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={fieldLabel}>{f.label}</div>
                        <div style={fieldValue}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Settlement */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={14} style={{ color: '#0058BC' }} />{t('detail.sections.settlement')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: t('detail.fields.settlementCycle'), value: carrier.settlementCycle === 'Monthly' ? t('detail.settlement.monthly') : t('detail.settlement.quarterly') },
                      { label: t('detail.fields.billingFormat'), value: t('detail.settlement.apiPull') },
                      { label: t('detail.fields.billingDueDate'), value: t('detail.settlement.dueDay25') },
                      { label: t('detail.fields.paymentCycle'), value: t('detail.settlement.paymentTerm') },
                      { label: t('detail.fields.currency'), value: 'USD' },
                      { label: t('detail.fields.premiumCollection'), value: t('detail.settlement.premiumCollectionValue') },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={fieldLabel}>{f.label}</div>
                        <div style={fieldValue}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contacts */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} style={{ color: '#0058BC' }} />{t('detail.sections.contact')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {carrierContacts.slice(0, 4).map(c => (
                      <div key={c.contactId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>{roleLabel[c.role] ?? c.role} · {c.title}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, color: '#414755' }}>{c.email}</div>
                          <div style={{ fontSize: 11.5, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{c.phone}</div>
                        </div>
                      </div>
                    ))}
                    {carrierContacts.length > 4 && (
                      <button className="btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-start' }}>
                        {t('detail.contacts.viewAll', { count: carrierContacts.length })}
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ─── Financial Ratings Tab ─── */}
          {activeTab === 'ratings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.ratings.current')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { agency: 'AM Best', rating: carrier.amBestRating, date: '2026-07-15', type: 'Financial Strength Rating' },
                    { agency: 'S&P Global', rating: carrier.spRating, date: '2026-01-10', type: 'Insurer Financial Strength' },
                    { agency: "Moody's", rating: carrier.moodysRating, date: '2025-12-01', type: 'Insurance Financial Strength' },
                    { agency: 'Fitch', rating: carrier.fitchRating, date: '2025-11-15', type: 'Insurer Financial Strength' },
                  ].map(r => (
                    <div key={r.agency} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(241,243,254,0.7)', borderRadius: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.agency}</div>
                        <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{r.type}</div>
                        <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{t('detail.ratings.updatedAt', { date: r.date })}</div>
                      </div>
                      <div style={{
                        fontSize: 28, fontWeight: 800, color: RATING_COLOR[r.rating || ''] ?? '#0058BC',
                        fontFamily: "'JetBrains Mono', monospace",
                        background: 'rgba(52,199,89,0.08)',
                        padding: '6px 16px', borderRadius: 10,
                      }}>
                        {r.rating || t('detail.ratings.notRated')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{t('detail.ratings.lossTrendTitle')}</div>
                  <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 14 }}>{t('detail.ratings.lossTrendSub')}</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lossData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} domain={[55, 70]} tickFormatter={(v: number) => `${v}%`} width={36} />
                      <Tooltip formatter={(v: any) => [`${v}%`, t('detail.kpi.lossRatio')]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="ratio" stroke="#0058BC" strokeWidth={2} dot={{ r: 4, fill: '#0058BC' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { label: t('detail.ratings.lossCurrent'), value: formatPercent(carrier.lossRatio ?? 0), color: (carrier.lossRatio ?? 0) > 0.65 ? '#BA1A1A' : '#1a7a2e' },
                      { label: t('detail.ratings.lossIndustry'), value: '63.5%', color: '#717786' },
                      { label: t('detail.ratings.lossTarget'), value: '60.0%', color: '#0058BC' },
                    ].map(m => (
                      <div key={m.label} style={{ flex: 1, background: 'rgba(236,237,249,0.7)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>{t('detail.ratings.healthTitle')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: t('detail.ratings.healthSolvency'), value: '312%', status: 'good', threshold: '150%' },
                      { label: t('detail.ratings.healthCombined'), value: '97.8%', status: 'ok', threshold: '100%' },
                      { label: t('detail.ratings.healthRoi'), value: '4.2%', status: 'good', threshold: '3.5%' },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#181C23' }}>{m.label}</div>
                          <div style={{ fontSize: 11, color: '#717786' }}>{t('detail.ratings.regThreshold', { value: m.threshold })}</div>
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

          {/* ─── Channels Tab ─── */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>
                  {t('detail.channels.countPre')}<strong style={{ color: '#181C23' }}>{carrier.channelCount ?? carrierChannels.length}</strong>{t('detail.channels.countPost')}
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('detail.channelTable.name')}</th>
                    <th>{t('detail.channelTable.type')}</th>
                    <th>{t('detail.channelTable.tier')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.channelTable.contribPremium')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.channelTable.premiumShare')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.channelTable.commissionRate')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.channelTable.agreementDate')}</th>
                    <th>{t('detail.channelTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierChannels.map(channel => (
                    <tr key={channel.channelId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{channel.name}</div>
                        <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{channel.npnCode}</div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{channelTypeLabel[channel.type] ?? channel.type}</span>
                      </td>
                      <td>
                        <span className={`badge ${channel.tier === 'platinum' ? 'badge-purple' : channel.tier === 'gold' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {tierLabel[channel.tier] ?? channel.tier}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                        {formatCurrency(channel.totalPremium, true)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {channelPremiumTotal > 0 ? `${((channel.totalPremium / channelPremiumTotal) * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}><span className="font-data">{(channel.commissionRate * 100).toFixed(1)}%</span></td>
                      <td>{channel.agreementDate}</td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <span className={`orb ${channel.status === 'active' ? 'orb-green' : 'orb-yellow'}`} />
                          <span style={{ fontSize: 12.5 }}>
                            {channel.status === 'active' ? t('detail.channelStatus.active') : channel.status === 'pending' ? t('detail.channelStatus.pending') : t('detail.channelStatus.inactive')}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Documents Tab ─── */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{t('detail.documents.count', { n: carrierDocs.length })}</h3>
                <button className="btn-secondary">
                  <Upload size={14} /> {t('detail.documents.upload')}
                </button>
              </div>
              {carrierDocs.some(d => d.status !== 'valid') && (
                <div style={{ background: 'rgba(255,149,0,0.08)', border: '0.5px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, color: '#7a5c00' }}>
                    {t('detail.documents.alert', { count: carrierDocs.filter(d => d.status !== 'valid').length })}
                  </span>
                </div>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('detail.docTable.name')}</th>
                    <th>{t('detail.docTable.type')}</th>
                    <th>{t('detail.docTable.status')}</th>
                    <th>{t('detail.docTable.issueDate')}</th>
                    <th>{t('detail.docTable.expiryDate')}</th>
                    <th>{t('detail.docTable.size')}</th>
                    <th>{t('detail.docTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierDocs.map(doc => (
                    <tr key={doc.documentId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} style={{ color: '#0058BC' }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{lang === 'en' ? doc.nameEn : doc.name}</div>
                            <div style={{ fontSize: 11.5, color: '#717786' }}>ID: {doc.documentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${DOC_TYPE_COLOR[doc.type] || 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {docTypeLabel[doc.type] ?? doc.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${doc.status === 'valid' ? 'badge-green' : doc.status === 'expiring' ? 'badge-yellow' : 'badge-red'}`}>
                          {doc.status === 'valid' ? t('detail.docStatus.valid') : doc.status === 'expiring' ? t('detail.docStatus.expiring') : t('detail.docStatus.expired')}
                        </span>
                      </td>
                      <td>{doc.issueDate}</td>
                      <td>{doc.expiryDate ?? '-'}</td>
                      <td><span className="font-data">{formatFileSize(doc.fileSize)}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost" style={{ padding: 5 }} title={t('detail.documents.preview')}><Eye size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title={t('detail.documents.download')}><Download size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} title={t('detail.documents.delete')}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Change History Tab ─── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>{t('detail.history.count', { count: carrierHistory.length })}</div>
                <div className="flex gap-2">
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>{t('detail.history.allFields')}</option>
                    <option>{t('detail.history.sections.basic')}</option>
                    <option>{t('detail.history.sections.rating')}</option>
                    <option>{t('detail.history.sections.settlement')}</option>
                  </select>
                  <select className="input-glass" style={{ fontSize: 12.5 }}>
                    <option>{t('detail.history.allOperators')}</option>
                    <option>Liu Yang</option>
                    <option>Zhang Wei</option>
                  </select>
                  <button className="btn-ghost" style={{ fontSize: 12.5 }}><Download size={13} />{t('detail.history.exportLog')}</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {carrierHistory.map((rec, idx) => (
                  <div key={rec.historyId} style={{ display: 'flex', gap: 16, paddingBottom: 20 }}>
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
                      {idx < carrierHistory.length - 1 && (
                        <div style={{ width: 1.5, flex: 1, background: 'rgba(193,198,215,0.5)', marginTop: 4 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{rec.field}</span>
                        <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{sectionLabel[rec.section] ?? rec.section}</span>
                        <span style={{ fontSize: 12, color: '#717786', marginLeft: 'auto' }}>{rec.changedAt}</span>
                      </div>

                      {/* Before / after */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ flex: 1, background: 'rgba(186,26,26,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(186,26,26,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#BA1A1A', fontWeight: 600, marginBottom: 3 }}>{t('detail.history.changeBefore')}</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.oldValue ?? '-'}</div>
                        </div>
                        <div style={{ fontSize: 16, color: '#C1C6D7' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(52,199,89,0.06)', borderRadius: 8, padding: '8px 12px', border: '0.5px solid rgba(52,199,89,0.15)' }}>
                          <div style={{ fontSize: 10.5, color: '#1a7a2e', fontWeight: 600, marginBottom: 3 }}>{t('detail.history.changeAfter')}</div>
                          <div style={{ fontSize: 13, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rec.newValue}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#717786' }}>
                        <span style={{ fontWeight: 500, color: '#414755' }}>{rec.operator}</span>
                        <span style={{ marginLeft: 4 }}>({rec.operatorRole})</span>
                        {rec.reason && <span style={{ marginLeft: 8 }}>· {lang === 'en' ? rec.reasonEn : rec.reason}</span>}
                        {rec.approvedBy && (
                          <span style={{ marginLeft: 8 }}>{t('detail.history.approvedByPrefix')}<span style={{ color: '#0058BC' }}>{rec.approvedBy}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Products Tab ─── */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 14, color: '#717786' }}>
                  {t('detail.products.countPre')}<strong style={{ color: '#181C23' }}>{carrier.productCount ?? carrierProducts.length}</strong>{t('detail.products.countPost')}
                </div>
                <button className="btn-primary" style={{ fontSize: 13 }}>
                  <Package size={14} />{t('detail.products.addProduct')}
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('detail.productTable.name')}</th>
                    <th>{t('detail.productTable.code')}</th>
                    <th>{t('detail.productTable.lob')}</th>
                    <th>{t('detail.productTable.type')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.productTable.premium')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.kpi.policyCount')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.productTable.lossRatio')}</th>
                    <th>{t('detail.productTable.status')}</th>
                    <th>{t('detail.productTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierProducts.map(product => (
                    <tr key={product.productId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{product.name}</div>
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{lang === 'en' ? product.sublineEn : product.subline}</div>
                      </td>
                      <td><span className="font-data">{product.code}</span></td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{product.lob}</span></td>
                      <td>{productTypeLabel[product.type] ?? product.type}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>
                        {formatCurrency(product.premium, true)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {product.policyCount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-data" style={{ color: product.lossRatio > 0.65 ? '#BA1A1A' : '#1a7a2e' }}>
                          {formatPercent(product.lossRatio)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                          {product.status === 'active' ? t('detail.productStatus.active') : t('detail.productStatus.inactive')}
                        </span>
                      </td>
                      <td>
                        <button className="btn-ghost" style={{ padding: 5 }}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Performance Tab ─── */}
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Revenue Trend */}
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} style={{ color: '#0058BC' }} />{t('detail.performance.premiumTrend')}
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={premiumTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + 'M'} width={42} />
                      <Tooltip formatter={(v: any) => [v + 'M', t('detail.performance.premium')]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="newBiz" stroke="#34C759" strokeWidth={2} dot={{ r: 3, fill: '#34C759' }} name={t('detail.performance.newBiz')} />
                      <Line type="monotone" dataKey="renewal" stroke="#0058BC" strokeWidth={2} dot={{ r: 3, fill: '#0058BC' }} name={t('detail.performance.renewal')} />
                      <Line type="monotone" dataKey="premium" stroke="#9E3D00" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#9E3D00' }} name={t('detail.performance.total')} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Core Business KPI grid (V1.3) */}
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.kpi.title')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: t('detail.kpi.premium'), value: formatCurrency(carrier.revenue ?? 0, true), change: '+12.4%', up: true },
                    { label: t('detail.kpi.avgPremium'), value: formatCurrency((carrier.revenue ?? 0) / (carrier.policyCount || 1), true), change: '+3.8%', up: true },
                    { label: t('detail.kpi.newBizShare'), value: '28.4%', change: '+2.1pp', up: true },
                    { label: t('detail.kpi.lossRatio'), value: formatPercent(carrier.lossRatio ?? 0), change: '-1.2pp', up: true },
                    { label: t('detail.kpi.renewal'), value: formatPercent(carrier.renewalRate ?? 0), change: '+0.6pp', up: true },
                    { label: t('detail.kpi.commission'), value: formatCurrency(carrier.commissionIncome ?? 0, true), change: '+14.2%', up: true },
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

              {/* Channel Contribution + Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Channel Market Share */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.channelContribution')}</div>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marketShareData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(193,198,215,0.3)" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#717786' }} hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#717786' }} width={72} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                        <Tooltip cursor={{ fill: 'rgba(0,88,188,0.05)' }} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                        {marketShareData.map((m, i) => (
                          <Cell key={i} fill={m.color} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Performance Metrics */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.metricsTitle')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: t('detail.performance.metrics.ytdPremium'), value: '$219.2M', trend: '+12.8%', positive: true },
                      { label: t('detail.performance.metrics.newPolicyGrowth'), value: '+18.5%', trend: '+8.2%', positive: true },
                      { label: t('detail.performance.metrics.avgPolicyValue'), value: '$1,458', trend: '-3.1%', positive: false },
                      { label: t('detail.performance.metrics.retentionRate'), value: '91.8%', trend: '+4.5%', positive: true },
                      { label: t('detail.performance.metrics.cac'), value: '$182', trend: '-12.5%', positive: true },
                    ].map(k => (
                      <div key={k.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 12.5, color: '#181C23', fontWeight: 500 }}>{k.label}</div>
                          <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{t('detail.performance.yoy')}{k.positive ? '✓' : '✗'}{k.trend}</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: k.positive ? '#1a7a2e' : '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>
                          {k.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Loss Ratio Ranking */}
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.lossRanking')}</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('detail.lossTable.name')}</th>
                      <th style={{ textAlign: 'right' }}>{t('detail.lossTable.totalPremium')}</th>
                      <th style={{ textAlign: 'right' }}>{t('detail.lossTable.lossAmount')}</th>
                      <th style={{ textAlign: 'right' }}>{t('detail.lossTable.lossRatio')}</th>
                      <th>{t('detail.lossTable.riskLevel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lossItems.map((productName, i) => (
                      <tr key={i}>
                        <td><span style={{ fontWeight: 500 }}>{productName}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${(Math.random() * 50).toFixed(1)}M</td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${(Math.random() * 30).toFixed(1)}M</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: i === 0 ? '#BA1A1A' : i <= 2 ? '#FF9500' : '#34C759'
                          }}>{(55 + Math.random() * 15).toFixed(1)}%</span>
                        </td>
                        <td>
                          <span className={`badge ${i === 0 ? 'badge-red' : i <= 2 ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 11 }}>
                            {i === 0 ? t('detail.risk.high') : i <= 2 ? t('detail.risk.medium') : t('detail.risk.low')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

        </div>
      </div>

      {showDisable && (
        <DisableModal
          carrierId={carrier.carrierId}
          onClose={() => setShowDisable(false)}
          onConfirm={() => setShowDisable(false)}
        />
      )}
    </div>
  );
}
