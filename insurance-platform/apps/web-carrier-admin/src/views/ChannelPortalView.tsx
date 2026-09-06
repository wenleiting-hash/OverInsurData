import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid, BookOpen, MessageSquare, AlertTriangle, Clock, FileSignature,
  FileEdit, Download, Plus, Eye, Bell, DollarSign, ChevronRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (aligned to Figma V1.3 design system)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  text: '#181C23',
  muted: '#717786',
  mutedLight: '#A0A5B4',
  soft: '#414755',
  primary: '#0058BC',
  primaryLight: 'rgba(0,88,188,0.09)',
  primaryBorder: 'rgba(0,88,188,0.2)',
  border: 'rgba(193,198,215,0.38)',
  borderMid: 'rgba(193,198,215,0.55)',
  green: '#1a7a2e',
  greenBg: 'rgba(52,199,89,0.12)',
  red: '#BA1A1A',
  redBg: 'rgba(186,26,26,0.08)',
  amber: '#B06000',
  amberBg: 'rgba(255,159,10,0.12)',
  blue2: '#0058BC',
  blue2Bg: 'rgba(0,88,188,0.08)',
};

const TH = {
  padding: '8px 12px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700,
  color: C.mutedLight, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`,
  whiteSpace: 'nowrap' as const,
};
const TD = {
  padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`,
  verticalAlign: 'middle' as const, fontSize: 12.5,
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — aligned with Figma prototype V1.3
// ─────────────────────────────────────────────────────────────────────────────
const FILES = [
  { id: 'f1', nameKey: 'portal2.files.f1', categoryKey: 'portal2.files.catProduct', format: 'PDF', size: '4.2 MB', updated: '2026-08-01' },
  { id: 'f2', nameKey: 'portal2.files.f2', categoryKey: 'portal2.files.catRate', format: 'XLSX', size: '1.8 MB', updated: '2026-08-15' },
  { id: 'f3', nameKey: 'portal2.files.f3', categoryKey: 'portal2.files.catForm', format: 'DOCX', size: '320 KB', updated: '2026-07-22' },
  { id: 'f4', nameKey: 'portal2.files.f4', categoryKey: 'portal2.files.catCompliance', format: 'PDF', size: '6.5 MB', updated: '2026-06-30' },
  { id: 'f5', nameKey: 'portal2.files.f5', categoryKey: 'portal2.files.catGuide', format: 'PDF', size: '2.1 MB', updated: '2026-06-12' },
];

const TICKETS = [
  { id: 'TK-2026-0881', subjectKey: 'portal2.tickets.t1', priority: 'high', status: 'processing', created: '2026-08-29', reply: '2026-08-30' },
  { id: 'TK-2026-0867', subjectKey: 'portal2.tickets.t2', priority: 'medium', status: 'replied', created: '2026-08-26', reply: '2026-08-27' },
  { id: 'TK-2026-0852', subjectKey: 'portal2.tickets.t3', priority: 'low', status: 'resolved', created: '2026-08-20', reply: '2026-08-21' },
];

// Free-text portal content: zh byte-identical to prototype, parallel en values
const ANNOUNCEMENTS = [
  { id: 1, typeKey: 'portal2.annc.typeImportant', zh: '2026 Q3 佣金方案已更新', en: '2026 Q3 Commission Plan Updated', date: '2026-08-28', type: 'important', color: C.red, read: false },
  { id: 2, typeKey: 'portal2.annc.typeNotice', zh: '汽车险费率调整通知 — 加州地区', en: 'Auto Rate Adjustment Notice — California', date: '2026-08-25', type: 'notice', color: C.amber, read: false },
  { id: 3, typeKey: 'portal2.annc.typeTraining', zh: '9月在线培训课程安排', en: 'September Online Training Schedule', date: '2026-08-20', type: 'training', color: '#6B35C2', read: true },
  { id: 4, typeKey: 'portal2.annc.typeSystem', zh: '系统维护公告 — 2026-09-01 00:00-06:00', en: 'System Maintenance Notice — 2026-09-01 00:00–06:00', date: '2026-08-18', type: 'system', color: C.muted, read: true },
  { id: 5, typeKey: 'portal2.annc.typeProduct', zh: '新产品上线 — 商业财产险 E&O 附加条款', en: 'New Product Launch — Commercial Property E&O Endorsement', date: '2026-08-10', type: 'product', color: C.primary, read: true },
];

const COMM_HISTORY = [
  { id: 1, period: '2026 Q2', base: 42600, bonus: 8400, total: 51000, paidDate: '2026-07-28' },
  { id: 2, period: '2026 Q1', base: 38900, bonus: 5200, total: 44100, paidDate: '2026-04-25' },
  { id: 3, period: '2025 Q4', base: 35400, bonus: 9800, total: 45200, paidDate: '2026-01-20' },
  { id: 4, period: '2025 Q3', base: 31200, bonus: 4600, total: 35800, paidDate: '2025-10-22' },
];

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  high: { bg: C.redBg, color: C.red },
  medium: { bg: C.amberBg, color: C.amber },
  low: { bg: 'rgba(193,198,215,0.25)', color: C.soft },
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  processing: { bg: C.blue2Bg, color: C.blue2 },
  replied: { bg: C.greenBg, color: C.green },
  resolved: { bg: 'rgba(193,198,215,0.25)', color: C.soft },
};

type TabId = 'workbench' | 'files' | 'tickets';

export default function ChannelPortalView() {
  const { t, i18n } = useTranslation('channel');
  const isEn = i18n.language.startsWith('en');
  const [tab, setTab] = useState<TabId>('workbench');

  const TABS: { id: TabId; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'workbench', icon: <LayoutGrid size={13} />, label: t('portal2.tab.workbench'), badge: 2 },
    { id: 'files', icon: <BookOpen size={13} />, label: t('portal2.tab.files') },
    { id: 'tickets', icon: <MessageSquare size={13} />, label: t('portal2.tab.tickets'), badge: 2 },
  ];

  const todos = [
    { icon: <AlertTriangle size={15} />, bg: C.redBg, color: C.red, title: t('portal2.todos.certTitle'), desc: t('portal2.todos.certDesc'), action: t('portal2.todos.certAction') },
    { icon: <AlertTriangle size={15} />, bg: C.redBg, color: C.red, title: t('portal2.todos.trainingTitle'), desc: t('portal2.todos.trainingDesc'), action: t('portal2.todos.trainingAction') },
    { icon: <FileSignature size={15} />, bg: C.amberBg, color: C.amber, title: t('portal2.todos.contractTitle'), desc: t('portal2.todos.contractDesc'), action: t('portal2.todos.contractAction') },
    { icon: <Clock size={15} />, bg: C.blue2Bg, color: C.blue2, title: t('portal2.todos.profileTitle'), desc: t('portal2.todos.profileDesc'), action: t('portal2.todos.profileAction') },
  ];

  const quickEntries = [
    { icon: <FileEdit size={16} />, title: t('portal2.quick.quoteTitle'), desc: t('portal2.quick.quoteDesc') },
    { icon: <BookOpen size={16} />, title: t('portal2.quick.courseTitle'), desc: t('portal2.quick.courseDesc') },
    { icon: <MessageSquare size={16} />, title: t('portal2.quick.ticketTitle'), desc: t('portal2.quick.ticketDesc') },
    { icon: <Download size={16} />, title: t('portal2.quick.filesTitle'), desc: t('portal2.quick.filesDesc') },
  ];

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)', border: `0.5px solid ${C.border}`,
    borderRadius: 16, padding: '18px 20px',
    boxShadow: 'rgba(0,58,152,0.07) 0px 2px 20px 0px',
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{t('portal2.title')}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{t('portal2.subtitle')}</p>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {TABS.map(tb => {
          const isActive = tab === tb.id;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: isActive ? 700 : 500,
              background: isActive ? C.primaryLight : 'transparent',
              color: isActive ? C.primary : C.muted,
              border: isActive ? `0.5px solid ${C.border}` : '0.5px solid transparent',
              borderBottom: isActive ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
              cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>
              {tb.icon}{tb.label}
              {tb.badge !== undefined && (
                <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{tb.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Workbench ── */}
      {tab === 'workbench' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Welcome card */}
          <div style={{ ...card, background: 'linear-gradient(135deg, rgba(0,88,188,0.06), rgba(255,255,255,0.8))', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{t('portal2.wb.agentPortal')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>{t('portal2.wb.greeting')}</div>
              <div style={{ fontSize: 12.5, color: C.muted }}>
                {t('portal2.wb.agency')} · {t('portal2.wb.license')} <span style={{ ...mono, fontWeight: 600 }}>CA-INS-2023-7721</span> · 2027-03-13 {t('portal2.wb.expires')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.mutedLight, marginBottom: 3 }}>{t('portal2.wb.today')}</div>
              <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.text }}>2026-08-31</div>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: t('portal2.wb.ytdPremium'), value: '$1.82M', color: C.green, sub: `${t('portal2.wb.targetAchieve')} 114%` },
              { label: t('portal2.wb.ytdCommission'), value: '$218.4K', color: C.primary, sub: t('portal2.wb.q3Received') },
              { label: t('portal2.wb.renewalRate'), value: '91%', color: C.green, sub: t('portal2.wb.aboveTarget', { n: 3 }) },
              { label: t('portal2.wb.rating'), value: 'A', color: C.primary, sub: `${t('portal2.wb.topRank')} #1` },
            ].map(k => (
              <div key={k.label} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{k.label}</div>
                <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: 11.5, color: C.mutedLight, marginTop: 5 }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'start' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Todos */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={15} color={C.amber} /> {t('portal2.todos.title')}
                </div>
                <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 6px' }}>2</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {todos.map((td, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderTop: i > 0 ? `0.5px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: td.bg, color: td.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {td.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{td.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{td.desc}</div>
                    </div>
                    <button className="btn-ghost shrink-0" style={{ fontSize: 12 }}>{td.action}</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={14} color={C.primary} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t('portal2.annc.title')}</span>
              </div>
              {ANNOUNCEMENTS.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: !a.read ? 'rgba(0,88,188,0.03)' : 'transparent' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: !a.read ? C.primary : 'transparent', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 5, fontWeight: 700, background: `${a.color}12`, color: a.color, flexShrink: 0 }}>{t(a.typeKey)}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: a.read ? 500 : 700, color: C.text, minWidth: 0 }}>{isEn ? a.en : a.zh}</span>
                  <span style={{ ...mono, fontSize: 11, color: C.mutedLight, flexShrink: 0 }}>{a.date}</span>
                  <ChevronRight size={12} color={C.border} />
                </div>
              ))}
            </div>
          </div>

          {/* Right column: commission + quick links */}
          <div style={{ flex: '1 1 300px', minWidth: 290, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Latest commission received */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={14} color={C.green} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t('portal2.comm.title')}</span>
              </div>
              {COMM_HISTORY.slice(0, 3).map(c => (
                <div key={c.id} style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{c.period}</span>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.green }}>${c.total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11.5, color: C.muted, flexWrap: 'wrap', gap: 4 }}>
                    <span>{t('portal2.comm.received', { d: c.paidDate })}</span>
                    <span>{t('portal2.comm.baseBonus', { b: `$${c.base.toLocaleString()}`, x: `$${c.bonus.toLocaleString()}` })}</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', textAlign: 'center' }}>
                <button style={{ fontSize: 12, color: C.primary, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {t('portal2.comm.viewAll')}
                </button>
              </div>
            </div>

            {/* Quick entries */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>{t('portal2.quick.title')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {quickEntries.map((q, i) => (
                  <button key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: C.primaryLight, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {q.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Files & tools ── */}
      {tab === 'files' && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>{t('portal2.files.colName')}</th>
                <th style={TH}>{t('portal2.files.colCategory')}</th>
                <th style={TH}>{t('portal2.files.colFormat')}</th>
                <th style={TH}>{t('portal2.files.colSize')}</th>
                <th style={TH}>{t('portal2.files.colUpdated')}</th>
                <th style={{ ...TH, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {FILES.map(f => (
                <tr key={f.id}>
                  <td style={{ ...TD, fontWeight: 600, color: C.text }}>{t(f.nameKey)}</td>
                  <td style={{ ...TD, color: C.muted }}>{t(f.categoryKey)}</td>
                  <td style={{ ...TD }}>
                    <Badge bg="rgba(193,198,215,0.25)" color={C.soft}>{f.format}</Badge>
                  </td>
                  <td style={{ ...TD, ...mono, color: C.muted }}>{f.size}</td>
                  <td style={{ ...TD, ...mono, color: C.muted }}>{f.updated}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <button className="btn-ghost" style={{ fontSize: 12 }}>
                      <Download size={12} /> {t('portal2.files.download')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Support tickets ── */}
      {tab === 'tickets' && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 14px', borderBottom: `0.5px solid ${C.border}` }}>
            <button className="btn-primary" style={{ fontSize: 12.5 }}>
              <Plus size={13} /> {t('portal2.tickets.new')}
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>{t('portal2.tickets.colNo')}</th>
                <th style={TH}>{t('portal2.tickets.colSubject')}</th>
                <th style={TH}>{t('portal2.tickets.colPriority')}</th>
                <th style={TH}>{t('portal2.tickets.colStatus')}</th>
                <th style={TH}>{t('portal2.tickets.colCreated')}</th>
                <th style={TH}>{t('portal2.tickets.colReply')}</th>
                <th style={{ ...TH, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {TICKETS.map(tk => {
                const p = PRIORITY_STYLE[tk.priority];
                const s = STATUS_STYLE[tk.status];
                return (
                  <tr key={tk.id}>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: C.primary }}>{tk.id}</td>
                    <td style={{ ...TD, fontWeight: 600, color: C.text }}>{t(tk.subjectKey)}</td>
                    <td style={TD}><Badge bg={p.bg} color={p.color}>{t(`portal2.tickets.p${tk.priority}`)}</Badge></td>
                    <td style={TD}><Badge bg={s.bg} color={s.color}>{t(`portal2.tickets.s${tk.status}`)}</Badge></td>
                    <td style={{ ...TD, ...mono, color: C.muted }}>{tk.created}</td>
                    <td style={{ ...TD, ...mono, color: C.muted }}>{tk.reply}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }}>
                        <Eye size={12} /> {t('portal2.tickets.view')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
