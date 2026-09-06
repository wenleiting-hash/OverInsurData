import { useState } from 'react'
import {
  BookOpen, FileText, ClipboardCheck, Award, Upload,
  Play, CheckCircle2, XCircle, Clock, Eye,
  Download, BarChart3, AlertTriangle, Users, Lock, ChevronRight,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)', greenBorder: 'rgba(52,199,89,0.25)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)', redBorder: 'rgba(255,59,48,0.22)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2', purpleBg: 'rgba(123,63,202,0.09)',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }
function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
}
const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, verticalAlign: 'middle' }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const catEn: Record<string, string> = {
  '合规必修': 'Compliance Required',
  '产品培训': 'Product Training',
  '销售提升': 'Sales Skills',
}

const courses = [
  { id: 1, name: '保险基础知识 — 财产险', nameEn: 'Insurance Fundamentals — Property & Casualty', category: '合规必修', duration: 180, enrolled: 312, completed: 288, passRate: 0.92, required: true, status: 'published', expires: '2026-12-31', level: '初级', levelEn: 'Beginner' },
  { id: 2, name: '汽车险核保实务', nameEn: 'Auto Insurance Underwriting Practice', category: '产品培训', duration: 120, enrolled: 198, completed: 165, passRate: 0.88, required: false, status: 'published', expires: '2026-09-30', level: '中级', levelEn: 'Intermediate' },
  { id: 3, name: 'AML 反洗钱合规培训 2026', nameEn: 'AML Anti-Money Laundering Compliance Training 2026', category: '合规必修', duration: 90, enrolled: 420, completed: 380, passRate: 0.95, required: true, status: 'published', expires: '2026-12-31', level: '初级', levelEn: 'Beginner' },
  { id: 4, name: '商业财产险高级销售技巧', nameEn: 'Commercial Property Advanced Sales Techniques', category: '销售提升', duration: 240, enrolled: 88, completed: 42, passRate: 0.76, required: false, status: 'published', expires: null, level: '高级', levelEn: 'Advanced' },
  { id: 5, name: 'E&O 专业责任险介绍', nameEn: 'E&O Professional Liability Insurance Introduction', category: '产品培训', duration: 60, enrolled: 145, completed: 98, passRate: 0.84, required: false, status: 'draft', expires: null, level: '中级', levelEn: 'Intermediate' },
  { id: 6, name: '续保与客户留存策略', nameEn: 'Renewal & Customer Retention Strategies', category: '销售提升', duration: 150, enrolled: 0, completed: 0, passRate: 0, required: false, status: 'draft', expires: null, level: '中级', levelEn: 'Intermediate' },
]

const certifications = [
  { id: 1, name: '财产险基础认证 P-1', nameEn: 'Property & Casualty Foundation Certification P-1', holder: 'Jennifer Walsh', issueDate: '2025-03-14', expiryDate: '2027-03-13', status: 'active', license: 'CA-INS-2023-7721', score: 96 },
  { id: 2, name: 'AML 合规认证', nameEn: 'AML Compliance Certification', holder: 'Michael Torres', issueDate: '2025-06-01', expiryDate: '2026-05-31', status: 'expiring', license: 'CA-INS-2023-5512', score: 88 },
  { id: 3, name: '汽车险核保认证 U-2', nameEn: 'Auto Insurance Underwriting Certification U-2', holder: 'Amy Park', issueDate: '2025-01-20', expiryDate: '2026-01-19', status: 'expired', license: 'TX-INS-2022-3318', score: 84 },
  { id: 4, name: '财产险基础认证 P-1', nameEn: 'Property & Casualty Foundation Certification P-1', holder: 'Lisa Wong', issueDate: '2026-04-10', expiryDate: '2028-04-09', status: 'active', license: 'CA-INS-2024-9901', score: 91 },
  { id: 5, name: 'E&O 专业责任险认证', nameEn: 'E&O Professional Liability Certification', holder: 'David Martinez', issueDate: '2025-08-15', expiryDate: '2027-08-14', status: 'active', license: 'CO-INS-2023-1144', score: 79 },
]

const exams = [
  { id: 1, course: '汽车险核保实务', courseEn: 'Auto Insurance Underwriting Practice', date: '2026-09-05', candidates: 45, passed: 38, avgScore: 82.4, duration: 60, status: 'closed' },
  { id: 2, course: '保险基础知识 — 财产险', courseEn: 'Insurance Fundamentals — Property & Casualty', date: '2026-09-10', candidates: 28, passed: null, avgScore: null, duration: 90, status: 'upcoming' },
  { id: 3, course: 'AML 反洗钱合规培训 2026', courseEn: 'AML Anti-Money Laundering Compliance Training 2026', date: '2026-08-28', candidates: 62, passed: 59, avgScore: 91.2, duration: 45, status: 'closed' },
]

// ─── Course Library Tab ───────────────────────────────────────────────────────

function CourseLibraryTab() {
  const { lang } = useLang()
  const [selected, setSelected] = useState<typeof courses[0] | null>(courses[0])
  const [filter, setFilter] = useState('all')

  const cats = ['all', '合规必修', '产品培训', '销售提升']
  const filtered = filter === 'all' ? courses : courses.filter(c => c.category === filter)

  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    published: { label: lang === 'en' ? 'Published' : '已发布', color: C.green, bg: C.greenBg },
    draft: { label: lang === 'en' ? 'Draft' : '草稿', color: C.amber, bg: C.amberBg },
  }

  return (
    <div style={{ display: 'flex', gap: 14, minHeight: 600 }}>
      {/* Left list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* KPI bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: lang === 'en' ? 'Total Courses' : '课程总数', v: courses.length, color: C.primary },
            { label: lang === 'en' ? 'Published' : '已发布', v: courses.filter(c => c.status === 'published').length, color: C.green },
            { label: lang === 'en' ? 'Total Enrollments' : '总报名人次', v: courses.reduce((s, c) => s + c.enrolled, 0), color: C.textSoft },
            { label: lang === 'en' ? 'Avg. Pass Rate' : '平均通过率', v: `${(courses.filter(c=>c.passRate>0).reduce((s,c)=>s+c.passRate,0)/courses.filter(c=>c.passRate>0).length*100).toFixed(0)}%`, color: C.primary },
          ].map(k => (
            <GCard key={k.label} style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
              <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.v}</div>
            </GCard>
          ))}
        </div>

        {/* Filter + action */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: filter === c ? 700 : 500, background: filter === c ? C.primary : 'transparent', color: filter === c ? '#fff' : C.textSoft, border: 'none', cursor: 'pointer' }}>{c === 'all' ? (lang === 'en' ? 'All' : '全部') : (lang === 'en' ? catEn[c] : c)}</button>
            ))}
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', padding: '6px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Upload size={13} />{lang === 'en' ? 'New Course' : '新建课程'}
          </button>
        </div>

        <GCard style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{(lang === 'en'
              ? ['Course Name', 'Category', 'Duration', 'Level', 'Enrolled', 'Pass Rate', 'Status', '']
              : ['课程名称', '分类', '时长', '级别', '报名', '通过率', '状态', '']
            ).map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer', background: selected?.id === c.id ? C.primaryLight : 'transparent' }}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.required && <Lock size={11} color={C.amber} />}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{lang === 'en' ? c.nameEn : c.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...TD, fontSize: 11.5, color: C.textSoft }}>{lang === 'en' ? catEn[c.category] : c.category}</td>
                  <td style={{ ...TD, ...mono, fontSize: 12, color: C.muted }}>{c.duration}{lang === 'en' ? ' min' : '分'}</td>
                  <td style={TD}><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: 'rgba(107,53,194,0.09)', color: C.purple }}>{lang === 'en' ? c.levelEn : c.level}</span></td>
                  <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 700 }}>{c.enrolled}</td>
                  <td style={TD}>
                    {c.passRate > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 44, height: 4, background: 'rgba(193,198,215,0.25)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${c.passRate * 100}%`, height: '100%', background: c.passRate >= 0.90 ? C.green : c.passRate >= 0.75 ? C.amber : C.red, borderRadius: 2 }} />
                        </div>
                        <span style={{ ...mono, fontSize: 11, fontWeight: 800, color: C.muted }}>{(c.passRate * 100).toFixed(0)}%</span>
                      </div>
                    ) : <span style={{ fontSize: 11, color: C.mutedLight }}>—</span>}
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: statusMeta[c.status].bg, color: statusMeta[c.status].color }}>
                      {statusMeta[c.status].label}
                    </span>
                  </td>
                  <td style={TD}>
                    <button style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer', fontWeight: 700 }}>
                      <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GCard>
      </div>

      {/* Right detail */}
      {selected && (
        <GCard style={{ width: 300, flexShrink: 0, alignSelf: 'flex-start', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={18} color={C.primary} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{lang === 'en' ? selected.nameEn : selected.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{lang === 'en' ? catEn[selected.category] : selected.category}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { l: lang === 'en' ? 'Level' : '级别', v: lang === 'en' ? selected.levelEn : selected.level },
              { l: lang === 'en' ? 'Duration' : '时长', v: lang === 'en' ? `${selected.duration} ${selected.duration === 1 ? 'minute' : 'minutes'}` : `${selected.duration} 分钟` },
              { l: lang === 'en' ? 'Enrolled' : '报名人数', v: String(selected.enrolled) },
              { l: lang === 'en' ? 'Completed' : '完成人数', v: String(selected.completed) },
              { l: lang === 'en' ? 'Pass Rate' : '通过率', v: selected.passRate > 0 ? `${(selected.passRate * 100).toFixed(0)}%` : (lang === 'en' ? 'N/A' : '暂无') },
              { l: lang === 'en' ? 'Required' : '必修', v: selected.required ? (lang === 'en' ? 'Yes' : '是') : (lang === 'en' ? 'No' : '否') },
              { l: lang === 'en' ? 'Valid Until' : '有效期至', v: selected.expires ?? (lang === 'en' ? 'No expiry' : '长期有效') },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: C.muted }}>{r.l}</span>
                <span style={{ fontWeight: 700, color: C.text }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${C.border}`, display: 'flex', gap: 7 }}>
            <button style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
              {lang === 'en' ? 'Edit Course' : '编辑课程'}
            </button>
            <button style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'transparent', color: C.muted, border: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
              <Eye size={13} />
            </button>
          </div>
        </GCard>
      )}
    </div>
  )
}

// ─── Exam Tab ─────────────────────────────────────────────────────────────────

function ExamTab() {
  const { lang } = useLang()
  const [activeExam, setActiveExam] = useState<typeof exams[0] | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
          <ClipboardCheck size={13} />{lang === 'en' ? 'New Exam' : '新建考试'}
        </button>
      </div>
      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, color: C.text }}>{lang === 'en' ? 'Exam Management' : '考试管理'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{(lang === 'en'
            ? ['Course', 'Exam Date', 'Duration', 'Candidates', 'Passed', 'Avg. Score', 'Status', '']
            : ['课程名称', '考试日期', '时长', '参考人数', '通过人数', '平均分', '状态', '']
          ).map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {exams.map(e => (
              <tr key={e.id}>
                <td style={TD}><div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{lang === 'en' ? e.courseEn : e.course}</div></td>
                <td style={{ ...TD, ...mono, fontSize: 12 }}>{e.date}</td>
                <td style={{ ...TD, ...mono, fontSize: 12, color: C.muted }}>{e.duration}{lang === 'en' ? ' min' : '分'}</td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 700 }}>{e.candidates}</td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 700, color: e.passed != null ? C.green : C.mutedLight }}>
                  {e.passed ?? '—'}
                </td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 800, color: e.avgScore != null ? C.primary : C.mutedLight }}>
                  {e.avgScore != null ? e.avgScore.toFixed(1) : '—'}
                </td>
                <td style={TD}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: e.status === 'closed' ? 'rgba(193,198,215,0.2)' : C.primaryLight, color: e.status === 'closed' ? C.muted : C.primary }}>
                    {e.status === 'closed' ? (lang === 'en' ? 'Closed' : '已结束') : (lang === 'en' ? 'Upcoming' : '即将开始')}
                  </span>
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer', fontWeight: 700 }}>{lang === 'en' ? 'Report' : '报告'}</button>
                    <button style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: 'transparent', color: C.muted, border: `0.5px solid ${C.border}`, cursor: 'pointer' }}>{lang === 'en' ? 'Details' : '详情'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Certification Tab ────────────────────────────────────────────────────────

function CertTab() {
  const { lang } = useLang()
  const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    active: { label: lang === 'en' ? 'Active' : '有效', color: C.green, bg: C.greenBg, icon: <CheckCircle2 size={12} color={C.green} /> },
    expiring: { label: lang === 'en' ? 'Expiring Soon' : '即将到期', color: C.amber, bg: C.amberBg, icon: <Clock size={12} color={C.amber} /> },
    expired: { label: lang === 'en' ? 'Expired' : '已过期', color: C.red, bg: C.redBg, icon: <XCircle size={12} color={C.red} /> },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: lang === 'en' ? 'Active Certifications' : '有效证书', v: certifications.filter(c => c.status === 'active').length, color: C.green, icon: <CheckCircle2 size={15} color={C.green} /> },
          { label: lang === 'en' ? 'Expiring Soon (within 30 days)' : '即将到期 (30天内)', v: certifications.filter(c => c.status === 'expiring').length, color: C.amber, icon: <AlertTriangle size={15} color={C.amber} /> },
          { label: lang === 'en' ? 'Expired' : '已过期', v: certifications.filter(c => c.status === 'expired').length, color: C.red, icon: <XCircle size={15} color={C.red} /> },
        ].map(s => (
          <GCard key={s.label} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          </GCard>
        ))}
      </div>

      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={14} color={C.primary} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{lang === 'en' ? 'Certification Management' : '认证证书管理'}</span>
          <button style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer' }}>
            <Download size={12} />{lang === 'en' ? 'Bulk Export' : '批量导出'}
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{(lang === 'en'
            ? ['Certificate', 'Holder', 'License No.', 'Issue Date', 'Expiry Date', 'Score', 'Status', '']
            : ['证书名称', '持证人', '执照号', '颁发日期', '到期日期', '成绩', '状态', '']
          ).map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {certifications.map(c => {
              const m = statusMeta[c.status]
              return (
                <tr key={c.id} style={{ background: c.status === 'expiring' ? C.amberBg : c.status === 'expired' ? C.redBg : 'transparent' }}>
                  <td style={TD}><div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{lang === 'en' ? c.nameEn : c.name}</div></td>
                  <td style={{ ...TD, fontSize: 12.5, fontWeight: 600, color: C.textSoft }}>{c.holder}</td>
                  <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.muted }}>{c.license}</td>
                  <td style={{ ...TD, ...mono, fontSize: 12, color: C.muted }}>{c.issueDate}</td>
                  <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 700, color: c.status === 'expired' ? C.red : c.status === 'expiring' ? C.amber : C.text }}>{c.expiryDate}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 36, height: 4, background: 'rgba(193,198,215,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${c.score}%`, height: '100%', background: c.score >= 90 ? C.green : C.primary, borderRadius: 2 }} />
                      </div>
                      <span style={{ ...mono, fontSize: 12, fontWeight: 800, color: C.primary }}>{c.score}</span>
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: m.bg, color: m.color }}>
                      {m.icon}{m.label}
                    </span>
                  </td>
                  <td style={TD}>
                    <button style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: c.status === 'expiring' || c.status === 'expired' ? C.amberBg : C.primaryLight, color: c.status === 'expiring' || c.status === 'expired' ? C.amber : C.primary, border: `0.5px solid ${c.status === 'expiring' || c.status === 'expired' ? C.amberBorder : C.primaryBorder}`, cursor: 'pointer', fontWeight: 700 }}>
                      {c.status === 'expired' ? (lang === 'en' ? 'Renew' : '续期') : c.status === 'expiring' ? (lang === 'en' ? 'Remind' : '提醒') : (lang === 'en' ? 'View' : '查看')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function ChannelTrainingView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'courses' | 'exams' | 'certs'>('courses')

  const title = lang === 'en' ? 'Channel Training & Certification' : '渠道培训与认证'
  const tabs = [
    { id: 'courses' as const, label: lang === 'en' ? 'Course Library' : '课程管理', icon: <BookOpen size={13} /> },
    { id: 'exams' as const, label: lang === 'en' ? 'Online Exams' : '在线考试', icon: <ClipboardCheck size={13} /> },
    { id: 'certs' as const, label: lang === 'en' ? 'Certifications' : '认证管理', icon: <Award size={13} />, badge: certifications.filter(c => c.status !== 'active').length },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'Course management, exam administration, and certification lifecycle tracking' : '课程管理、在线考试与证书全生命周期管理'}</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.icon}{t.label}
            {(t as any).badge > 0 && <span style={{ background: C.amber, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px' }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'courses' && <CourseLibraryTab />}
      {tab === 'exams' && <ExamTab />}
      {tab === 'certs' && <CertTab />}
    </div>
  )
}
