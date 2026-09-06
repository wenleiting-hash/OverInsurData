import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { FileText, Download, Calendar, Filter, Plus, RefreshCw, Shield } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  categoryEn: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  lastGenerated?: string;
  status: 'active' | 'archived';
}

interface GeneratedReport {
  id: string;
  templateName: string;
  templateNameEn: string;
  generatedAt: string;
  periodFrom: string;
  periodTo: string;
  fileSize: number;
  format: 'PDF' | 'Excel' | 'CSV';
  status: 'completed' | 'generating' | 'failed';
  downloadUrl?: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Report templates
const mockTemplates: ReportTemplate[] = [
  {
    id: 'tpl1',
    name: 'OFAC 制裁筛查日报',
    nameEn: 'OFAC Sanctions Screening Daily Report',
    description: '每日 OFAC 制裁名单自动筛查结果汇总',
    descriptionEn: 'Daily summary of automated OFAC sanctions list screening results',
    category: '合规筛查',
    categoryEn: 'Compliance Screening',
    frequency: 'daily',
    lastGenerated: '2026-08-30',
    status: 'active',
  },
  {
    id: 'tpl2',
    name: 'NIPR 牌照状态周报',
    nameEn: 'NIPR License Status Weekly Report',
    description: '各渠道代理商 NIPR 持牌状态更新汇总',
    descriptionEn: 'Summary of NIPR license status updates across channel agents',
    category: '牌照管理',
    categoryEn: 'License Management',
    frequency: 'weekly',
    lastGenerated: '2026-08-29',
    status: 'active',
  },
  {
    id: 'tpl3',
    name: 'Appointment 申请月报',
    nameEn: 'Appointment Application Monthly Report',
    description: '月度 Appointment 申请审批统计与趋势分析',
    descriptionEn: 'Monthly appointment application approval statistics and trend analysis',
    category: '申请管理',
    categoryEn: 'Application Management',
    frequency: 'monthly',
    lastGenerated: '2026-08-01',
    status: 'active',
  },
  {
    id: 'tpl4',
    name: '季度合规审计全报告',
    nameEn: 'Quarterly Compliance Audit Full Report',
    description: '综合合规审计报告（含拦截率、违规分布、整改建议）',
    descriptionEn: 'Comprehensive compliance audit report (including block rate, violation distribution, remediation recommendations)',
    category: '审计报表',
    categoryEn: 'Audit Reports',
    frequency: 'quarterly',
    lastGenerated: '2026-07-01',
    status: 'active',
  },
];

// Mock data - Generated reports
const mockReports: GeneratedReport[] = [
  {
    id: 'rpt1',
    templateName: 'OFAC 制裁筛查日报',
    templateNameEn: 'OFAC Sanctions Screening Daily Report',
    generatedAt: '2026-08-30 09:00',
    periodFrom: '2026-08-29',
    periodTo: '2026-08-29',
    fileSize: 2450000,
    format: 'PDF',
    status: 'completed',
  },
  {
    id: 'rpt2',
    templateName: 'NIPR 牌照状态周报',
    templateNameEn: 'NIPR License Status Weekly Report',
    generatedAt: '2026-08-29 15:30',
    periodFrom: '2026-08-22',
    periodTo: '2026-08-28',
    fileSize: 3800000,
    format: 'Excel',
    status: 'completed',
  },
  {
    id: 'rpt3',
    templateName: 'Appointment 申请月报',
    templateNameEn: 'Appointment Application Monthly Report',
    generatedAt: '2026-08-01 10:00',
    periodFrom: '2026-07-01',
    periodTo: '2026-07-31',
    fileSize: 5200000,
    format: 'PDF',
    status: 'completed',
  },
  {
    id: 'rpt4',
    templateName: '季度合规审计全报告',
    templateNameEn: 'Quarterly Compliance Audit Full Report',
    generatedAt: '2026-07-01 14:00',
    periodFrom: '2026-04-01',
    periodTo: '2026-06-30',
    fileSize: 12500000,
    format: 'PDF',
    status: 'completed',
  },
  {
    id: 'rpt5',
    templateName: 'OFAC 制裁筛查日报',
    templateNameEn: 'OFAC Sanctions Screening Daily Report',
    generatedAt: '2026-08-31 09:00',
    periodFrom: '2026-08-30',
    periodTo: '2026-08-30',
    fileSize: 0,
    format: 'PDF',
    status: 'generating',
  },
];

export default function ComplianceReportGeneratorView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('appointment');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('last-month');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 border-green-300',
      generating: 'bg-blue-100 text-blue-700 border-blue-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<string, string> = {
      completed: t('reportGen.statusCompleted'),
      generating: t('reportGen.statusGenerating'),
      failed: t('reportGen.statusFailed'),
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredData = mockReports.filter((report) => {
    const template = mockTemplates.find(tpl => tpl.name === report.templateName);
    if (selectedCategoryFilter !== 'all' && !template?.categoryEn.includes(selectedCategoryFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('reportGen.title')}</h1>
        <p className="text-gray-600">{t('reportGen.description')}</p>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('reportGen.statAvailableTemplates')}</h3>
            <FileText className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{mockTemplates.length}</p>
          <p className="text-xs text-gray-500">{t('reportGen.statActiveTemplates')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('reportGen.statGeneratedToday')}</h3>
            <Calendar className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">1</p>
          <p className="text-xs text-green-600">{t('reportGen.statAutomationRunning')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('reportGen.statMonthlyTotal')}</h3>
            <Download className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">12</p>
          <p className="text-xs text-gray-500">{t('reportGen.statTotalDownloads', { n: 45 })}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('reportGen.statSuccessRate')}</h3>
            <Shield className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">98.5%</p>
          <p className="text-xs text-green-600">{t('reportGen.statExceptionRate', { n: 1.5 })}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('reportGen.filterAllCategories')}</option>
              <option value="Compliance Screening">{t('reportGen.categoryScreening')}</option>
              <option value="License Management">{t('reportGen.categoryLicense')}</option>
              <option value="Application Management">{t('reportGen.categoryApplication')}</option>
              <option value="Audit Reports">{t('reportGen.categoryAudit')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">{t('reportGen.rangeToday')}</option>
              <option value="yesterday">{t('reportGen.rangeYesterday')}</option>
              <option value="this-week">{t('reportGen.rangeThisWeek')}</option>
              <option value="last-week">{t('reportGen.rangeLastWeek')}</option>
              <option value="last-month">{t('reportGen.rangeLastMonth')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              {t('reportGen.refreshData')}
            </button>
            <button
              className="btn-primary"
            >
              <Plus size={16} className="mr-2" />
              {t('reportGen.newReport')}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{t('reportGen.historyTitle')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colReportName')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colPeriodRange')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colGeneratedAt')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colFileFormat')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colFileSize')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colStatus')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('reportGen.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{isEn ? report.templateNameEn : report.templateName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{report.periodFrom} → {report.periodTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {report.generatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-md text-xs font-semibold w-fit">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatFileSize(report.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`text-sm font-medium ${
                        report.status === 'completed'
                          ? 'text-blue-600 hover:text-blue-800'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={report.status !== 'completed'}
                    >
                      <Download size={16} className="inline mr-1" />
                      {t('reportGen.download')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Templates Catalog */}
      <div className="max-w-7xl mx-auto glass p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          {t('reportGen.templatesTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockTemplates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="text-purple-600" size={20} />
                  <span className="text-xs font-semibold text-gray-500">{isEn ? template.categoryEn : template.category}</span>
                </div>
                {template.status === 'active' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded text-xs font-medium">
                    {t('reportGen.templateActive')}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-medium">
                    {t('reportGen.templateArchived')}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{isEn ? template.nameEn : template.name}</h3>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{isEn ? template.descriptionEn : template.description}</p>

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>{t('reportGen.generationFrequency')}</span>
                  <span className="font-semibold capitalize">
                    {template.frequency === 'daily' ? t('reportGen.frequencyDaily') :
                     template.frequency === 'weekly' ? t('reportGen.frequencyWeekly') :
                     template.frequency === 'monthly' ? t('reportGen.frequencyMonthly') : t('reportGen.frequencyQuarterly')}
                  </span>
                </div>
                {template.lastGenerated && (
                  <div className="flex items-center justify-between">
                    <span>{t('reportGen.lastGenerated')}</span>
                    <span>{template.lastGenerated}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex items-center gap-2">
                <button className="flex-1 btn-secondary text-sm">
                  {t('reportGen.viewDetails')}
                </button>
                <button className="btn-primary text-sm">
                  {t('reportGen.manualGenerate')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="max-w-7xl mx-auto mt-12 text-center glass p-12 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('reportGen.emptyTitle')}</h3>
          <p className="text-gray-600 mb-4">{t('reportGen.emptyDesc')}</p>
          <button
            className="btn-primary"
          >
            <Plus size={16} className="mr-2" />
            {t('reportGen.newReport')}
          </button>
        </div>
      )}
    </div>
  );
}
