import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileArchive, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  Settings,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Copy,
  Eye
} from 'lucide-react';

interface ExportTask {
  id: string;
  taskName: string;
  exportType: 'excel' | 'pdf' | 'csv' | 'json' | 'xml';
  dataSource: string;
  recordCount: number;
  fileSize: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

interface ExportTemplate {
  id: string;
  templateName: string;
  format: 'excel' | 'pdf' | 'csv';
  category: 'finance' | 'product' | 'channel' | 'insurance' | 'system';
  description: string;
  lastUsed: string;
  usageCount: number;
}

interface ExportConfig {
  id: string;
  configName: string;
  autoExportEnabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  nextRunTime: string;
  outputFormat: string;
  recipientEmail: string[];
  compressionEnabled: boolean;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const DataExportGatewayView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['export', 'channel']);

  // Mock data - 导出任务列表
  const [exportTasks] = useState<ExportTask[]>([
    {
      id: 'task001',
      taskName: '2024 年 Q3 财务结算报告',
      exportType: 'excel',
      dataSource: 'Finance Reconciliation Module',
      recordCount: 25840,
      fileSize: '12.5 MB',
      status: 'completed',
      createdAt: '2024-08-25T10:30:00Z',
      completedAt: '2024-08-25T10:35:23Z',
      downloadUrl: '/downloads/finance-q3-report.xlsx',
    },
    {
      id: 'task002',
      taskName: '渠道绩效考核分析表',
      exportType: 'pdf',
      dataSource: 'Channel Performance Module',
      recordCount: 1250,
      fileSize: '8.2 MB',
      status: 'completed',
      createdAt: '2024-08-26T14:20:00Z',
      completedAt: '2024-08-26T14:23:15Z',
      downloadUrl: '/downloads/channel-performance-q3.pdf',
    },
    {
      id: 'task003',
      taskName: '产品费率配置快照',
      exportType: 'json',
      dataSource: 'Rate Plan Engine',
      recordCount: 5420,
      fileSize: '3.8 MB',
      status: 'processing',
      createdAt: '2024-08-31T09:15:00Z',
    },
    {
      id: 'task004',
      taskName: '保险公司主数据备份',
      exportType: 'csv',
      dataSource: 'Insurer Master Data',
      recordCount: 850,
      fileSize: '2.1 MB',
      status: 'completed',
      createdAt: '2024-08-30T16:45:00Z',
      completedAt: '2024-08-30T16:47:32Z',
      downloadUrl: '/downloads/insurers-backup.csv',
    },
    {
      id: 'task005',
      taskName: 'EDI 835 交易记录原始数据',
      exportType: 'xml',
      dataSource: 'EDI 835 Integration Manager',
      recordCount: 12500,
      fileSize: '15.6 MB',
      status: 'pending',
      createdAt: '2024-08-31T11:30:00Z',
    },
    {
      id: 'task006',
      taskName: '批量用户权限审计报告',
      exportType: 'excel',
      dataSource: 'RBAC Permission System',
      recordCount: 0,
      fileSize: '0 B',
      status: 'failed',
      createdAt: '2024-08-29T08:00:00Z',
      completedAt: '2024-08-29T08:02:15Z',
      errorMessage: 'Database connection timeout after 120s',
    },
  ]);

  // Mock data - 导出模板库
  const [exportTemplates] = useState<ExportTemplate[]>([
    { id: 'tmpl001', templateName: '财务报告标准模板', format: 'excel', category: 'finance', description: '包含总账、明细账、科目余额表', lastUsed: '2024-08-25', usageCount: 156 },
    { id: 'tmpl002', templateName: '季度绩效看板 PDF', format: 'pdf', category: 'channel', description: '渠道绩效考核图表与排名', lastUsed: '2024-08-26', usageCount: 89 },
    { id: 'tmpl003', templateName: '保险单批量导入 CSV', format: 'csv', category: 'insurance', description: '新保单批量导入数据格式', lastUsed: '2024-08-28', usageCount: 234 },
    { id: 'tmpl004', templateName: '产品元数据 JSON', format: 'excel', category: 'product', description: '产品信息结构化导出', lastUsed: '2024-08-27', usageCount: 67 },
    { id: 'tmpl005', templateName: '系统操作日志 CSV', format: 'csv', category: 'system', description: '审计追踪日志数据', lastUsed: '2024-08-30', usageCount: 45 },
  ]);

  // Mock data - 定时导出配置
  const [exportConfigs] = useState<ExportConfig[]>([
    {
      id: 'cfg001',
      configName: '每日财务对账报表',
      autoExportEnabled: true,
      schedule: 'daily',
      nextRunTime: '2024-08-32 02:00:00',
      outputFormat: 'Excel (.xlsx)',
      recipientEmail: ['finance@company.com'],
      compressionEnabled: true,
    },
    {
      id: 'cfg002',
      configName: '周度渠道汇总分析',
      autoExportEnabled: true,
      schedule: 'weekly',
      nextRunTime: '2024-09-01 00:00:00',
      outputFormat: 'PDF',
      recipientEmail: ['channel-mgr@company.com', 'analytics@company.com'],
      compressionEnabled: false,
    },
    {
      id: 'cfg003',
      configName: '月度合规审计报告',
      autoExportEnabled: false,
      schedule: 'monthly',
      nextRunTime: '2024-09-05 08:00:00',
      outputFormat: 'PDF',
      recipientEmail: ['compliance@company.com'],
      compressionEnabled: true,
    },
  ]);

  const completedTasks = exportTasks.filter(t => t.status === 'completed').length;
  const processingTasks = exportTasks.filter(t => t.status === 'processing').length;
  const failedTasks = exportTasks.filter(t => t.status === 'failed').length;
  const totalRecordsExported = exportTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.recordCount, 0);

  const getExportTypeIcon = (type: string) => {
    switch (type) {
      case 'excel':
        return <FileSpreadsheet className="text-green-600" size={24} />;
      case 'pdf':
        return <FileText className="text-red-600" size={24} />;
      case 'csv':
        return <FileSpreadsheet className="text-blue-600" size={24} />;
      case 'json':
        return <FileText className="text-yellow-600" size={24} />;
      case 'xml':
        return <FileText className="text-purple-600" size={24} />;
      default:
        return <Download className="text-gray-600" size={24} />;
    }
  };

  const getExportTypeLabel = (type: string) => {
    switch (type) {
      case 'excel':
        return 'Excel';
      case 'pdf':
        return 'PDF';
      case 'csv':
        return 'CSV';
      case 'json':
        return 'JSON';
      case 'xml':
        return 'XML';
      default:
        return type.toUpperCase();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleExportNow = () => {
    alert('正在生成新的导出任务...');
  };

  const handleDownloadFile = (url: string, filename: string) => {
    alert(`正在下载文件：${filename}`);
  };

  const handleRetryFailedTask = (taskId: string) => {
    alert(`已重新尝试导出任务：${taskId}`);
  };

  const handleCopyExportLink = (taskId: string) => {
    alert(`已复制导出任务链接：${taskId}`);
  };

  const handleConfigureAutoExport = () => {
    alert('正在打开定时导出配置对话框...');
  };

  const handleDownloadTemplate = (templateId: string) => {
    alert(`正在下载模板：${templateId}`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
              <Download className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                数据导出网关
              </h1>
              <p className="text-gray-600">Data Export Gateway & Template Management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleConfigureAutoExport}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Settings size={18} />
              配置定时导出
            </button>
            <button
              onClick={handleExportNow}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              立即导出
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <FileArchive className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{exportTasks.length}</div>
          <div className="text-sm text-gray-600">总导出任务</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs text-emerald-600 font-semibold">{(completedTasks / exportTasks.length * 100).toFixed(0)}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{completedTasks}</div>
          <div className="text-sm text-gray-600">成功完成</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <RefreshCw className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{processingTasks}</div>
          <div className="text-sm text-gray-600">处理中</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <XCircle className="text-red-600" size={24} />
            </div>
            <span className="text-xs text-red-600 font-semibold">需重试</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{failedTasks}</div>
          <div className="text-sm text-gray-600">失败任务</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalRecordsExported.toLocaleString()}</div>
          <div className="text-sm text-gray-600">总导出数据行数</div>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Eye className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">选择数据源与导出格式</h2>
              <p className="text-sm text-gray-500">Select Data Source & Export Format</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: 'Excel', icon: FileSpreadsheet, color: 'from-green-500 to-emerald-500', text: 'text-green-700', desc: '带公式与图表的复杂表格' },
            { name: 'PDF', icon: FileText, color: 'from-red-500 to-rose-500', text: 'text-red-700', desc: '固定布局的正式文档' },
            { name: 'CSV', icon: FileSpreadsheet, color: 'from-blue-500 to-cyan-500', text: 'text-blue-700', desc: '轻量级逗号分隔文本' },
            { name: 'JSON', icon: FileText, color: 'from-yellow-500 to-amber-500', text: 'text-yellow-700', desc: '结构化开发数据交换' },
            { name: 'XML', icon: FileText, color: 'from-purple-500 to-violet-500', text: 'text-purple-700', desc: '标签化的企业数据格式' },
          ].map((format) => (
            <button
              key={format.name}
              className={`p-4 bg-gradient-to-br ${format.color} rounded-xl hover:shadow-lg transition-all cursor-pointer group`}
            >
              <format.icon className="text-white mb-2 group-hover:scale-110 transition-transform" size={32} />
              <div className="font-bold text-white mb-1">{format.name}</div>
              <div className={`text-xs ${format.text} opacity-90`}>{format.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Tasks Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">最近导出任务</h2>
            <p className="text-sm text-gray-500">Recent Export Tasks History</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                <option value="">所有格式</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                <option value="">所有状态</option>
                <option value="completed">已完成</option>
                <option value="processing">处理中</option>
                <option value="pending">待处理</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">任务名称</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">导出格式</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">数据源</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">记录数</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">文件大小</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">创建时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {exportTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-orange-50/50 border-b border-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{task.taskName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getExportTypeIcon(task.exportType)}
                      <span className={`px-2.5 py-1 rounded-lg font-semibold text-sm ${
                        task.exportType === 'excel' ? 'bg-green-100 text-green-700' :
                        task.exportType === 'pdf' ? 'bg-red-100 text-red-700' :
                        task.exportType === 'csv' ? 'bg-blue-100 text-blue-700' :
                        task.exportType === 'json' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {getExportTypeLabel(task.exportType)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 truncate max-w-xs">{task.dataSource}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                    {task.recordCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{task.fileSize}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(task.createdAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(task.status)}`}>
                      {task.status === 'completed' && '✓ 完成'}
                      {task.status === 'processing' && '● 处理中'}
                      {task.status === 'pending' && '○ 待处理'}
                      {task.status === 'failed' && '✗ 失败'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && task.downloadUrl && (
                        <button
                          onClick={() => handleDownloadFile(task.downloadUrl || '', `${task.taskName}.download`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Download size={14} />
                          下载
                        </button>
                      )}
                      {task.status === 'failed' && (
                        <button
                          onClick={() => handleRetryFailedTask(task.id)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          重试
                        </button>
                      )}
                      {(task.status === 'completed' || task.status === 'failed') && (
                        <button
                          onClick={() => handleCopyExportLink(task.id)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="复制链接"
                        >
                          <Copy size={14} className="text-gray-600" />
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button
                          onClick={() => alert('查看导出预览')}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="预览"
                        >
                          <Eye size={14} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Templates Section */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl">
              <Copy className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">导出模板库</h2>
              <p className="text-sm text-gray-500">Pre-built Export Templates Library</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-medium transition-colors">
            + 新建模板
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {exportTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  template.format === 'excel' ? 'bg-green-200 text-green-700' :
                  template.format === 'pdf' ? 'bg-red-200 text-red-700' : 'bg-blue-200 text-blue-700'
                }`}>
                  {template.format.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{template.usageCount}次使用</span>
              </div>
              <div className="font-bold text-gray-900 mb-1 truncate">{template.templateName}</div>
              <div className="text-sm text-gray-600 mb-2">{template.description}</div>
              <div className="text-xs text-gray-400">最后使用：{template.lastUsed}</div>
              <button
                onClick={() => handleDownloadTemplate(template.id)}
                className="mt-3 w-full px-3 py-2 bg-white hover:bg-gray-50 text-teal-700 rounded-lg text-sm font-medium transition-colors border border-teal-300"
              >
                下载模板
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Export Configuration */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">定时导出配置</h2>
              <p className="text-sm text-gray-500">Scheduled Auto-Export Configuration</p>
            </div>
          </div>
          <button
            onClick={handleConfigureAutoExport}
            className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg font-medium transition-colors"
          >
            + 添加新计划
          </button>
        </div>

        <div className="space-y-3">
          {exportConfigs.map((config) => (
            <div
              key={config.id}
              className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-pink-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-lg ${config.autoExportEnabled ? 'bg-pink-100' : 'bg-gray-100'}`}>
                  <Clock className={config.autoExportEnabled ? 'text-pink-600' : 'text-gray-400'} size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    {config.configName}
                    {config.autoExportEnabled && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        ✓ 启用
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>周期：{config.schedule === 'daily' ? '每日' : config.schedule === 'weekly' ? '每周' : '每月'}</span>
                    <span>输出：{config.outputFormat}</span>
                    <span>收件人：{config.recipientEmail.length}个邮箱</span>
                    <span>下次运行：{config.nextRunTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  config.autoExportEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {config.compressionEnabled && '🔒 压缩'}
                </span>
                <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors">
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg mt-0.5">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-orange-900 mb-2">AI 导出优化与性能建议</div>
            <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
              <li>检测到「批量用户权限审计报告」导出失败，原因为数据库连接超时，建议在非高峰时段（凌晨 2-4 点）运行大数据量导出</li>
              <li>当前 Excel 导出占比 40%，CSV 仅占 17%。如果主要面向开发人员，建议增加 JSON/XML 格式导出比例</li>
              <li>「每日财务对账报表」启用了自动压缩（gzip），节省存储空间约 65%，这是最佳实践</li>
              <li>最近 30 天共导出 38,590 条记录，平均耗时 3.2 分钟。如果超过 10 万条记录，建议使用后台异步任务模式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportGatewayView;
