import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { FileText, Download, Calendar, Filter, Plus, RefreshCw, Shield } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  lastGenerated?: string;
  status: 'active' | 'archived';
}

interface GeneratedReport {
  id: string;
  templateName: string;
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
    description: '每日 OFAC 制裁名单自动筛查结果汇总',
    category: '合规筛查',
    frequency: 'daily',
    lastGenerated: '2026-08-30',
    status: 'active',
  },
  {
    id: 'tpl2',
    name: 'NIPR 牌照状态周报',
    description: '各渠道代理商 NIPR 持牌状态更新汇总',
    category: '牌照管理',
    frequency: 'weekly',
    lastGenerated: '2026-08-29',
    status: 'active',
  },
  {
    id: 'tpl3',
    name: 'Appointment 申请月报',
    description: '月度 Appointment 申请审批统计与趋势分析',
    category: '申请管理',
    frequency: 'monthly',
    lastGenerated: '2026-08-01',
    status: 'active',
  },
  {
    id: 'tpl4',
    name: '季度合规审计全报告',
    description: '综合合规审计报告（含拦截率、违规分布、整改建议）',
    category: '审计报表',
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
    generatedAt: '2026-08-31 09:00',
    periodFrom: '2026-08-30',
    periodTo: '2026-08-30',
    fileSize: 0,
    format: 'PDF',
    status: 'generating',
  },
];

export default function ComplianceReportGeneratorView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
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
      completed: '已完成',
      generating: '生成中',
      failed: '失败',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredData = mockReports.filter((report) => {
    const template = mockTemplates.find(tpl => tpl.name === report.templateName);
    if (selectedCategoryFilter !== 'all' && !template?.category.includes(selectedCategoryFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('complianceReport') || '合规报告生成器'}</h1>
        <p className="text-gray-600">{t('reportDescription') || '自动生成各类合规监管报表并支持导出'} </p>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">可用模板</h3>
            <FileText className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{mockTemplates.length}</p>
          <p className="text-xs text-gray-500">active templates</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">今日已生成</h3>
            <Calendar className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">1</p>
          <p className="text-xs text-green-600">↑ 自动化运行</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">本月累计</h3>
            <Download className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">12</p>
          <p className="text-xs text-gray-500">总下载次数 45</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">生成成功率</h3>
            <Shield className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">98.5%</p>
          <p className="text-xs text-green-600">↓ 异常率 1.5%</p>
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
              <option value="all">所有类别</option>
              <option value="合规筛查">合规筛查</option>
              <option value="牌照管理">牌照管理</option>
              <option value="申请管理">申请管理</option>
              <option value="审计报表">审计报表</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="this-week">本周</option>
              <option value="last-week">上周</option>
              <option value="last-month">上月</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              刷新数据
            </button>
            <button 
              className="btn-primary"
            >
              <Plus size={16} className="mr-2" />
              新建报告
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">历史生成记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  报告名称
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  周期范围
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  生成时间
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  文件格式
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  文件大小
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
              {filteredData.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{report.templateName}</div>
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
                      下载
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
          预置报告模板库
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockTemplates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="text-purple-600" size={20} />
                  <span className="text-xs font-semibold text-gray-500">{template.category}</span>
                </div>
                {template.status === 'active' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded text-xs font-medium">
                    启用中
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-medium">
                    已归档
                  </span>
                )}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{template.name}</h3>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
              
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>生成频率:</span>
                  <span className="font-semibold capitalize">
                    {template.frequency === 'daily' ? '每日' :
                     template.frequency === 'weekly' ? '每周' :
                     template.frequency === 'monthly' ? '每月' : '每季度'}
                  </span>
                </div>
                {template.lastGenerated && (
                  <div className="flex items-center justify-between">
                    <span>上次生成:</span>
                    <span>{template.lastGenerated}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex items-center gap-2">
                <button className="flex-1 btn-secondary text-sm">
                  查看详情
                </button>
                <button className="btn-primary text-sm">
                  手动生成
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无生成记录</h3>
          <p className="text-gray-600 mb-4">当前筛选条件下没有报告记录</p>
          <button 
            className="btn-primary"
          >
            <Plus size={16} className="mr-2" />
            新建报告
          </button>
        </div>
      )}
    </div>
  );
}
