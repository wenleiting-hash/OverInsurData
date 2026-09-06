import { useState } from 'react';
import { ArrowLeft, Search, Filter, Clock, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import type { AppointmentRecord } from './data/mockComplianceData';
import { generateMockAppointmentRecords } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: string, params?: any) => void;
}

// Use Figma prototype data
const appointmentRecords: AppointmentRecord[] = generateMockAppointmentRecords();

export default function AppointmentStatusTrackingView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredApps = appointmentRecords.filter(app => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesState = stateFilter === 'ALL' || app.state === stateFilter;
    const matchesSearch = app.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.insurerShort.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesState && matchesSearch;
  });
  
  // Stats aligned with Figma prototype
  const stats = {
    total: appointmentRecords.length,
    approved: appointmentRecords.filter(a => a.status === 'approved').length,
    pending: appointmentRecords.filter(a => a.status === 'pending').length,
    underReview: appointmentRecords.filter(a => a.status === 'under-review').length,
    expired: appointmentRecords.filter(a => a.status === 'expired').length,
    terminated: appointmentRecords.filter(a => a.status === 'terminated').length,
    rejected: appointmentRecords.filter(a => a.status === 'rejected').length,
    expiringSoon90Days: appointmentRecords.filter(a => 
      a.daysToExpiry > 0 && a.daysToExpiry <= 90 && a.status === 'approved'
    ).length,
  };
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      'under-review': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      expired: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      terminated: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    };
    const s = styles[status] || styles.pending;
    return `${s.bg} ${s.text} ${s.border}`;
  };
  
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      approved: t('tracking.statusLabels.approved'),
      pending: t('tracking.statusLabels.pending'),
      'under-review': t('tracking.statusLabels.underReview'),
      rejected: t('tracking.statusLabels.rejected'),
      expired: t('tracking.statusLabels.expired'),
      terminated: t('tracking.statusLabels.terminated'),
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('dashboard')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> {t('tracking.backToDashboard')}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-purple-600" size={28}/>
          {t('tracking.title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('tracking.subtitle')}</p>
      </div>
      
      {/* Quick Stats */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-4 gap-4">
        <StatCard label={t('tracking.stats.total')} value={stats.total.toString()} icon={<FileText className="text-blue-600"/>} color="blue"/>
        <StatCard label={t('tracking.stats.underReview')} value={stats.underReview.toString()} warn={stats.underReview > 5} icon={<Clock className="text-orange-600"/>} color="orange"/>
        <StatCard label={t('tracking.stats.approved')} value={stats.approved.toString()} icon={<CheckCircle className="text-green-600"/>} color="green"/>
        <StatCard label={t('tracking.stats.expiringSoon')} value={stats.expiringSoon90Days.toString()} warn={stats.expiringSoon90Days > 0} icon={<Clock className="text-yellow-600"/>} color="yellow"/>
      </div>
      
      {/* Filters */}
      <div className="max-w-[1600px] mx-auto mb-4 card p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder={t('tracking.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="ALL">{t('tracking.filterAllStatuses')}</option>
            <option value="approved">{t('tracking.filterApproved')}</option>
            <option value="pending">{t('tracking.filterPending')}</option>
            <option value="under-review">{t('tracking.filterUnderReview')}</option>
            <option value="rejected">{t('tracking.filterRejected')}</option>
            <option value="expired">{t('tracking.filterExpired')}</option>
            <option value="terminated">{t('tracking.filterTerminated')}</option>
          </select>
          
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="ALL">{t('tracking.filterAllStates')}</option>
            <option value="CA">California</option>
            <option value="NY">New York</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="IL">Illinois</option>
            <option value="PA">Pennsylvania</option>
            <option value="OH">Ohio</option>
            <option value="GA">Georgia</option>
            <option value="NC">North Carolina</option>
          </select>
        </div>
      </div>
      
      {/* Applications Table */}
      <div className="max-w-[1600px] mx-auto card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">{t('tracking.listTitle', { count: filteredApps.length })}</h3>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.channelNpn')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.insurer')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.stateLine')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.dates')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.niprId')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking.col.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApps.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.id}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{app.channelName}</div>
                  <div className="text-xs text-gray-500 mt-1">NPN: {app.channelNpn}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div>{app.insurerShort}</div>
                  <div className="text-xs text-gray-500">{app.insurerName}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{app.state}</div>
                  <div className="text-xs text-gray-500">{app.line}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {t('tracking.submittedPrefix')}{new Date(app.submittedDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('tracking.expiresPrefix')}{new Date(app.expiryDate).toLocaleDateString()}
                  </div>
                  {app.processingDays && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('tracking.processedIn', { days: app.processingDays })}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 border rounded-md text-xs font-semibold ${getStatusBadge(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {app.niprTransactionId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => alert(`View details: ${app.id}`)} className="text-purple-600 hover:text-purple-900 mr-3">
                    <Eye size={16}/> {t('tracking.view')}
                  </button>
                  {(app.status === 'pending' || app.status === 'under-review') && (
                    <button className="text-blue-600 hover:text-blue-900">{t('tracking.edit')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Expiring Appointments Alert */}
      {stats.expiringSoon90Days > 0 && (
        <div className="max-w-[1600px] mx-auto mt-6">
          <div className="card p-4 bg-yellow-50 border-2 border-yellow-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Clock className="text-yellow-600 mt-0.5" size={20}/>
                <div>
                  <div className="font-semibold text-yellow-900 mb-1">
                    {t('tracking.expiringAlert', { count: stats.expiringSoon90Days })}
                  </div>
                  <div className="text-sm text-yellow-800">
                    {t('tracking.expiringAlertDesc')}
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-sm font-medium">
                {t('tracking.reviewRenewals')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Stat Card Component
const StatCard = ({ label, value, icon, warn, color }: { label: string; value: string; icon: React.ReactNode; warn?: boolean; color: string }) => (
  <div className={`glass p-6 rounded-lg ${warn ? `border-2 border-${color}-400` : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-1">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);
