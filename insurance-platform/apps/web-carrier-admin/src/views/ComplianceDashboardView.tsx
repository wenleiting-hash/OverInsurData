import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Shield, AlertTriangle, CheckCircle, FileText, Bell, TrendingUp, 
  Clock, DollarSign, Activity, BarChart3, Database 
} from 'lucide-react';

interface ComplianceStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  ofacHits: number;
  auditReports: number;
  riskScore: number;
  complianceRate: number;
}

interface RecentAlerts {
  id: number;
  title: string;
  titleEn: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  category: string;
}

const mockStats: ComplianceStats = {
  totalComplaints: 47,
  resolvedComplaints: 39,
  pendingComplaints: 8,
  ofacHits: 0,
  auditReports: 24,
  riskScore: 72,
  complianceRate: 96.5,
};

const mockRecentAlerts: RecentAlerts[] = [
  {
    id: 1,
    title: '证书即将过期',
    titleEn: 'Certificate Expiring Soon',
    severity: 'medium',
    message: 'California P&C License (#LIC-2024-CA) expires in 15 days',
    timestamp: '2024-09-01T10:30:00Z',
    category: 'certificate'
  },
  {
    id: 2,
    title: 'NIPR 牌照审核中',
    titleEn: 'NIPR License Under Review',
    severity: 'low',
    message: 'Texas Life Insurance Appointment application under review (ID: APP-TX-8392)',
    timestamp: '2024-09-01T08:15:00Z',
    category: 'appointment'
  },
  {
    id: 3,
    title: 'OFAC 筛查警告',
    titleEn: 'OFAC Screening Warning',
    severity: 'high',
    message: 'Potential match detected for new agent Zhang Wei - Manual review required',
    timestamp: '2024-08-31T16:45:00Z',
    category: 'ofac'
  },
  {
    id: 4,
    title: '监管通知发布',
    titleEn: 'Regulatory Notice Published',
    severity: 'medium',
    message: 'New California Department of Insurance regulations effective October 1, 2024',
    timestamp: '2024-08-31T14:20:00Z',
    category: 'regulatory'
  },
  {
    id: 5,
    title: '审计报告完成',
    titleEn: 'Audit Report Completed',
    severity: 'low',
    message: 'Q2 2024 compliance audit completed with no major findings',
    timestamp: '2024-08-30T11:00:00Z',
    category: 'audit'
  }
];

export default function ComplianceDashboardView({ navigateTo }: { navigateTo: (view: ViewId) => void }) {
  const { t, i18n } = useTranslation('compliance');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-50 text-blue-700 border-blue-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[severity] || colors.low;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #F9F9FF)' }}>
      <div className="max-w-[1440px] mx-auto pb-8">
        {/* Header */}
        <div className="pt-6 mb-6 px-1">
          <h1 className="text-3xl font-bold text-[#181C23] mb-2">{t('dashboard.title')}</h1>
          <p className="text-[#717786]">{t('dashboard.subtitle')}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 px-1">
          {/* Total Complaints Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('stats.totalComplaints')}</h3>
              <Database className="text-slate-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{mockStats.totalComplaints}</p>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <TrendingUp size={14} />
              <span>+12.5% vs last month</span>
            </div>
          </div>

          {/* Resolved Rate Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('stats.resolutionRate')}</h3>
              <CheckCircle className="text-emerald-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-emerald-600 mb-1">
              {Math.round((mockStats.resolvedComplaints / mockStats.totalComplaints) * 100)}%
            </p>
            <div className="text-xs text-slate-500">
              {mockStats.resolvedComplaints} resolved out of {mockStats.totalComplaints}
            </div>
          </div>

          {/* Risk Score Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('stats.riskScore')}</h3>
              <Activity className="text-amber-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-amber-600 mb-1">{mockStats.riskScore}/100</p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${mockStats.riskScore}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">Moderate risk level</div>
          </div>

          {/* Compliance Rate Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('stats.complianceRate')}</h3>
              <BarChart3 className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-1">{mockStats.complianceRate}%</p>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <TrendingUp size={14} />
              <span>+2.3% vs last quarter</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-1">
          {/* Recent Alerts - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-slate-400" size={20} />
                <h3 className="font-semibold text-slate-800">{t('alerts.recent')}</h3>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {t('actions.viewAll')} →
              </button>
            </div>
            
            <div className="divide-y divide-slate-50">
              {mockRecentAlerts.map((alert) => (
                <div key={alert.id} className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      alert.severity === 'high' || alert.severity === 'critical' 
                        ? 'bg-red-500' 
                        : alert.severity === 'medium' 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-400'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {isEn ? alert.titleEn : alert.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {t(`alerts.severity.${alert.severity}`)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                        <span className="uppercase tracking-wide">{alert.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row - Charts and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5 px-1">
          {/* Compliance Trends Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-500" size={20} />
                <h3 className="font-semibold text-slate-800">{t('trends.complianceRate')}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="week">{t('timeRanges.week')}</option>
                  <option value="month">{t('timeRanges.month')}</option>
                  <option value="quarter">{t('timeRanges.quarter')}</option>
                </select>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[85, 88, 87, 90, 92, 91, 93, 94, 93, 95, 96, 96.5].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(value / 100) * 240}px` }}
                  />
                  <span className="text-xs text-slate-400">{new Date(2024, index).getMonth() + 1}/{new Date(2024, index).getDate()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Row - OFAC Screening & Compliance Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 px-1">
          {/* OFAC Screening Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-purple-500" size={20} />
              <h3 className="font-semibold text-slate-800">{t('ofac.screeningStatus')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total screened agents</span>
                <span className="font-semibold text-slate-800">1,247</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">OFAC hits</span>
                <span className="font-semibold text-red-600">{mockStats.ofacHits}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending review</span>
                <span className="font-semibold text-amber-600">2</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Last screening</span>
                <span className="text-sm text-slate-500">Today, 8:30 AM</span>
              </div>
            </div>
            
            <button 
              className="w-full mt-4 px-4 py-2.5 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors"
              onClick={() => navigateTo('ofac-screening')}
            >
              {t('actions.viewOFAC')} →
            </button>
          </div>

          {/* Compliance Events Timeline */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-6">{t('events.complianceTimeline')}</h3>
            
            <div className="space-y-4">
              {[
                { time: '2 hours ago', event: 'Certificate renewal submitted for Texas Life Insurance', icon: FileText, color: 'blue' },
                { time: '4 hours ago', event: 'OFAC screening completed for 15 new agents', icon: CheckCircle, color: 'green' },
                { time: '6 hours ago', event: 'Regulatory notice published: CA DOI updates', icon: Bell, color: 'purple' },
                { time: '1 day ago', event: 'Quarterly audit report uploaded', icon: FileText, color: 'indigo' }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-${item.color}-50`}>
                    <item.icon className={`text-${item.color}-500`} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{item.event}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
