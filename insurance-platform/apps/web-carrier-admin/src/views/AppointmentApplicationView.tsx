import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { FileCheck, Shield, AlertCircle, CheckCircle, XCircle, Clock, Plus, Filter, Eye, RefreshCw, X } from 'lucide-react';
import type { AppointmentRecord } from './data/mockComplianceData';
import { generateMockAppointmentRecords } from './data/mockComplianceData';

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Use Figma prototype data model
const mockApplications: AppointmentRecord[] = generateMockAppointmentRecords();

export default function AppointmentApplicationView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  // Current active tab
  const [activeTab, setActiveTab] = useState<'application' | 'tracking' | 'renewal' | 'termination' | 'license-check' | 'compliance-report' | 'ofac-screening'>('application');
  
  // Status filtering for Appointment Application tab
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  // Tab configuration aligned with Figma prototype
  const tabs = [
    { id: 'application', label: 'Appointment 申请', icon: FileCheck },
    { id: 'tracking', label: '状态跟踪', icon: Clock },
    { id: 'renewal', label: '续期与终止', icon: Clock },
    { id: 'license-check', label: 'NIPR 牌照管理', icon: Shield },
    { id: 'compliance-report', label: '合规报告', icon: FileCheck },
    { id: 'ofac-screening', label: 'OFAC 筛查', icon: Shield },
  ];

  // Status mapping aligned with Figma prototype
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
      approved: { bg: 'bg-[#E7F3FF]', text: 'text-[#0058BC]', border: 'border-[#0058BC]', label: t('common.status.approved') },
      pending: { bg: 'bg-[#F8FAFC]', text: 'text-[#181C23]', border: 'border-[#E6E9EF]', label: t('common.status.pending') },
      'under-review': { bg: 'bg-[#EBF5FF]', text: 'text-[#0058BC]', border: 'border-[#0058BC]', label: t('common.status.underReview') },
      rejected: { bg: 'bg-[#FFF4F4]', text: 'text-[#DC2626]', border: 'border-[#DC2626]', label: t('common.status.rejected') },
      expired: { bg: 'bg-white', text: 'text-[#EF4444]', border: 'border-[#FDECEF]', label: t('common.status.expired') },
      terminated: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: t('common.status.terminated') },
    };
    const s = styles[status] || styles.pending;
    return (
      <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${s.bg} ${s.text}`} style={{ border: `1px solid ${s.border}` }}>
        {s.label}
      </span>
    );
  };

  const filteredData = mockApplications.filter((app) => {
    if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;
    if (selectedStateFilter !== 'all' && app.state !== selectedStateFilter) return false;
    return true;
  });

  // Statistics aligned with Figma prototype data
  const stats = {
    total: mockApplications.length,
    approved: mockApplications.filter(a => a.status === 'approved').length,
    pending: mockApplications.filter(a => a.status === 'pending').length,
    underReview: mockApplications.filter(a => a.status === 'under-review').length,
    rejected: mockApplications.filter(a => a.status === 'rejected').length,
    expired: mockApplications.filter(a => a.status === 'expired').length,
    terminated: mockApplications.filter(a => a.status === 'terminated').length,
    avgProcessingDays: Math.round(mockApplications
      .filter(a => a.processingDays)
      .reduce((sum, a) => sum + (a.processingDays || 0), 0) / 
      Math.max(1, mockApplications.filter(a => a.processingDays).length)),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF4FF] via-[#F5F7FA] to-[#E8EDF5] p-6">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <h1 className="text-3xl font-bold text-[#181C23] mb-2">合规管理</h1>
        <p className="text-[#717786]">管理渠道商 Appointment 申请、牌照核验、出单合规拦截及 OFAC 制裁筛查</p>
      </div>

      {/* Top Tabs Navigation - Aligned with Figma Prototype */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <div className="border-b border-[#E6E9EF]" style={{ borderBottomWidth: 2 }}>
          <div className="flex gap-6" style={{ gap: '24px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id as 'application' | 'tracking' | 'renewal' | 'termination' | 'license-check' | 'compliance-report' | 'ofac-screening'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-all ${
                    isActive ? 'text-[#0058BC]' : 'text-[#717786]'
                  }`}
                  style={{
                    borderBottom: isActive ? '2px solid #0058BC' : '2px solid transparent',
                    paddingBottom: isActive ? '10px' : '11px',
                  }}
                >
                  <Icon size={16} />
                  <span>{t(tab.label)}</span>
                  {tab.id === 'application' && stats.pending > 0 && (
                    <span className="ml-1 badge badge-orange" style={{ fontSize: 10, padding: '1px 6px' }}>
                      {stats.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert Banner - Only show on appointment application tab */}
      {activeTab === 'application' && stats.expired > 0 && (
        <div className="max-w-[1440px] mx-auto mb-6">
          <div className="bg-[#FFF5F5] p-4 rounded-lg flex items-center gap-3" style={{ borderLeft: '4px solid #EF4444' }}>
            <AlertCircle className="text-[#EF4444]" size={20} />
            <span className="text-sm font-medium text-[#DC2626]">{stats.expired} 个牌照已过期</span>
          </div>
        </div>
      )}

      {/* Main Content - Appointment Application Tab */}
      {activeTab === 'application' && (
        <>
          {/* Statistics Cards */}
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Total - Light Blue Background #E7F3FF */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#3D424E]">{t('stats.totalApplications')}</h3>
                <FileCheck className="text-[#0058BC]" size={18} />
              </div>
              <p className="text-3xl font-bold text-[#181C23] mb-1">{stats.total}</p>
              <p className="text-xs text-[#717786]">All time</p>
            </div>

            {/* Card 2: Approved - Light Green Background #E8F8F5 */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#3D424E]">{t('stats.approved')}</h3>
                <CheckCircle className="text-[#10B981]" size={18} />
              </div>
              <p className="text-3xl font-bold text-[#181C23] mb-1">{stats.approved}</p>
              <p className="text-xs text-[#717786]">Active appointments</p>
            </div>

            {/* Card 3: Pending+Under Review - Light Beige Background #F9F7F2 */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#3D424E]">{t('stats.pendingOrUnderReview')}</h3>
                <Clock className="text-[#F59E0B]" size={18} />
              </div>
              <p className="text-3xl font-bold text-[#181C23] mb-1">{stats.pending + stats.underReview}</p>
              <p className="text-xs text-[#717786]">Awaiting approval</p>
            </div>

            {/* Card 4: Near Expiry (30 days) - Light Pink Background #FDECEF */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#3D424E]">{t('stats.nearExpiry30Days')}</h3>
                <AlertCircle className="text-[#EF4444]" size={18} />
              </div>
              <p className="text-3xl font-bold text-[#181C23] mb-1">{stats.expired}</p>
              <p className="text-xs text-[#717786]">Past expiry date</p>
            </div>
          </div>

          {/* Filters - Status Button Group + Search + New Application */}
          <div className="max-w-[1440px] mx-auto mb-4 flex flex-col gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[ 
                { value: 'all', label: `全部 (${mockApplications.length})` },
                { value: 'approved', label: '已批准' },
                { value: 'pending', label: '待审核' },
                { value: 'under-review', label: '审核中' },
                { value: 'expired', label: '已过期' },
                { value: 'rejected', label: '已拒绝' },
                { value: 'terminated', label: '已终止' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatusFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    selectedStatusFilter === filter.value
                      ? 'bg-[#EBF5FF] text-[#0058BC] border-2 border-[#0058BC]'
                      : 'bg-white text-[#3D424E] border-2 border-[#E6E9EF] hover:border-[#0058BC]'
                  }`}
                  style={{ height: 32, fontSize: 13 }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Input + State Filter + New Application Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="搜索渠道、保险公司、州..."
                  className="w-full px-10 py-2 text-sm border-2 border-[#E6E9EF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0058BC] focus:border-transparent"
                  style={{ height: 36 }}
                />
                <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#717786]" />
              </div>

              {/* State Filter */}
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="px-3 py-2 text-sm border-2 border-[#E6E9EF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0058BC] focus:border-transparent bg-white"
                style={{ height: 36 }}
              >
                <option value="all">所有州</option>
                <option value="CA">CA</option>
                <option value="NY">NY</option>
                <option value="TX">TX</option>
                <option value="FL">FL</option>
                <option value="IL">IL</option>
                <option value="OH">OH</option>
                <option value="CO">CO</option>
                <option value="WA">WA</option>
              </select>

              {/* New Application Button */}
              <button className="btn-primary flex items-center gap-2" style={{ minWidth: 120, height: 36 }}>
                <Plus size={16} />
                <span>新建申请</span>
              </button>
            </div>
          </div>

          {/* Data Table with Sticky Columns Protection */}
          <div className="max-w-[1440px] mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-[#E6E9EF]" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[180px] sticky left-0 bg-[#F8FAFC] z-10">渠道商</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[140px]">保险公司</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[100px]">州 / 业务线</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[100px]">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[100px]">提交日期</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[100px]">批准日期</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[100px]">到期日</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#3D424E] uppercase tracking-wider w-[80px]">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E6E9EF]">
                {filteredData.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#181C23]">{app.channelName}</div>
                      <div className="text-xs text-[#717786] mt-1">NPN: {app.channelNpn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#181C23]">{app.insurerShort}</div>
                      <div className="text-xs text-[#717786]">{app.insurerName}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#0058BC]">{app.state}</div>
                      <div className="text-xs text-[#717786]">{app.line}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-[#3D424E]">
                      {app.submittedDate}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-[#3D424E]">
                      {app.approvedDate || '—'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-[#3D424E]">
                      {app.expiryDate}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-[#717786] hover:text-[#0058BC]" title="查看详情">
                          <Eye size={16} />
                        </button>
                        <button className="text-[#717786] hover:text-[#0058BC]" title="刷新">
                          <RefreshCw size={16} />
                        </button>
                        {app.status === 'expired' && (
                          <button className="text-[#EF4444] hover:text-[#DC2626]" title="终止">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="max-w-[1440px] mx-auto mt-4 flex items-center justify-between text-sm text-[#717786]">
            <div>显示 {filteredData.length} of {mockApplications.length} 条记录</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-[#E6E9EF] rounded-md hover:bg-[#F8FAFC] disabled:opacity-50" disabled>上一页</button>
              <button className="px-3 py-1 border border-[#E6E9EF] rounded-md hover:bg-[#F8FAFC] disabled:opacity-50" disabled>下一页</button>
            </div>
          </div>
        </>
      )}

      {/* Placeholder content for other tabs - To be implemented */}
      {activeTab !== 'application' && (
        <div className="max-w-[1440px] mx-auto glass rounded-lg p-20 text-center">
          <Shield className="mx-auto mb-4 text-[#0058BC]" size={64} />
          <h3 className="text-xl font-semibold text-[#181C23] mb-2">
            {t('tab.' + activeTab)}
          </h3>
          <p className="text-[#717786]">此功能模块即将上线</p>
          <button className="btn-primary mt-4" onClick={() => setActiveTab('application')}>返回 Appointment 申请</button>
        </div>
      )}
    </div>
  );
}
