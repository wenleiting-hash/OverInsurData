import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { AlertTriangle, Clock, CheckCircle, XCircle, Bell, Filter, Download, RefreshCw, FileText } from 'lucide-react';
import { useLicenseReminders } from '@/services/complianceService';

interface LicenseAlert {
  id: string;
  channelName: string;
  channelNameEn: string;
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

// API data
export default function LicenseExpiryReminderView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('compliance');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const { data: remindersRes, isLoading } = useLicenseReminders();
  const alerts: any[] = remindersRes?.data ?? [];
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [alertCountdown, setAlertCountdown] = useState(30);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      notified: 'bg-blue-100 text-blue-700 border-blue-300',
      reminded: 'bg-orange-100 text-orange-700 border-orange-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
      renewed: 'bg-green-100 text-green-700 border-green-300',
    };
    const labels: Record<string, string> = {
      notified: t('licenseExpiry.status.notified'),
      reminded: t('licenseExpiry.status.reminded'),
      expired: t('licenseExpiry.status.expired'),
      renewed: t('licenseExpiry.status.renewed'),
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
          {t('licenseExpiry.daysRemaining.expired')}
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold">
          {t('licenseExpiry.daysRemaining.within', { days })}
        </span>
      );
    }
    if (days <= 14) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 border-orange-300 rounded-md text-xs font-bold">
          {t('licenseExpiry.daysRemaining.within', { days })}
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border-yellow-300 rounded-md text-xs font-semibold">
          {t('licenseExpiry.daysRemaining.within', { days })}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md text-xs font-semibold">
        {t('licenseExpiry.daysRemaining.days', { days })}
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
      pending: t('licenseExpiry.renewalStatus.pending'),
      'in-progress': t('licenseExpiry.renewalStatus.inProgress'),
      completed: t('licenseExpiry.renewalStatus.completed'),
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredData = alerts.filter((alert) => {
    if (selectedSeverityFilter !== 'all' && alert.severity !== selectedSeverityFilter) return false;
    if (selectedStatusFilter !== 'all' && alert.status !== selectedStatusFilter) return false;
    return true;
  });

  // Statistics
  const stats = {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.daysRemaining <= 7).length,
    expiredCount: alerts.filter(a => a.daysRemaining <= 0).length,
    inProgressRenewals: alerts.filter(a => a.renewalStatus === 'in-progress').length,
    complianceRate: alerts.length > 0 ? ((alerts.filter(a => a.status !== 'expired').length / alerts.length) * 100).toFixed(0) : '0',
    avgProcessingTime: 15, // days average to renew
  };

  const handleRefresh = () => {
    console.log(t('licenseExpiry.refreshLog'));
    setAlertCountdown(30);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('licenseExpiry.title')}</h1>
        <p className="text-gray-600">{t('licenseExpiry.description')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.totalAlerts')}</h3>
            <Bell className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalAlerts}</p>
          <p className="text-xs text-gray-500">{t('licenseExpiry.stats.totalAlertsSub')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.criticalAlerts')}</h3>
            <Clock className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.criticalCount}</p>
          <p className="text-xs text-red-600">{t('licenseExpiry.stats.criticalAlertsSub')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.expired')}</h3>
            <XCircle className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.expiredCount}</p>
          <p className="text-xs text-orange-600">{t('licenseExpiry.stats.expiredSub')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.inProgress')}</h3>
            <RefreshCw className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgressRenewals}</p>
          <p className="text-xs text-blue-600">{t('licenseExpiry.stats.inProgressSub')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.complianceRate')}</h3>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.complianceRate}%</p>
          <p className="text-xs text-green-600">{t('licenseExpiry.stats.complianceRateSub')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('licenseExpiry.stats.avgCycle')}</h3>
            <FileText className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{t('licenseExpiry.stats.avgProcessingDays', { n: stats.avgProcessingTime })}</p>
          <p className="text-xs text-gray-500">{t('licenseExpiry.stats.avgCycleSub')}</p>
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
              <option value="all">{t('licenseExpiry.filter.allSeverities')}</option>
              <option value="critical">{t('licenseExpiry.filter.severityCritical')}</option>
              <option value="high">{t('licenseExpiry.filter.severityHigh')}</option>
              <option value="medium">{t('licenseExpiry.filter.severityMedium')}</option>
              <option value="low">{t('licenseExpiry.filter.severityLow')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('licenseExpiry.filter.allStatuses')}</option>
              <option value="notified">{t('licenseExpiry.filter.statusNotified')}</option>
              <option value="reminded">{t('licenseExpiry.filter.statusReminded')}</option>
              <option value="expired">{t('licenseExpiry.filter.statusExpired')}</option>
              <option value="renewed">{t('licenseExpiry.filter.statusRenewed')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="btn-secondary"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} className="mr-2" />
              {t('licenseExpiry.action.refreshData')}
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              {t('licenseExpiry.action.exportList')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(246,248,255,0.9)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colChannel')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colLicenseType')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colCountdown')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colSeverity')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colStatus')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colRenewalProgress')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('licenseExpiry.table.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-[rgba(255,255,255,0.95)] divide-y divide-[rgba(193,198,215,0.25)]">
              {filteredData.map((alert, idx) => (
                <tr key={alert.id} className={`hover:bg-[rgba(246,248,255,0.55)] transition-colors ${
                  alert.status === 'expired' ? 'bg-red-50' :
                  alert.severity === 'critical' ? 'bg-yellow-50' : ''
                }`} style={alert.status !== 'expired' && alert.severity !== 'critical' ? { background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' } : undefined}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{isEn ? alert.channelNameEn : alert.channelName}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('licenseExpiry.table.licenseNumberLabel')}{alert.licenseNumber}</div>
                    {alert.lastNotifiedAt && (
                      <div className="text-xs text-gray-400 mt-1">{t('licenseExpiry.table.lastNotifiedLabel')}{alert.lastNotifiedAt}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{alert.licenseType}</div>
                    <div className="text-xs text-gray-500">{t('licenseExpiry.table.expiryLabel')}{alert.expiryDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDaysRemainingBadge(alert.daysRemaining)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.severity === 'critical' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold">
                        {t('licenseExpiry.severity.critical')}
                      </span>
                    )}
                    {alert.severity === 'high' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 border-orange-300 rounded-md text-xs font-semibold">
                        {t('licenseExpiry.severity.high')}
                      </span>
                    )}
                    {alert.severity === 'medium' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 border-yellow-300 rounded-md text-xs font-medium">
                        {t('licenseExpiry.severity.medium')}
                      </span>
                    )}
                    {alert.severity === 'low' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 border-green-300 rounded-md text-xs font-medium">
                        {t('licenseExpiry.severity.low')}
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
                      {t('licenseExpiry.action.viewDetail')}
                    </button>
                    {alert.status !== 'renewed' && (
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        {t('licenseExpiry.action.startRenewal')}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('licenseExpiry.empty.title')}</h3>
          <p className="text-gray-600 mb-4">{t('licenseExpiry.empty.desc')}</p>
          <button
            className="btn-secondary"
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className="mr-2" />
            {t('licenseExpiry.action.refreshData')}
          </button>
        </div>
      )}

      {/* Quick Action Summary */}
      <div className="max-w-7xl mx-auto mt-6 glass p-6 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-600" size={20} />
          {t('licenseExpiry.quickAction.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">{t('licenseExpiry.quickAction.immediateTitle')}</h3>
            <p className="text-2xl font-bold text-red-600">{t('licenseExpiry.quickAction.immediateCount', { n: stats.criticalCount })}</p>
            <p className="text-xs text-gray-600">{t('licenseExpiry.quickAction.immediateDesc')}</p>
          </div>

          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">{t('licenseExpiry.quickAction.expiredTitle')}</h3>
            <p className="text-2xl font-bold text-yellow-600">{t('licenseExpiry.quickAction.expiredCount', { n: stats.expiredCount })}</p>
            <p className="text-xs text-gray-600">{t('licenseExpiry.quickAction.expiredDesc')}</p>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-bold text-gray-900 mb-2">{t('licenseExpiry.quickAction.batchTitle')}</h3>
            <p className="text-2xl font-bold text-blue-600">{t('licenseExpiry.quickAction.batchRange')}</p>
            <p className="text-xs text-gray-600">{t('licenseExpiry.quickAction.batchDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
