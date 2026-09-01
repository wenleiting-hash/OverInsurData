import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { AlertTriangle, Clock, CheckCircle, XCircle, Bell, Filter, Download, RefreshCw } from 'lucide-react';

interface LicenseAlert {
  id: string;
  channelName: string;
  licenseType: string;
  licenseNumber: string;
  expiryDate: string;
  daysRemaining: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'notified' | 'reminded' | 'expired' | 'renewed';
  lastNotifiedAt?: string;
  renewalStatus: 'pending' | 'in-progress' | 'completed';
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - License alerts
const mockAlerts: LicenseAlert[] = [
  {
    id: 'alert1',
    channelName: '北京经纪门店',
    licenseType: 'NIPR Producer License',
    licenseNumber: 'BRK-BJ-2023-045',
    expiryDate: '2026-09-05',
    daysRemaining: 5,
    severity: 'critical',
    status: 'reminded',
    lastNotifiedAt: '2026-08-28',
    renewalStatus: 'in-progress',
  },
  {
    id: 'alert2',
    channelName: '上海代理点',
    licenseType: 'CA Medical Specialist License',
    licenseNumber: 'AGT-SH-MED-089',
    expiryDate: '2026-09-12',
    daysRemaining: 12,
    severity: 'high',
    status: 'notified',
    lastNotifiedAt: '2026-08-25',
    renewalStatus: 'pending',
  },
  {
    id: 'alert3',
    channelName: '广州 MG 公司',
    licenseType: 'TX MGA Appointment',
    licenseNumber: 'MG-GZ-TX-012',
    expiryDate: '2026-10-15',
    daysRemaining: 45,
    severity: 'medium',
    status: 'notified',
    lastNotifiedAt: '2026-08-20',
    renewalStatus: 'pending',
  },
  {
    id: 'alert4',
    channelName: '深圳 MGA 总部',
    licenseType: 'FL Comprehensive Agent',
    licenseNumber: 'MGA-GD-FL-001',
    expiryDate: '2026-12-31',
    daysRemaining: 122,
    severity: 'low',
    status: 'notified',
    lastNotifiedAt: '2026-08-15',
    renewalStatus: 'pending',
  },
  {
    id: 'alert5',
    channelName: '杭州保险经纪公司',
    licenseType: 'NY Life Insurance',
    licenseNumber: 'BRK-HZ-NY-078',
    expiryDate: '2026-08-31',
    daysRemaining: 0,
    severity: 'critical',
    status: 'expired',
    renewalStatus: 'pending',
  },
];

export default function LicenseExpiryReminderView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [alertCountdown, setAlertCountdown] = useState(30); // 30 seconds countdown for demo

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      notified: 'bg-blue-100 text-blue-700 border-blue-300',
      reminded: 'bg-orange-100 text-orange-700 border-orange-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
      renewed: 'bg-green-100 text-green-700 border-green-300',
    };
    const labels: Record<string, string> = {
      notified: '已通知',
      reminded: '再次提醒',
      expired: '已过期',
      renewed: '已续期',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getDaysRemainingBadge = (days: number) => {
    if (days <= 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold">
          ⚠️ 已过期
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold">
          {days}天内
        </span>
      );
    }
    if (days <= 14) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded-md text-xs font-bold">
          {days}天内
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border-yellow-300 rounded-md text-xs font-semibold">
          {days}天内
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md text-xs font-semibold">
        {days}天
      </span>
    );
  };

  const getRenewalStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      'in-progress': '处理中',
      completed: '已完成',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredData = mockAlerts.filter((alert) => {
    if (selectedSeverityFilter !== 'all' && alert.severity !== selectedSeverityFilter) return false;
    if (selectedStatusFilter !== 'all' && alert.status !== selectedStatusFilter) return false;
    return true;
  });

  // Statistics
  const stats = {
    totalAlerts: mockAlerts.length,
    criticalCount: mockAlerts.filter(a => a.daysRemaining <= 7).length,
    expiredCount: mockAlerts.filter(a => a.daysRemaining <= 0).length,
    inProgressRenewals: mockAlerts.filter(a => a.renewalStatus === 'in-progress').length,
    complianceRate: ((mockAlerts.filter(a => a.status !== 'expired').length / mockAlerts.length) * 100).toFixed(0),
    avgProcessingTime: 15, // days average to renew
  };

  const handleRefresh = () => {
    console.log('刷新许可证状态数据');
    setAlertCountdown(30);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('licenseExpiry') || '许可证到期提醒'}</h1>
        <p className="text-gray-600">{t('expiryDescription') || '监控渠道代理商各类许可证有效期并自动发送提醒'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">预警总数</h3>
            <Bell className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalAlerts}</p>
          <p className="text-xs text-gray-500">当前监控中</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">紧急预警</h3>
            <Clock className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.criticalCount}</p>
          <p className="text-xs text-red-600">⚠️ 需立即处理</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">已过期</h3>
            <XCircle className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.expiredCount}</p>
          <p className="text-xs text-orange-600">❌ 影响业务</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">续期中</h3>
            <RefreshCw className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgressRenewals}</p>
          <p className="text-xs text-blue-600">▶️ 跟进处理</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">合规率</h3>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.complianceRate}%</p>
          <p className="text-xs text-green-600">↑ 达标率高</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">平均周期</h3>
            <FileText className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.avgProcessingTime}天</p>
          <p className="text-xs text-gray-500">续费处理时长</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有严重程度</option>
              <option value="critical">严重</option>
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="notified">已通知</option>
              <option value="reminded">再次提醒</option>
              <option value="expired">已过期</option>
              <option value="renewed">已续期</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button 
              className="btn-secondary"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} className="mr-2" />
              刷新数据
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              导出清单
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
                  许可证类型
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  有效期倒计时
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  风险级别
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  续期进度
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((alert) => (
                <tr key={alert.id} className={`hover:bg-gray-50 transition-colors ${
                  alert.status === 'expired' ? 'bg-red-50' :
                  alert.severity === 'critical' ? 'bg-yellow-50' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{alert.channelName}</div>
                    <div className="text-xs text-gray-500 mt-1">牌照号：{alert.licenseNumber}</div>
                    {alert.lastNotifiedAt && (
                      <div className="text-xs text-gray-400 mt-1">上次通知：{alert.lastNotifiedAt}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{alert.licenseType}</div>
                    <div className="text-xs text-gray-500">到期：{alert.expiryDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDaysRemainingBadge(alert.daysRemaining)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.severity === 'critical' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold">
                        ⚡ 严重
                      </span>
                    )}
                    {alert.severity === 'high' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded-md text-xs font-semibold">
                        ⚠️ 高危
                      </span>
                    )}
                    {alert.severity === 'medium' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 border-yellow-300 rounded-md text-xs font-medium">
                        🔶 中危
                      </span>
                    )}
                    {alert.severity === 'low' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md text-xs font-medium">
                        🟢 低风险
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        {alert.status === 'renewed' && (
                          <CheckCircle size={14} className="text-green-600" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRenewalStatusBadge(alert.renewalStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                      查看详情 →
                    </button>
                    {alert.status !== 'renewed' && (
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        发起续期 →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="max-w-7xl mx-auto mt-12 text-center glass p-12 rounded-lg">
          <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预警记录</h3>
          <p className="text-gray-600 mb-4">当前筛选条件下没有预警记录</p>
          <button 
            className="btn-secondary"
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className="mr-2" />
            刷新数据
          </button>
        </div>
      )}

      {/* Quick Action Summary */}
      <div className="max-w-7xl mx-auto mt-6 glass p-6 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-600" size={20} />
          快速行动建议
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">需要立即处理</h3>
            <p className="text-2xl font-bold text-red-600">{stats.criticalCount}个</p>
            <p className="text-xs text-gray-600">≤7 天到期的许可证</p>
          </div>

          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">已过期需关注</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.expiredCount}个</p>
            <p className="text-xs text-gray-600">可能影响业务开展</p>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">批量续期窗口</h3>
            <p className="text-2xl font-bold text-blue-600">30-90天</p>
            <p className="text-xs text-gray-600">提前规划续期计划</p>
          </div>
        </div>
      </div>
    </div>
  );
}
