import { useState } from 'react';
import { 
  FileText, Calendar, Shield, Bell, AlertTriangle, CheckCircle, Clock, Eye, Plus
} from 'lucide-react';
import type { AppointmentRecord, NIPRLicense, ComplianceInterception, OFACScreening, ComplianceReport } from './data/mockComplianceData';
import { 
  generateMockAppointmentRecords,
  generateMockNIPRLicenses,
  generateMockComplianceInterceptions,
  OFAC_SCREENINGS,
  COMPLIANCE_REPORTS,
} from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: string, params?: any) => void;
}

// Use Figma prototype data models
const appointmentRecords: AppointmentRecord[] = generateMockAppointmentRecords();
const niprLicenses: NIPRLicense[] = generateMockNIPRLicenses();
const interceptions: ComplianceInterception[] = generateMockComplianceInterceptions();
const ofacScreenings: OFACScreening[] = OFAC_SCREENINGS;
const complianceReports: ComplianceReport[] = COMPLIANCE_REPORTS;

export default function AppointmentDashboardView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  // Statistics aligned with Figma prototype
  const stats = {
    totalAppointments: appointmentRecords.length,
    approved: appointmentRecords.filter(a => a.status === 'approved').length,
    pending: appointmentRecords.filter(a => a.status === 'pending').length,
    underReview: appointmentRecords.filter(a => a.status === 'under-review').length,
    expired: appointmentRecords.filter(a => a.status === 'expired').length,
    terminated: appointmentRecords.filter(a => a.status === 'terminated').length,
    expiringSoon90Days: appointmentRecords.filter(a => 
      a.daysToExpiry > 0 && a.daysToExpiry <= 90 && a.status === 'approved'
    ).length,
    expiredLicenses: niprLicenses.filter(l => l.status === 'expired' || l.status === 'suspended').length,
    activeInterceptions: interceptions.filter(i => i.result === 'blocked').length,
    ofacWatchlist: ofacScreenings.filter(s => s.result === 'watchlist' || s.result === 'blocked').length,
    avgProcessingDays: Math.round(appointmentRecords
      .filter(a => a.processingDays)
      .reduce((sum, a) => sum + (a.processingDays || 0), 0) / 
      Math.max(1, appointmentRecords.filter(a => a.processingDays).length)),
  };
  
  const quickActions = [
    {
      title: 'Appointment Applications',
      icon: <Plus className="text-purple-600" size={24}/>,
      description: 'Manage state-level NIPR appointments',
      onClick: () => navigateTo('appointment-application'),
      color: 'purple',
      count: stats.pending + stats.underReview,
    },
    {
      title: 'Status Tracking',
      icon: <Eye className="text-blue-600" size={24}/>,
      description: 'Monitor processing progress',
      onClick: () => navigateTo('appointment-tracking'),
      color: 'blue',
      count: stats.underReview,
    },
    {
      title: 'Renewal Management',
      icon: <Calendar className="text-yellow-600" size={24}/>,
      description: 'Handle expiring authorizations',
      onClick: () => navigateTo('appointment-renewal'),
      color: 'yellow',
      count: stats.expiringSoon90Days,
    },
    {
      title: 'NIPR License Check',
      icon: <Shield className="text-green-600" size={24}/>,
      description: 'Verify license validity status',
      onClick: () => navigateTo('nipr-license-check'),
      color: 'green',
      count: stats.expiredLicenses,
    },
    {
      title: 'Compliance Interceptor',
      icon: <Bell className="text-red-600" size={24}/>,
      description: 'Review blocking events',
      onClick: () => navigateTo('compliance-interceptor'),
      color: 'red',
      count: stats.activeInterceptions,
    },
    {
      title: 'OFAC Screening',
      icon: <CheckCircle className="text-orange-600" size={24}/>,
      description: 'Sanctions list verification',
      onClick: () => navigateTo('ofac-screening'),
      color: 'orange',
      count: stats.ofacWatchlist,
    },
  ];
  
  // Recent applications
  const recentAppointments = appointmentRecords.slice(-5).reverse();
  
  // Upcoming renewals (within 30 days)
  const upcomingRenewals = appointmentRecords
    .filter(a => a.daysToExpiry > 0 && a.daysToExpiry <= 30 && a.status === 'approved')
    .slice(0, 5);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-purple-600" size={32}/>
          Appointment & Compliance Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Central hub for NIPR appointments and regulatory compliance</p>
      </div>
      
      {/* Urgent Alerts */}
      {(stats.expiringSoon90Days > 0 || stats.activeInterceptions > 0 || stats.ofacWatchlist > 0) && (
        <div className="max-w-[1600px] mx-auto mb-6 space-y-3">
          {stats.expiringSoon90Days > 0 && (
            <div className="card p-4 bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 mt-0.5" size={20}/>
                <div className="flex-1">
                  <div className="font-semibold text-yellow-900">
                    {stats.expiringSoon90Days} Appointment(s) Expiring Within 90 Days
                  </div>
                  <div className="text-sm text-yellow-800 mt-1">
                    Immediate renewal action required to maintain continuous coverage
                  </div>
                </div>
                <button 
                  onClick={() => navigateTo('appointment-renewal')}
                  className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Review Now →
                </button>
              </div>
            </div>
          )}
          
          {stats.activeInterceptions > 0 && (
            <div className="card p-4 bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <Bell className="text-red-600 mt-0.5" size={20}/>
                <div className="flex-1">
                  <div className="font-semibold text-red-900">
                    {stats.activeInterceptions} Active Compliance Blockage(s)
                  </div>
                  <div className="text-sm text-red-800 mt-1">
                    Binding attempts blocked due to compliance violations
                  </div>
                </div>
                <button 
                  onClick={() => navigateTo('compliance-interceptor')}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Review →
                </button>
              </div>
            </div>
          )}
          
          {stats.ofacWatchlist > 0 && (
            <div className="card p-4 bg-orange-50 border-2 border-orange-200">
              <div className="flex items-start gap-3">
                <Clock className="text-orange-600 mt-0.5" size={20}/>
                <div className="flex-1">
                  <div className="font-semibold text-orange-900">
                    {stats.ofacWatchlist} OFAC Watchlist Match(es) Require Review
                  </div>
                  <div className="text-sm text-orange-800 mt-1">
                    Entities matching sanctions lists awaiting manual review
                  </div>
                </div>
                <button 
                  onClick={() => navigateTo('ofac-screening')}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Screen →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto mb-8 grid grid-cols-4 gap-4">
        <StatCard 
          label="Total Appointments" 
          value={stats.totalAppointments.toString()} 
          icon={<FileText className="text-purple-600"/>}
          description={`${stats.approved} effective`}
        />
        <StatCard 
          label="Pending Effective" 
          value={stats.pending.toString()} 
          icon={<Clock className="text-orange-600"/>}
          description="Not yet effective"
        />
        <StatCard 
          label="Processing" 
          value={stats.underReview.toString()} 
          warn={stats.underReview > 5}
          icon={<Shield className="text-blue-600"/>}
          description="In progress"
        />
        <StatCard 
          label="Expired" 
          value={stats.expired.toString()} 
          warn={stats.expired > 0}
          icon={<AlertTriangle className="text-red-600"/>}
          description="Past expiry date"
        />
        <StatCard 
          label="Expiring Soon" 
          value={stats.expiringSoon90Days.toString()} 
          warn={stats.expiringSoon90Days > 0}
          icon={<Calendar className="text-yellow-600"/>}
          description="Within 90 days"
        />
        <StatCard 
          label="Terminated" 
          value={stats.terminated.toString()} 
          icon={<XCircle className="text-gray-600"/>}
          description="Voluntarily terminated"
        />
        <StatCard 
          label="Avg Processing" 
          value={`${stats.avgProcessingDays}d`} 
          icon={<CheckCircle className="text-green-600"/>}
          description="Processing timeline"
        />
        <StatCard 
          label="Active Interceptions" 
          value={stats.activeInterceptions.toString()} 
          warn={stats.activeInterceptions > 0}
          icon={<Bell className="text-red-600"/>}
          description="Compliance blocks"
        />
      </div>
      
      {/* Quick Actions Grid */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="card p-6 text-left hover:shadow-lg transition-all group"
            >
              <div className={`w-14 h-14 rounded-lg bg-${action.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="font-semibold text-gray-900 mb-1">{action.title}</div>
              <div className="text-sm text-gray-600 mb-3">{action.description}</div>
              {action.count > 0 && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${action.color}-100 text-${action.color}-800`}>
                  {action.count} {action.count === 1 ? 'Item' : 'Items'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="card">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
            <button onClick={() => navigateTo('appointment-tracking')} className="text-sm text-purple-600 hover:text-purple-900">View All →</button>
          </div>
          <div className="divide-y">
            {recentAppointments.map(app => (
              <div key={app.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{app.channelName}</div>
                    <div className="text-sm text-gray-600">{app.insurerShort} • {app.state}</div>
                  </div>
                  <StatusBadge status={app.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Upcoming Renewals */}
        <div className="card">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Urgent Renewals (Next 30 Days)</h3>
            <button onClick={() => navigateTo('appointment-renewal')} className="text-sm text-yellow-600 hover:text-yellow-900">Manage →</button>
          </div>
          <div className="space-y-2">
            {upcomingRenewals.map(auth => (
              <div key={auth.id} className="px-4 py-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{auth.channelName}</div>
                    <div className="text-sm text-gray-600">{auth.insurerShort} - {auth.state}</div>
                  </div>
                  <span className="text-xs font-medium text-red-700">{auth.daysToExpiry} days</span>
                </div>
              </div>
            ))}
            {upcomingRenewals.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No urgent renewals
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* System Health Indicators */}
      <div className="max-w-[1600px] mx-auto mt-6 card">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">System Health</h3>
        </div>
        <div className="p-6 grid grid-cols-3 gap-6">
          <HealthMetric 
            label="NIPR Processing" 
            status="Normal" 
            value={`${stats.underReview} processing`}
          />
          <HealthMetric 
            label="License Validations" 
            status={stats.expiredLicenses > 0 ? "Warning" : "Normal"} 
            value={`${niprLicenses.filter(l => l.status === 'active').length} active licenses`}
          />
          <HealthMetric 
            label="Compliance Checks" 
            status={stats.activeInterceptions > 0 ? "Warning" : "Normal"} 
            value={`${stats.activeInterceptions} pending reviews`}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-components
const StatCard = ({ 
  label, 
  value, 
  icon, 
  warn, 
  description 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  warn?: boolean; 
  description: string 
}) => (
  <div className={`glass p-6 rounded-lg ${warn ? 'border-2 border-red-400' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-1">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-xs text-gray-500">{description}</div>
  </div>
);

// 本系统没有任何审批流程：approved/pending/under-review/rejected 只是委任记录的
// 生命周期状态（已生效 / 待生效 / 处理中 / 已失效），不是审批结论。
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Effective' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Effective' },
    'under-review': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Void' },
    expired: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Expired' },
    terminated: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Terminated' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const HealthMetric = ({ 
  label, 
  status, 
  value 
}: { 
  label: string; 
  status: string; 
  value: string 
}) => {
  const statusColors = {
    'Normal': 'text-green-600',
    'Warning': 'text-yellow-600',
    'Critical': 'text-red-600',
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${
        status === 'Normal' ? 'bg-green-500' : status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
      }`}/>
      <div className="flex-1">
        <div className="text-sm text-gray-600">{label}</div>
        <div className={`text-sm font-medium ${statusColors[status as 'Normal' | 'Warning' | 'Critical']}`}>{value}</div>
      </div>
    </div>
  );
};

const XCircle = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);
