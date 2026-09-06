import { useState } from 'react';
import { ArrowLeft, Calendar, Plus, CheckCircle, AlertTriangle, Search, Filter, Clock } from 'lucide-react';
import type { AppointmentRecord } from './data/mockComplianceData';
import { generateMockAppointmentRecords } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: string, params?: any) => void;
}

// Use Figma prototype data
const appointmentRecords: AppointmentRecord[] = generateMockAppointmentRecords();

export default function AppointmentRenewalView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expiring within 90 days (prioritized by urgency)
  const expiringApps = appointmentRecords.filter(app => 
    app.daysToExpiry > 0 && app.daysToExpiry <= 90 && app.status === 'approved'
  ).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  
  const filteredApps = expiringApps.filter(app => {
    const matchesStatus = statusFilter === 'ALL' || app.renewalStatus === statusFilter;
    const matchesSearch = app.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.insurerShort.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Statistics
  const stats = {
    totalExpiring90Days: expiringApps.length,
    urgent30Days: expiringApps.filter(a => a.daysToExpiry <= 30).length,
    dueSoon60Days: expiringApps.filter(a => a.daysToExpiry > 30 && a.daysToExpiry <= 60).length,
    mildWarning90Days: expiringApps.filter(a => a.daysToExpiry > 60 && a.daysToExpiry <= 90).length,
    inProgress: expiringApps.filter(a => a.renewalStatus === 'in-progress').length,
    renewed: expiringApps.filter(a => a.renewalStatus === 'renewed').length,
  };
  
  const getStatusColor = (daysRemaining: number, renewalStatus?: string) => {
    if (renewalStatus === 'renewed') return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✓' };
    if (renewalStatus === 'in-progress') return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '⟳' };
    if (daysRemaining <= 30) return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '⚠' };
    if (daysRemaining <= 60) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '⚡' };
    return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '📅' };
  };
  
  const getUrgencyLabel = (daysRemaining: number): string => {
    if (daysRemaining <= 7) return t('renewal.urgency.critical');
    if (daysRemaining <= 30) return t('renewal.urgency.urgent');
    if (daysRemaining <= 60) return t('renewal.urgency.warning');
    if (daysRemaining <= 90) return t('renewal.urgency.dueSoon');
    return t('renewal.urgency.upcoming');
  };
  
  const handleBatchRenew = () => {
    const selected = filteredApps.filter(a => a.renewalStatus !== 'renewed');
    if (selected.length > 0) {
      alert(t('renewal.alert.batchRenew', { count: selected.length }));
    }
  };
  
  const startRenewal = (app: AppointmentRecord) => {
    const daysUntilExp = getDaysUntilExpiration(app.expiryDate);
    alert(t('renewal.alert.startRenewal', {
      id: app.id,
      channelName: app.channelName,
      channelNpn: app.channelNpn,
      insurerShort: app.insurerShort,
      state: app.state,
      line: app.line,
      daysUntilExp,
    }));
  };
  
  const getDaysUntilExpiration = (expirationDate: string): number => {
    return Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('dashboard')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> {t('renewal.backToDashboard')}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="text-yellow-600" size={28}/>
          {t('renewal.title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('renewal.subtitle')}</p>
      </div>
      
      {/* Urgent Alerts */}
      {stats.urgent30Days > 0 && (
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="card p-4 bg-red-50 border-2 border-red-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5" size={20}/>
                <div>
                  <div className="font-semibold text-red-900 mb-1">
                    {t('renewal.urgentAlert', { count: stats.urgent30Days })}
                  </div>
                  <div className="text-sm text-red-800">
                    {t('renewal.urgentAlertDesc')}
                  </div>
                </div>
                <button 
                  onClick={() => startRenewal(filteredApps[0])}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  {t('renewal.renewNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-5 gap-4">
        <StatCard label={t('renewal.stats.expiring90D')} value={stats.totalExpiring90Days.toString()} icon={<Calendar className="text-yellow-600"/>} color="yellow"/>
        <StatCard label={t('renewal.stats.critical30D')} value={stats.urgent30Days.toString()} warn={stats.urgent30Days > 0} icon={<AlertTriangle className="text-red-600"/>} color="red"/>
        <StatCard label={t('renewal.stats.inProgress')} value={stats.inProgress.toString()} icon={<Clock className="text-blue-600"/>} color="blue"/>
        <StatCard label={t('renewal.stats.renewed')} value={stats.renewed.toString()} icon={<CheckCircle className="text-green-600"/>} color="green"/>
        <StatCard label={t('renewal.stats.mildWarning')} value={stats.mildWarning90Days.toString()} icon={<Filter className="text-gray-600"/>} color="gray"/>
      </div>
      
      {/* Filters & Actions */}
      <div className="max-w-[1600px] mx-auto mb-4 card p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder={t('renewal.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          >
            <option value="ALL">{t('renewal.filterAllStatuses')}</option>
            <option value="not-due">{t('renewal.filterNotDue')}</option>
            <option value="due-soon">{t('renewal.filterDueSoon')}</option>
            <option value="in-progress">{t('renewal.filterInProgress')}</option>
            <option value="renewed">{t('renewal.filterRenewed')}</option>
          </select>
          
          <button 
            onClick={handleBatchRenew}
            className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={16}/> {t('renewal.batchRenew')}
          </button>
        </div>
      </div>
      
      {/* Renewal Table */}
      <div className="max-w-[1600px] mx-auto card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">{t('renewal.listTitle', { count: filteredApps.length })}</h3>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.channelNpn')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.insurerState')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.expiryDate')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.daysRemaining')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.status')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('renewal.col.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApps.map((app) => {
              const daysRemaining = getDaysUntilExpiration(app.expiryDate);
              const urgencyInfo = getStatusColor(daysRemaining, app.renewalStatus);
              const urgencyLabel = getUrgencyLabel(daysRemaining);
              
              return (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{app.channelName}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('renewal.npnPrefix')}{app.channelNpn}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{app.insurerShort}</div>
                    <div className="text-xs text-gray-500">{app.state} • {app.line}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(app.expiryDate).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                    daysRemaining <= 30 ? 'text-red-600' : 
                    daysRemaining <= 60 ? 'text-orange-600' : 
                    'text-yellow-600'
                  }`}>
                    {t('renewal.daysCount', { count: daysRemaining })}
                    <div className="text-xs font-normal opacity-75">{urgencyLabel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 border rounded-md text-xs font-medium ${urgencyInfo.bg} ${urgencyInfo.text} ${urgencyInfo.border}`}>
                      {urgencyInfo.icon} {app.renewalStatus?.replace('-', ' ')?.toUpperCase() || 'NOT-DUE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => startRenewal(app)}
                      disabled={app.renewalStatus === 'renewed'}
                      className={`${
                        app.renewalStatus === 'renewed' 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-yellow-600 hover:text-yellow-900'
                      } mr-3`}
                    >
                      {t('renewal.startRenewal')}
                    </button>
                    {app.renewalStatus === 'in-progress' && (
                      <span className="text-xs text-blue-600">{t('renewal.processing')}</span>
                    )}
                    {app.renewalStatus === 'renewed' && (
                      <span className="text-xs text-green-600">{t('renewal.completed')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {filteredApps.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30"/>
                  <div className="text-lg font-medium">{t('renewal.noExpiring')}</div>
                  <div className="text-sm mt-1">{t('renewal.noExpiringDesc')}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Guidelines */}
      <div className="max-w-[1600px] mx-auto mt-6 card">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{t('renewal.guidelinesTitle')}</h3>
        </div>
        <div className="p-6 grid grid-cols-3 gap-6 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600"/>
              {t('renewal.step1Title')}
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>{t('renewal.step1.item1')}</li>
              <li>{t('renewal.step1.item2')}</li>
              <li>{t('renewal.step1.item3')}</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-yellow-600"/>
              {t('renewal.step2Title')}
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>{t('renewal.step2.item1')}</li>
              <li>{t('renewal.step2.item2')}</li>
              <li>{t('renewal.step2.item3')}</li>
              <li>{t('renewal.step2.item4')}</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-blue-600"/>
              {t('renewal.step3Title')}
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>{t('renewal.step3.item1')}</li>
              <li>{t('renewal.step3.item2')}</li>
              <li>{t('renewal.step3.item3')}</li>
              <li>{t('renewal.step3.item4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon, 
  warn, 
  color 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  warn?: boolean; 
  color: string 
}) => (
  <div className={`glass p-6 rounded-lg ${warn ? `border-2 border-${color}-400` : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-1">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);
