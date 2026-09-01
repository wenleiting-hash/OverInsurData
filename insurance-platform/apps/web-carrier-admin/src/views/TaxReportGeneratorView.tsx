import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface TaxTemplate {
  id: string;
  name: string;
  description: string;
  taxType: '1099' | 'sales-tax' | 'premium-tax' | 'income-tax' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on-demand';
  jurisdiction: string;
  status: 'active' | 'archived';
  lastGenerated?: string;
}

interface GeneratedReport {
  id: string;
  templateName: string;
  taxType: string;
  jurisdiction: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  fileSize: number;
  format: 'PDF' | 'Excel' | 'CSV';
  status: 'completed' | 'generating' | 'failed';
  totalPremium: number;
  totalCommission: number;
  totalTax: number;
  channelCount: number;
  policyCount: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Report templates
const mockTemplates: TaxTemplate[] = [
  {
    id: 'tpl1',
    name: '1099-MISC 佣金报告',
    description: '年度佣金收入申报表格，用于 IRS 税务申报',
    taxType: '1099',
    frequency: 'annual',
    jurisdiction: 'United States',
    status: 'active',
    lastGenerated: '2026-01-31',
  },
  {
    id: 'tpl2',
    name: '州销售税月度报告',
    description: '各州保险销售税月度汇总报表',
    taxType: 'sales-tax',
    frequency: 'monthly',
    jurisdiction: 'Multiple States',
    status: 'active',
    lastGenerated: '2026-08-31',
  },
  {
    id: 'tpl3',
    name: '保费税季度申报表',
    description: 'Quarterly Premium Tax Filing for all licensed states',
    taxType: 'premium-tax',
    frequency: 'quarterly',
    jurisdiction: 'California',
    status: 'active',
    lastGenerated: '2026-07-31',
  },
  {
    id: 'tpl4',
    name: '代理收入所得税预估',
    description: 'Channel income tax estimation and projection',
    taxType: 'income-tax',
    frequency: 'quarterly',
    jurisdiction: 'United States',
    status: 'active',
    lastGenerated: '2026-06-30',
  },
];

// Mock data - Generated reports
const mockReports: GeneratedReport[] = [
  {
    id: 'rpt001',
    templateName: '1099-MISC 佣金报告',
    taxType: '1099',
    jurisdiction: 'United States',
    periodFrom: '2026-01-01',
    periodTo: '2026-12-31',
    generatedAt: '2026-08-30 14:30:00',
    fileSize: 2458624,
    format: 'Excel',
    status: 'completed',
    totalPremium: 45670000.00,
    totalCommission: 7280000.00,
    totalTax: 873600.00,
    channelCount: 12,
    policyCount: 1567,
  },
  {
    id: 'rpt002',
    templateName: '州销售税月度报告',
    taxType: 'sales-tax',
    jurisdiction: 'New York',
    periodFrom: '2026-08-01',
    periodTo: '2026-08-31',
    generatedAt: '2026-08-31 09:15:00',
    fileSize: 1048576,
    format: 'PDF',
    status: 'completed',
    totalPremium: 3890500.00,
    totalCommission: 622500.00,
    totalTax: 124500.00,
    channelCount: 3,
    policyCount: 234,
  },
  {
    id: 'rpt003',
    templateName: '保费税季度申报表',
    taxType: 'premium-tax',
    jurisdiction: 'Texas',
    periodFrom: '2026-07-01',
    periodTo: '2026-09-30',
    generatedAt: '2026-08-29 16:45:00',
    fileSize: 1572864,
    format: 'Excel',
    status: 'completed',
    totalPremium: 5670000.00,
    totalCommission: 907200.00,
    totalTax: 91000.00,
    channelCount: 4,
    policyCount: 456,
  },
  {
    id: 'rpt004',
    templateName: '州销售税月度报告',
    taxType: 'sales-tax',
    jurisdiction: 'Florida',
    periodFrom: '2026-08-01',
    periodTo: '2026-08-31',
    generatedAt: '2026-08-28 11:20:00',
    fileSize: 786432,
    format: 'CSV',
    status: 'generating',
    totalPremium: 2100750.00,
    totalCommission: 336120.00,
    totalTax: 42015.00,
    channelCount: 2,
    policyCount: 178,
  },
  {
    id: 'rpt005',
    templateName: '代理收入所得税预估',
    taxType: 'income-tax',
    jurisdiction: 'United States',
    periodFrom: '2026-07-01',
    periodTo: '2026-09-30',
    generatedAt: '2026-08-27 10:00:00',
    fileSize: 2097152,
    format: 'PDF',
    status: 'completed',
    totalPremium: 56780000.00,
    totalCommission: 9084800.00,
    totalTax: 1816960.00,
    channelCount: 12,
    policyCount: 2134,
  },
  {
    id: 'rpt006',
    templateName: '1099-MISC 佣金报告',
    taxType: '1099',
    jurisdiction: 'California',
    periodFrom: '2026-01-01',
    periodTo: '2026-12-31',
    generatedAt: '2026-08-26 15:30:00',
    fileSize: 524288,
    format: 'Excel',
    status: 'failed',
    totalPremium: 890250.00,
    totalCommission: 142440.00,
    totalTax: 14244.00,
    channelCount: 1,
    policyCount: 67,
  },
];

// Mock metrics
const mockMetrics = {
  totalGenerated: 156,
  pendingGeneration: 3,
  failedGeneration: 2,
  thisMonthTotal: 12567000.00,
  avgFileSize: 1572864,
  totalTaxCollected: 2345600.00,
};

const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  generating: 'bg-blue-100 text-blue-800 border-blue-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

export function TaxReportGeneratorView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'year-to-date'>('year-to-date');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredReports = mockReports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getTemplateName = (name: string) => {
    const shortNames: Record<string, string> = {
      '1099-MISC 佣金报告': '1099-MISC',
      '州销售税月度报告': 'Sales Tax',
      '保费税季度申报表': 'Premium Tax',
      '代理收入所得税预估': 'Income Tax Est.',
    };
    return shortNames[name] || name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              税务报表生成器
            </h1>
            <p className="text-gray-600">
              多维度税务申报报表自动生成与历史追踪
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`btn-secondary ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw 
              size={18} 
              className={`${isRefreshing ? 'animate-spin' : ''} mr-2`}
            />
            刷新数据
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <FileText size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">历史记录</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.totalGenerated}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +12 份 本月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">待生成</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.pendingGeneration}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              处理中
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">失败次数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.failedGeneration}
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              重试队列
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">本月累计保费</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.thisMonthTotal)}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +15% 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Building size={24} className="text-indigo-600" />
              <span className="text-xs text-gray-500 font-medium">应税总额</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.totalTaxCollected)}
            </div>
            <div className="text-sm text-indigo-600 font-semibold">
              全年累计
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">平均文件大小</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatFileSize(mockMetrics.avgFileSize)}
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              PDF 为主
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">可用报表模板</h2>
          <button className="btn-primary">
            <Filter size={16} className="mr-2" />
            自定义模板
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockTemplates.map((template) => (
            <div
              key={template.id}
              className="glass p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <Building size={24} className="text-blue-600" />
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  template.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.status === 'active' ? '启用' : '归档'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                {template.name}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                {template.description}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>类型:</span>
                  <span className="font-semibold">{template.taxType}</span>
                </div>
                <div className="flex justify-between">
                  <span>频率:</span>
                  <span className="font-semibold capitalize">{template.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>辖区:</span>
                  <span className="font-semibold">{template.jurisdiction}</span>
                </div>
                {template.lastGenerated && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span>最后生成:</span>
                    <span className="font-semibold">{template.lastGenerated}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">时间范围:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="select"
            >
              <option value="this-month">本月</option>
              <option value="last-month">上月</option>
              <option value="year-to-date">本年至今</option>
            </select>
          </div>

          {/* Template Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">报表类型:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="select"
            >
              <option value="all">全部类型</option>
              {mockTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="completed">已完成</option>
              <option value="generating">生成中</option>
              <option value="failed">失败</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出汇总 CSV
            </button>
            <button className="btn-primary">
              <FileText size={16} className="mr-2" />
              生成新报表
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">生成的报表记录</h2>
          <span className="text-sm text-gray-600">{filteredReports.length} 条记录</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">报表名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">管辖权</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">期间</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保费总额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">佣金总额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">税额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">生成时间</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">大小/格式</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    report.status === 'failed' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{getTemplateName(report.templateName)}</div>
                    <div className="text-xs text-gray-500">{report.templateName}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    {report.jurisdiction}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    <div>{report.periodFrom}</div>
                    <div className="text-xs text-gray-400">至 {report.periodTo}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(report.totalPremium)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-orange-600">
                    {formatCurrency(report.totalCommission)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-red-600">
                    {formatCurrency(report.totalTax)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                    {report.generatedAt}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{formatFileSize(report.fileSize)}</div>
                    <div className="text-xs text-gray-500 uppercase">{report.format}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[report.status]}`}>
                      {report.status === 'completed' && '✓ 完成'}
                      {report.status === 'generating' && '⟳ 生成中'}
                      {report.status === 'failed' && '✗ 失败'}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-sm">
                        <Download size={14} className="mr-1" />
                        下载
                      </button>
                      {report.status === 'failed' && (
                        <button className="btn-secondary text-sm">
                          重新生成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无报表记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的税务报表数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(6, filteredReports.length)} 共 {filteredReports.length} 条
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled>
              上一页
            </button>
            <button className="btn-secondary">
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">生成中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">失败</span>
            </div>
          </div>
          <div className="text-gray-500">
            最后更新：{new Date().toLocaleString('en-US')}
          </div>
        </div>
      </div>
    </div>
  );
}
