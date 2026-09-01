import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  Play,
  Pause,
  ListTodo,
  ArrowRight
} from 'lucide-react';

interface BulkOperationJob {
  id: string;
  operationType: 'import' | 'export' | 'update' | 'delete' | 'approve';
  entityName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  itemsPreview: Array<{
    id: string;
    name: string;
    status: 'success' | 'error' | 'pending';
    message?: string;
  }>;
  createdBy: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Bulk operation jobs
const mockJobs: BulkOperationJob[] = [
  {
    id: 'job001',
    operationType: 'import',
    entityName: '渠道信息批量导入',
    status: 'completed',
    totalItems: 50,
    processedItems: 50,
    failedItems: 2,
    progress: 100,
    createdAt: '2026-08-30 14:30:00',
    startedAt: '2026-08-30 14:30:15',
    completedAt: '2026-08-30 14:35:42',
    createdBy: '管理员',
    itemsPreview: [
      { id: 'c101', name: '深圳新代理点 A', status: 'success' },
      { id: 'c102', name: '上海新代理点 B', status: 'success' },
      { id: 'c103', name: '广州新代理点 C', status: 'error', message: '重复的许可证号' },
    ],
  },
  {
    id: 'job002',
    operationType: 'export',
    entityName: '产品费率表导出',
    status: 'running',
    totalItems: 1200,
    processedItems: 856,
    failedItems: 0,
    progress: 71,
    createdAt: '2026-08-31 10:00:00',
    startedAt: '2026-08-31 10:00:30',
    createdBy: '财务专员',
    itemsPreview: [],
  },
  {
    id: 'job003',
    operationType: 'update',
    entityName: '佣金费率批量调整',
    status: 'pending',
    totalItems: 45,
    processedItems: 0,
    failedItems: 0,
    progress: 0,
    createdAt: '2026-08-31 11:20:00',
    createdBy: '运营经理',
    itemsPreview: [],
  },
  {
    id: 'job004',
    operationType: 'approve',
    entityName: 'Appointment 申请批量审批',
    status: 'paused',
    totalItems: 120,
    processedItems: 67,
    failedItems: 3,
    progress: 56,
    createdAt: '2026-08-30 16:00:00',
    startedAt: '2026-08-30 16:05:00',
    createdBy: '合规审核员',
    itemsPreview: [
      { id: 'app501', name: 'NY 州代理人张三', status: 'success' },
      { id: 'app502', name: 'CA 州代理人李四', status: 'error', message: '牌照未验证' },
    ],
  },
  {
    id: 'job005',
    operationType: 'delete',
    entityName: '历史数据归档删除',
    status: 'failed',
    totalItems: 5000,
    processedItems: 1234,
    failedItems: 89,
    progress: 25,
    createdAt: '2026-08-29 09:00:00',
    startedAt: '2026-08-29 09:00:45',
    completedAt: '2026-08-29 09:45:30',
    createdBy: '系统管理员',
    itemsPreview: [],
  },
];

export function BulkOperationsView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const filteredJobs = mockJobs.filter(job => 
    selectedStatusFilter === 'all' || job.status === selectedStatusFilter
  );

  const formatProgress = (progress: number) => {
    return `${progress.toFixed(1)}%`;
  };

  const getOperationLabel = (type: BulkOperationJob['operationType']) => {
    const labels: Record<BulkOperationJob['operationType'], string> = {
      import: '批量导入',
      export: '批量导出',
      update: '批量更新',
      delete: '批量删除',
      approve: '批量审批',
    };
    return labels[type];
  };

  const getStatusIcon = (status: BulkOperationJob['status']) => {
    switch (status) {
      case 'pending':
        return <ListTodo size={16} className="text-yellow-600" />;
      case 'running':
        return <Play size={16} className="text-blue-600" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      case 'paused':
        return <Pause size={16} className="text-orange-600" />;
    }
  };

  const getStatusBadge = (status: BulkOperationJob['status']) => {
    const colors: Record<BulkOperationJob['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    const labels: Record<BulkOperationJob['status'], string> = {
      pending: '待执行',
      running: '执行中',
      completed: '已完成',
      failed: '已失败',
      paused: '已暂停',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              批量操作优化面板
            </h1>
            <p className="text-gray-600">
              大规模数据处理、异步任务追踪与进度实时监控
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Upload size={16} className="mr-2" />
              新建导入任务
            </button>
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              新建导出任务
            </button>
            <button className="btn-primary">
              <FileText size={16} className="mr-2" />
              新建批量任务
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <ListTodo size={24} className="text-yellow-600" />
              <span className="text-xs text-gray-500 font-medium">待执行</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockJobs.filter(j => j.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600 font-semibold">
              队列排队中
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Play size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">执行中</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockJobs.filter(j => j.status === 'running').length}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              进行中任务
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">已完成</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockJobs.filter(j => j.status === 'completed').length}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              成功率 100%
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">已失败</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockJobs.filter(j => j.status === 'failed').length}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              需人工介入
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <ArrowRight size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">总处理项数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockJobs.reduce((sum, j) => sum + j.processedItems, 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              已全部完成
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">任务状态:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="pending">待执行</option>
              <option value="running">执行中</option>
              <option value="completed">已完成</option>
              <option value="failed">已失败</option>
              <option value="paused">已暂停</option>
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700">自动刷新 (每 5 秒)</span>
            </label>
            {isAutoRefresh && (
              <div className="text-sm text-blue-600 font-semibold animate-pulse">
                ● 实时同步中...
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              刷新列表
            </button>
            <button className="btn-secondary">
              <Filter size={16} className="mr-2" />
              高级筛选
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">批量操作任务列表</h2>
          <span className="text-sm text-gray-600">{filteredJobs.length} 个任务</span>
        </div>

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`p-6 rounded-lg border transition-colors hover:shadow-md ${
                job.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : job.status === 'running'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section - Basic Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(job.status)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{job.entityName}</div>
                        <div className="text-xs text-gray-500">
                          {getOperationLabel(job.operationType)} • #{job.id}
                        </div>
                      </div>
                    </div>
                    <div>{getStatusBadge(job.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">创建时间</div>
                      <div className="text-sm font-semibold text-gray-700">{job.createdAt}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">创建人</div>
                      <div className="text-sm font-semibold text-gray-700">{job.createdBy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">处理进度</div>
                      <div className="text-sm font-semibold text-gray-700">
                        {job.processedItems.toLocaleString()} / {job.totalItems.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">失败项数</div>
                      <div className={`text-sm font-bold ${
                        job.failedItems > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {job.failedItems.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">处理进度</span>
                      <span className="font-bold text-blue-600">{formatProgress(job.progress)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          job.status === 'failed'
                            ? 'bg-red-500'
                            : job.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline Info */}
                  {(job.startedAt || job.completedAt) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                      {job.startedAt && (
                        <div className="flex items-center gap-1">
                          <Play size={12} />
                          <span>开始：{job.startedAt}</span>
                        </div>
                      )}
                      {job.completedAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={12} />
                          <span>完成：{job.completedAt}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Section - Preview Items */}
                {job.itemsPreview.length > 0 && (
                  <div className="lg:w-80 border-l border-gray-200 pl-6">
                    <div className="text-sm font-semibold text-gray-700 mb-3">样例预览</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {job.itemsPreview.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded text-xs border ${
                            item.status === 'success'
                              ? 'bg-green-50 border-green-200'
                              : item.status === 'error'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {item.status === 'success' ? (
                              <CheckCircle size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle size={12} className="text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold">{item.name}</div>
                              {item.message && (
                                <div className="text-red-600 mt-1">{item.message}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {job.status === 'pending' && (
                    <>
                      <button className="btn-primary text-sm">
                        <Play size={14} className="mr-1" />
                        开始执行
                      </button>
                      <button className="btn-secondary text-sm">
                        取消任务
                      </button>
                    </>
                  )}
                  {job.status === 'running' && (
                    <>
                      <button className="btn-secondary text-sm">
                        <Pause size={14} className="mr-1" />
                        暂停任务
                      </button>
                      <button className="btn-secondary text-sm">
                        查看日志
                      </button>
                    </>
                  )}
                  {job.status === 'completed' && (
                    <>
                      <button className="btn-secondary text-sm">
                        <Download size={14} className="mr-1" />
                        下载报告
                      </button>
                      <button className="btn-secondary text-sm">
                        查看详情
                      </button>
                    </>
                  )}
                  {job.status === 'failed' && (
                    <>
                      <button className="btn-secondary text-sm">
                        重试任务
                      </button>
                      <button className="btn-secondary text-sm">
                        错误报告
                      </button>
                    </>
                  )}
                  {job.status === 'paused' && (
                    <>
                      <button className="btn-primary text-sm">
                        <Play size={14} className="mr-1" />
                        继续执行
                      </button>
                      <button className="btn-secondary text-sm">
                        取消任务
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <ListTodo size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无任务记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的任务数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(5, filteredJobs.length)} 共 {filteredJobs.length} 个任务
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

      {/* Footer Note */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <AlertTriangle size={16} className="text-orange-600" />
          <div>
            <strong>提示：</strong>批量操作建议在非业务高峰期执行；超过 1000 条数据的任务将异步处理并发送通知
          </div>
        </div>
      </div>
    </div>
  );
}
