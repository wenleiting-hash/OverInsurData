import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { BookOpen, CheckCircle, XCircle, Clock, PlayCircle, Award, Filter, Download, TrendingUp } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  code: string;
  category: string;
  duration: number; // minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'archived';
  requiredForChannels: string[];
}

interface Enrollment {
  id: string;
  channelId: string;
  channelName: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number; // percentage
  score?: number;
  status: 'enrolled' | 'in-progress' | 'completed' | 'failed' | 'expired';
  certificationExpiry?: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Courses catalog
const mockCourses: Course[] = [
  {
    id: 'course1',
    title: '保险产品基础培训',
    code: 'TRAIN-001',
    category: '产品知识',
    duration: 120,
    level: 'beginner',
    status: 'active',
    requiredForChannels: ['c1', 'c2'],
  },
  {
    id: 'course2',
    title: '合规与销售规范',
    code: 'TRAIN-002',
    category: '合规认证',
    duration: 90,
    level: 'intermediate',
    status: 'active',
    requiredForChannels: ['c1', 'c2', 'c3', 'c4'],
  },
  {
    id: 'course3',
    title: '高级风险管理',
    code: 'TRAIN-003',
    category: '风险管理',
    duration: 180,
    level: 'advanced',
    status: 'active',
    requiredForChannels: ['c4'],
  },
  {
    id: 'course4',
    title: '客户服务技巧',
    code: 'TRAIN-004',
    category: '技能培训',
    duration: 60,
    level: 'beginner',
    status: 'active',
    requiredForChannels: ['c1', 'c2'],
  },
];

// Mock data - Enrollments
const mockEnrollments: Enrollment[] = [
  {
    id: 'enroll1',
    channelId: 'c1',
    channelName: '上海代理点',
    courseId: 'course1',
    courseTitle: '保险产品基础培训',
    enrolledAt: '2026-07-01',
    startedAt: '2026-07-02',
    completedAt: '2026-07-15',
    progress: 100,
    score: 88,
    status: 'completed',
    certificationExpiry: '2027-07-15',
  },
  {
    id: 'enroll2',
    channelId: 'c2',
    channelName: '北京经纪门店',
    courseId: 'course2',
    courseTitle: '合规与销售规范',
    enrolledAt: '2026-07-10',
    startedAt: '2026-07-12',
    completedAt: '2026-07-25',
    progress: 100,
    score: 92,
    status: 'completed',
    certificationExpiry: '2027-07-25',
  },
  {
    id: 'enroll3',
    channelId: 'c1',
    channelName: '上海代理点',
    courseId: 'course2',
    courseTitle: '合规与销售规范',
    enrolledAt: '2026-08-01',
    startedAt: '2026-08-02',
    progress: 45,
    status: 'in-progress',
  },
  {
    id: 'enroll4',
    channelId: 'c3',
    channelName: '广州 MG 公司',
    courseId: 'course1',
    courseTitle: '保险产品基础培训',
    enrolledAt: '2026-08-05',
    progress: 0,
    status: 'enrolled',
  },
  {
    id: 'enroll5',
    channelId: 'c4',
    channelName: '深圳 MGA 总部',
    courseId: 'course3',
    courseTitle: '高级风险管理',
    enrolledAt: '2026-07-20',
    startedAt: '2026-07-22',
    progress: 78,
    status: 'in-progress',
  },
  {
    id: 'enroll6',
    channelId: 'c2',
    channelName: '北京经纪门店',
    courseId: 'course1',
    courseTitle: '保险产品基础培训',
    enrolledAt: '2026-06-01',
    completedAt: '2026-06-20',
    progress: 100,
    score: 75,
    status: 'expired',
    certificationExpiry: '2026-06-20',
  },
];

export default function ChannelTrainingView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showCourseModal, setShowCourseModal] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins || ''}`;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      enrolled: 'bg-blue-100 text-blue-700 border-blue-300',
      'in-progress': 'bg-purple-100 text-purple-700 border-purple-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
      expired: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    const labels: Record<string, string> = {
      enrolled: '已注册',
      'in-progress': '进行中',
      completed: '已完成',
      failed: '未通过',
      expired: '已过期',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700 border-green-300',
      intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      advanced: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const filteredData = mockEnrollments.filter((enrollment) => {
    if (selectedStatusFilter !== 'all' && enrollment.status !== selectedStatusFilter) return false;
    const course = mockCourses.find(c => c.id === enrollment.courseId);
    if (selectedCategoryFilter !== 'all' && !course?.category.includes(selectedCategoryFilter)) return false;
    return true;
  });

  // Statistics
  const stats = {
    totalEnrollments: mockEnrollments.length,
    completed: mockEnrollments.filter(e => e.status === 'completed').length,
    inProgress: mockEnrollments.filter(e => e.status === 'in-progress').length,
    avgCompletionRate: mockEnrollments.reduce((sum, e) => sum + e.progress, 0) / mockEnrollments.length,
    certifiedCount: mockEnrollments.filter(e => e.status === 'completed' && e.certificationExpiry).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('channelTraining') || '渠道培训认证'}</h1>
        <p className="text-gray-600">{t('trainingDescription') || '管理渠道代理商的产品知识和合规培训课程'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalEnrollments')}</h3>
            <BookOpen className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalEnrollments}</p>
          <p className="text-xs text-gray-500">{t('trainingRecords')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('completedCourses')}</h3>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.completed}</p>
          <p className="text-xs text-gray-500">{t('successfullyFinished')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('ongoingLearning')}</h3>
            <PlayCircle className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgress}</p>
          <p className="text-xs text-gray-500">{t('currentlyStudying')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('avgProgress')}</h3>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.avgCompletionRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">{t('averageCompletionRate')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('certifiedChannels')}</h3>
            <Award className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.certifiedCount}</p>
          <p className="text-xs text-gray-500">{t('validCertifications')}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="enrolled">已注册</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="expired">已过期</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类别</option>
              <option value="产品知识">产品知识</option>
              <option value="合规认证">合规认证</option>
              <option value="风险管理">风险管理</option>
              <option value="技能培训">技能培训</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button 
              className="btn-primary"
              onClick={() => setShowCourseModal(true)}
            >
              <BookOpen size={16} className="mr-2" />
              {t('enrollCourse') || '注册课程'}
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              {t('export')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  渠道信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  课程详情
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  学习时间线
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  进度跟踪
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  成绩/认证
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {enrollment.channelName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{enrollment.channelName}</div>
                        <div className="text-xs text-gray-500">ID: {enrollment.channelId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{enrollment.courseTitle}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {mockCourses.find(c => c.id === enrollment.courseId)?.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-400" />
                        <span>注册：{enrollment.enrolledAt}</span>
                      </div>
                      {enrollment.startedAt && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <PlayCircle size={12} />
                          <span>开始：{enrollment.startedAt}</span>
                        </div>
                      )}
                      {enrollment.completedAt && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={12} />
                          <span>完成：{enrollment.completedAt}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{enrollment.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {enrollment.score !== undefined ? (
                      <div>
                        <div className="font-bold text-lg text-blue-600">{enrollment.score}分</div>
                        {enrollment.certificationExpiry && (
                          <div className="text-xs text-orange-600 mt-1">
                            📜 认证有效期至：{enrollment.certificationExpiry}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(enrollment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {enrollment.status === 'enrolled' && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                        开始学习 →
                      </button>
                    )}
                    {enrollment.status === 'in-progress' && (
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium mr-3">
                        继续学习 →
                      </button>
                    )}
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      查看详情 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Catalog Section */}
      <div className="max-w-7xl mx-auto mt-8 glass p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">可用培训课程目录</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockCourses.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">{course.category}</span>
                </div>
                {getLevelBadge(course.level)}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1 truncate" title={course.title}>
                {course.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{course.code}</p>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>{formatDuration(course.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle size={12} />
                  <span>适用于：{course.requiredForChannels.length} 个渠道</span>
                </div>
              </div>

              {course.status === 'active' && (
                <button className="mt-4 w-full btn-primary text-sm">
                  {t('viewDetails') || '查看详情'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="max-w-7xl mx-auto mt-12 text-center glass p-12 rounded-lg">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noEnrollments')}</h3>
          <p className="text-gray-600 mb-4">
            {t('noEnrollmentsDescription') || '暂无培训记录'}
          </p>
          <button 
            className="btn-primary"
            onClick={() => setShowCourseModal(true)}
          >
            <BookOpen size={16} className="mr-2" />
            {t('enrollCourse')}
          </button>
        </div>
      )}
    </div>
  );
}
