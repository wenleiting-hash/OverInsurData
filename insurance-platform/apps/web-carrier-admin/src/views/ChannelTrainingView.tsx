import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import {
  ClipboardCheck,
  Award,
  Plus,
  Clock,
  Users,
  GraduationCap,
  BookOpen,
  Lock,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';

type CourseCategory = 'compliance' | 'product' | 'sales';
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
type ExamStatus = 'closed' | 'upcoming';
type CertStatus = 'active' | 'expiring' | 'expired';

interface Course {
  id: string;
  titleKey: string;
  category: CourseCategory;
  duration: number; // minutes
  level: CourseLevel;
  enrollments: number | null;
  passRate: number | null;
  completed: number;
  published: boolean;
  required: boolean;
  validUntil: string | null;
}

interface Exam {
  id: string;
  courseTitleKey: string;
  date: string;
  candidates: number;
  passed: number | null;
  avgScore: number | null;
  duration: number;
  status: ExamStatus;
}

interface Certification {
  id: string;
  nameKey: string;
  holder: string;
  license: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  score: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Courses catalog (aligned with V1.3 prototype)
const mockCourses: Course[] = [
  { id: 'course1', titleKey: 'training2.courses.c1', category: 'compliance', duration: 180, level: 'beginner', enrollments: 312, passRate: 92, completed: 288, published: true, required: true, validUntil: '2026-12-31' },
  { id: 'course2', titleKey: 'training2.courses.c2', category: 'product', duration: 120, level: 'intermediate', enrollments: 198, passRate: 88, completed: 165, published: true, required: false, validUntil: '2026-09-30' },
  { id: 'course3', titleKey: 'training2.courses.c3', category: 'compliance', duration: 90, level: 'beginner', enrollments: 420, passRate: 95, completed: 380, published: true, required: true, validUntil: '2026-12-31' },
  { id: 'course4', titleKey: 'training2.courses.c4', category: 'sales', duration: 240, level: 'advanced', enrollments: 88, passRate: 76, completed: 42, published: true, required: false, validUntil: null },
  { id: 'course5', titleKey: 'training2.courses.c5', category: 'product', duration: 60, level: 'intermediate', enrollments: 145, passRate: 84, completed: 98, published: false, required: false, validUntil: null },
  { id: 'course6', titleKey: 'training2.courses.c6', category: 'sales', duration: 150, level: 'intermediate', enrollments: null, passRate: null, completed: 0, published: false, required: false, validUntil: null },
];

const mockExams: Exam[] = [
  { id: 'exam1', courseTitleKey: 'training2.courses.c2', date: '2026-09-05', candidates: 45, passed: 38, avgScore: 82.4, duration: 60, status: 'closed' },
  { id: 'exam2', courseTitleKey: 'training2.courses.c1', date: '2026-09-10', candidates: 28, passed: null, avgScore: null, duration: 90, status: 'upcoming' },
  { id: 'exam3', courseTitleKey: 'training2.courses.c3', date: '2026-08-28', candidates: 62, passed: 59, avgScore: 91.2, duration: 45, status: 'closed' },
];

const mockCerts: Certification[] = [
  { id: 'cert-1', nameKey: 'training2.cert.cert1', holder: 'Jennifer Walsh', license: 'CA-INS-2023-7721', issueDate: '2025-03-14', expiryDate: '2027-03-13', status: 'active', score: 96 },
  { id: 'cert-2', nameKey: 'training2.cert.cert2', holder: 'Michael Torres', license: 'CA-INS-2023-5512', issueDate: '2025-06-01', expiryDate: '2026-05-31', status: 'expiring', score: 88 },
  { id: 'cert-3', nameKey: 'training2.cert.cert3', holder: 'Amy Park', license: 'TX-INS-2022-3318', issueDate: '2025-01-20', expiryDate: '2026-01-19', status: 'expired', score: 84 },
  { id: 'cert-4', nameKey: 'training2.cert.cert1', holder: 'Lisa Wong', license: 'CA-INS-2024-9901', issueDate: '2026-04-10', expiryDate: '2028-04-09', status: 'active', score: 91 },
  { id: 'cert-5', nameKey: 'training2.cert.cert5', holder: 'David Martinez', license: 'CO-INS-2023-1144', issueDate: '2025-08-15', expiryDate: '2027-08-14', status: 'active', score: 79 },
];

const CERT_STATUS_META: Record<CertStatus, { labelKey: string; icon: React.ReactNode; rowClass: string; badgeClass: string }> = {
  active: {
    labelKey: 'training2.cert.stActive',
    icon: <CheckCircle2 size={12} className="text-green-600" />,
    rowClass: '',
    badgeClass: 'bg-green-100 text-green-700',
  },
  expiring: {
    labelKey: 'training2.cert.stExpiring',
    icon: <Clock size={12} className="text-amber-600" />,
    rowClass: 'bg-amber-50/60',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  expired: {
    labelKey: 'training2.cert.stExpired',
    icon: <XCircle size={12} className="text-red-500" />,
    rowClass: 'bg-red-50/50',
    badgeClass: 'bg-red-100 text-red-600',
  },
};

const passRateColor = (rate: number) => (rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-400');

export default function ChannelTrainingView({ navigateTo }: Props) {
  void navigateTo;
  const { t } = useTranslation('channel');
  const [activeTab, setActiveTab] = useState<'courses' | 'exam' | 'certification'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CourseCategory>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course1');

  const categories: { key: 'all' | CourseCategory; labelKey: string }[] = [
    { key: 'all', labelKey: 'training2.filter.all' },
    { key: 'compliance', labelKey: 'training2.filter.compliance' },
    { key: 'product', labelKey: 'training2.filter.product' },
    { key: 'sales', labelKey: 'training2.filter.sales' },
  ];

  const tabs: { key: 'courses' | 'exam' | 'certification'; labelKey: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'courses', labelKey: 'training2.tab.courses', icon: <BookOpen size={13} /> },
    { key: 'exam', labelKey: 'training2.tab.exam', icon: <ClipboardCheck size={13} /> },
    { key: 'certification', labelKey: 'training2.tab.certification', icon: <Award size={13} />, badge: mockCerts.filter((c) => c.status !== 'active').length },
  ];

  const filteredCourses =
    selectedCategory === 'all' ? mockCourses : mockCourses.filter((c) => c.category === selectedCategory);

  const selectedCourse = mockCourses.find((c) => c.id === selectedCourseId) ?? mockCourses[0];

  const totalEnrollments = mockCourses.reduce((sum, c) => sum + (c.enrollments ?? 0), 0);
  const publishedCount = mockCourses.filter((c) => c.published).length;
  const ratedCourses = mockCourses.filter((c) => c.passRate !== null);
  const avgPassRate = Math.round(
    ratedCourses.reduce((sum, c) => sum + (c.passRate ?? 0), 0) / ratedCourses.length
  );

  const levelBadgeClass: Record<CourseLevel, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

  const categoryLabelKey: Record<CourseCategory, string> = {
    compliance: 'training2.filter.compliance',
    product: 'training2.filter.product',
    sales: 'training2.filter.sales',
  };

  const activeCertCount = mockCerts.filter((c) => c.status === 'active').length;
  const expiringCertCount = mockCerts.filter((c) => c.status === 'expiring').length;
  const expiredCertCount = mockCerts.filter((c) => c.status === 'expired').length;

  const certStats = [
    { labelKey: 'training2.cert.statActive', v: activeCertCount, icon: <CheckCircle2 size={15} className="text-green-600" />, color: 'text-green-600', bg: 'bg-green-50' },
    { labelKey: 'training2.cert.statExpiring', v: expiringCertCount, icon: <AlertTriangle size={15} className="text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { labelKey: 'training2.cert.statExpired', v: expiredCertCount, icon: <XCircle size={15} className="text-red-500" />, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="mb-1" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('training2.title')}</h1>
        <p style={{ fontSize: 12.5, color: '#717786' }}>{t('training2.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 border-b overflow-x-auto" style={{ borderColor: 'rgba(193,198,215,0.55)' }}>
        <div className="tab-bar" style={{ borderBottom: 'none', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-item flex shrink-0 items-center gap-2 ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.icon}
              {t(tab.labelKey)}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{ background: '#A05C00', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'courses' && (
        <>
          {/* Statistics Cards */}
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="glass rounded-xl p-4 sm:p-5">
              <p className="text-[12.5px] whitespace-nowrap mb-2" style={{ color: '#717786' }}>{t('training2.stats.totalCourses')}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0058BC', lineHeight: 1 }}>{mockCourses.length}</p>
            </div>
            <div className="glass rounded-xl p-4 sm:p-5">
              <p className="text-[12.5px] whitespace-nowrap mb-2" style={{ color: '#717786' }}>{t('training2.stats.published')}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#1a7a2e', lineHeight: 1 }}>{publishedCount}</p>
            </div>
            <div className="glass rounded-xl p-4 sm:p-5">
              <p className="text-[12.5px] whitespace-nowrap mb-2" style={{ color: '#717786' }}>{t('training2.stats.enrollments')}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0058BC', lineHeight: 1 }}>{totalEnrollments.toLocaleString()}</p>
            </div>
            <div className="glass rounded-xl p-4 sm:p-5">
              <p className="text-[12.5px] whitespace-nowrap mb-2" style={{ color: '#717786' }}>{t('training2.stats.passRate')}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#1a7a2e', lineHeight: 1 }}>{avgPassRate}%</p>
            </div>
          </div>

          {/* Category chips + primary action */}
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors"
                  style={selectedCategory === cat.key
                    ? { background: '#0058BC', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.8)', color: '#414755', border: '0.5px solid rgba(193,198,215,0.55)' }}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>
            <button className="btn-primary ml-auto">
              <Plus size={16} />
              {t('training2.newCourse')}
            </button>
          </div>

          {/* Table + Detail panel */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Table */}
            <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.course')}
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.category')}
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.duration')}
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.level')}
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500">
                        {t('training2.col.enrollment')}
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.passRate')}
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">
                        {t('training2.col.status')}
                      </th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCourses.map((course) => (
                      <tr
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedCourseId === course.id ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {course.required && <Lock size={11} className="text-amber-600 shrink-0" />}
                            <div className="font-semibold text-gray-900 text-sm">{t(course.titleKey)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{t(categoryLabelKey[course.category])}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {course.duration}
                            {t('training2.unit.minutes')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${levelBadgeClass[course.level]}`}
                          >
                            {t(`training2.level.${course.level}`)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {course.enrollments !== null ? (
                            <span className="text-sm font-semibold text-gray-900">{course.enrollments}</span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {course.passRate !== null ? (
                            <div className="flex items-center gap-2 min-w-28">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
                                <div
                                  className={`h-2 rounded-full ${passRateColor(course.passRate)}`}
                                  style={{ width: `${course.passRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{course.passRate}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              course.published
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                course.published ? 'bg-green-500' : 'bg-amber-500'
                              }`}
                            />
                            {course.published ? t('training2.status.published') : t('training2.status.draft')}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourseId(course.id);
                            }}
                            className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <ChevronRight size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail Panel */}
            <div className="glass rounded-xl self-start overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-gray-900 break-words">{t(selectedCourse.titleKey)}</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5">{t(categoryLabelKey[selectedCourse.category])}</div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500">{t('training2.detail.level')}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${levelBadgeClass[selectedCourse.level]}`}
                  >
                    {t(`training2.level.${selectedCourse.level}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} />
                    {t('training2.detail.duration')}
                  </span>
                  <span className="text-[12.5px] font-semibold text-gray-900">
                    {selectedCourse.duration}
                    {t('training2.unit.minutes')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                    <Users size={14} />
                    {t('training2.detail.enrollment')}
                  </span>
                  <span className="text-[12.5px] font-semibold text-gray-900">
                    {selectedCourse.enrollments ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    {t('training2.detail.completion')}
                  </span>
                  <span className="text-[12.5px] font-semibold text-gray-900">{selectedCourse.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500">{t('training2.detail.passRate')}</span>
                  <span className="text-[12.5px] font-semibold text-green-600">
                    {selectedCourse.passRate !== null ? `${selectedCourse.passRate}%` : t('training2.detail.na')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-gray-500">{t('training2.detail.required')}</span>
                  {selectedCourse.required ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      {t('training2.detail.requiredYes')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      {t('training2.detail.requiredNo')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[12.5px] text-gray-500">{t('training2.detail.expiry')}</span>
                  <span className="text-[12.5px] font-semibold text-gray-900">
                    {selectedCourse.validUntil ?? t('training2.detail.noExpiry')}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#0058BC] text-white hover:bg-[#0070EB] transition-colors">
                  {t('training2.detail.editCourse')}
                </button>
                <button className="px-3 py-2 rounded-lg text-xs font-bold bg-transparent text-gray-500 border-[0.5px] border-gray-200 hover:bg-gray-50 transition-colors">
                  <Eye size={13} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'exam' && (
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex justify-end">
            <button className="btn-primary">
              <ClipboardCheck size={15} />
              {t('training2.exam.newExam')}
            </button>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 font-bold text-[13px] text-gray-900">
              {t('training2.exam.title')}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.exam.colCourse')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.exam.colDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.exam.colDuration')}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('training2.exam.colCandidates')}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('training2.exam.colPassed')}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('training2.exam.colAvgScore')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.exam.colStatus')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockExams.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{t(e.courseTitleKey)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 font-data">{e.date}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {e.duration}
                        {t('training2.unit.minutes')}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 text-right">{e.candidates}</td>
                      <td className={`px-4 py-3.5 text-sm font-semibold text-right ${e.passed != null ? 'text-green-600' : 'text-gray-300'}`}>
                        {e.passed ?? '—'}
                      </td>
                      <td className={`px-4 py-3.5 text-sm font-bold text-right ${e.avgScore != null ? 'text-blue-600' : 'text-gray-300'}`}>
                        {e.avgScore != null ? e.avgScore.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            e.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {e.status === 'closed' ? t('training2.exam.stClosed') : t('training2.exam.stUpcoming')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <button className="px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 border-[0.5px] border-blue-100 hover:bg-blue-100 transition-colors">
                            {t('training2.exam.report')}
                          </button>
                          <button className="px-2 py-1 rounded-md text-[11px] font-bold bg-transparent text-gray-500 border-[0.5px] border-gray-200 hover:bg-gray-50 transition-colors">
                            {t('training2.exam.details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certification' && (
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Cert stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {certStats.map((s) => (
              <div key={s.labelKey} className="glass rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${s.bg}`}>
                  {s.icon}
                </div>
                <div>
                  <div className={`font-data text-[22px] font-extrabold leading-none ${s.color}`}>{s.v}</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5">{t(s.labelKey)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Certification table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
              <Award size={14} className="text-blue-600" />
              <span className="font-bold text-[13.5px] text-gray-900">{t('training2.cert.title')}</span>
              <button className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border-[0.5px] border-blue-100 hover:bg-blue-100 transition-colors">
                <Download size={12} />
                {t('training2.cert.bulkExport')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colName')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colHolder')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colLicense')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colIssue')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colExpiry')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colScore')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('training2.cert.colStatus')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockCerts.map((c) => {
                    const m = CERT_STATUS_META[c.status];
                    return (
                      <tr key={c.id} className={`transition-colors ${m.rowClass}`}>
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{t(c.nameKey)}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{c.holder}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 font-data">{c.license}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 font-data">{c.issueDate}</td>
                        <td className={`px-4 py-3.5 text-sm font-bold font-data ${
                          c.status === 'expired' ? 'text-red-500' : c.status === 'expiring' ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {c.expiryDate}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 min-w-20">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-12">
                              <div
                                className={`h-1.5 rounded-full ${c.score >= 90 ? 'bg-green-500' : 'bg-blue-600'}`}
                                style={{ width: `${c.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-600">{c.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.badgeClass}`}>
                            {m.icon}
                            {t(m.labelKey)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            className={`px-2 py-1 rounded-md text-[11px] font-bold border-[0.5px] transition-colors ${
                              c.status === 'expired' || c.status === 'expiring'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                            }`}
                          >
                            {c.status === 'expired'
                              ? t('training2.cert.actRenew')
                              : c.status === 'expiring'
                                ? t('training2.cert.actRemind')
                                : t('training2.cert.actView')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
