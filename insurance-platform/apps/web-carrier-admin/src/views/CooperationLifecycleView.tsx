import React, { useState } from 'react'
import { 
  ArrowLeft, TrendingUp, Users, FileText, Clock, AlertTriangle, 
  RefreshCw, CheckCircle, XCircle, Award, Star, BarChart2, PieChart,
  Calendar, Bell, Download, Plus, Filter, Search
} from 'lucide-react'
import type { InsuranceCooperation } from '../data/mockCooperationData'
import { generateMockCooperations } from '../data/mockCooperationData'

/**
 * Cooperation Lifecycle View (功能点 3.6)
 * Track full lifecycle of insurance carrier partnerships and manage renewals
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function CooperationLifecycleView({ navigateTo }: Props) {
  const cooperations = generateMockCooperations()
  
  // State
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<'Month' | 'Quarter' | 'Year'>('Quarter')
  
  // Statistics
  const stats = {
    total: cooperations.length,
    negotiating: cooperations.filter(c => c.status === 'Negotiating').length,
    pendingSignature: cooperations.filter(c => c.status === 'PendingApproval').length,
    signed: cooperations.filter(c => c.status === 'Approved').length,
    inProgress: cooperations.filter(c => c.status === 'InProgress').length,
    expiringSoon: cooperations.filter(c => 
      c.expirationDate && new Date(c.expirationDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000
    ).length,
    terminated: cooperations.filter(c => c.status === 'Terminated').length,
  }
  
  // Expiring within 90 days
  const upcomingExpirations = cooperations.filter(coop => {
    if (!coop.expirationDate) return false
    const daysLeft = Math.ceil((new Date(coop.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 90
  }).sort((a, b) => {
    return new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime()
  })
  
  // Quality metrics for each cooperation
  const qualityMetrics = {
    avgLossRatio: 0.52,
    renewalRate: 0.87,
    complaintRate: 0.02,
    reconciliationDisputeRate: 0.01,
    strategicAlignment: 85,
  }
  
  const handleStartRenewal = (cooperation: InsuranceCooperation) => {
    alert(`Starting renewal assessment for ${cooperation.insurerName}`)
  }
  
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'Negotiating': return 'bg-blue-100 text-blue-800'
      case 'PendingApproval': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'InProgress': return 'bg-cyan-100 text-cyan-800'
      case 'ExpiringSoon': return 'bg-orange-100 text-orange-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      case 'Terminated': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }
  
  const getDaysUntilExpiration = (expirationDate?: string): number | null => {
    if (!expirationDate) return null
    const days = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }
  
  const daysColor = (days?: number): string => {
    if (days === undefined || days === null) return 'text-gray-400'
    if (days <= 30) return 'text-red-700 font-bold'
    if (days <= 60) return 'text-orange-700'
    if (days <= 90) return 'text-yellow-700'
    return 'text-gray-600'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="text-purple-600" size={28}/>
          Cooperation Status & Renewal Management
        </h1>
        <p className="text-gray-600 mt-1">Track partnership lifecycle and manage renewal assessments</p>
      </div>
      
      {/* Status Dashboard Cards */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-6 gap-4">
        <StatCard label="Negotiating" value={stats.negotiating.toString()} icon={<RefreshCw className="text-blue-600"/>} color="blue"/>
        <StatCard label="Pending Signature" value={stats.pendingSignature.toString()} icon={<FileText className="text-yellow-600"/>} color="yellow"/>
        <StatCard label="Approved" value={stats.signed.toString()} icon={<CheckCircle className="text-green-600"/>} color="green"/>
        <StatCard label="In Progress" value={stats.inProgress.toString()} icon={<TrendingUp className="text-cyan-600"/>} color="cyan"/>
        <StatCard label="Expiring Soon" value={stats.expiringSoon.toString()} warn={stats.expiringSoon > 0} icon={<AlertTriangle className="text-orange-600"/>} color="orange"/>
        <StatCard label="Terminated" value={stats.terminated.toString()} icon={<XCircle className="text-red-600"/>} color="red"/>
      </div>
      
      {/* Quality Metrics & Performance Chart */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-6 mb-6">
        <QualityMetricsCard metrics={qualityMetrics}/>
        <PerformanceChart/>
      </div>
      
      {/* Filters */}
      <div className="max-w-[1600px] mx-auto mb-4 card p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder="Search by insurer name or cooperation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="Negotiating">Negotiating</option>
            <option value="PendingApproval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="InProgress">In Progress</option>
            <option value="ExpiringSoon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="Month">This Month</option>
            <option value="Quarter">This Quarter</option>
            <option value="Year">This Year</option>
          </select>
        </div>
      </div>
      
      {/* Expiring Cooperations Alert */}
      {upcomingExpirations.length > 0 && (
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="card p-4 bg-orange-50 border-2 border-orange-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 mt-0.5" size={20}/>
                <div>
                  <div className="font-semibold text-orange-900 mb-1">
                    {upcomingExpirations.length} Cooperation(s) Expiring Within 90 Days
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-orange-800">
                    {upcomingExpirations.slice(0, 3).map(coop => (
                      <div key={coop.id} className="flex justify-between">
                        <span className="truncate">{coop.insurerName} ({coop.cooperationType})</span>
                        <span className="font-medium whitespace-nowrap">{getDaysUntilExpiration(coop.expirationDate)} days left</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium">
                  Review All
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-orange-500 text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium">
                  Set Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Expiring Cooperations Table */}
      <div className="max-w-[1600px] mx-auto card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="text-orange-600" size={20}/>
            Detailed Expiry List ({upcomingExpirations.length} entries)
          </h3>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Premium</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {upcomingExpirations.map(coop => (
              <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{coop.insurerName}</div>
                  <div className="text-sm text-gray-500">{coop.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coop.cooperationType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(coop.status)}`}>
                    {coop.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {coop.effectiveDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {coop.expirationDate || 'Permanent'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${daysColor(getDaysUntilExpiration(coop.expirationDate))}`}>
                  {getDaysUntilExpiration(coop.expirationDate) ?? '∞'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${Math.random() * 10000000}.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RatingBadge rating="A"/>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleStartRenewal(coop)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <RefreshCw size={16}/> Renew
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded">
                      <Star size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {upcomingExpirations.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto text-green-400 mb-3" size={48}/>
            <p className="text-gray-600">No cooperations expiring within 90 days</p>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="max-w-[1600px] mx-auto mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {upcomingExpirations.length} of {stats.total} cooperation(s)
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            <Download size={18}/> Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
            <Bell size={18}/> Set Up Alerts
          </button>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon, 
  color, 
  warn 
}: { 
  label: string
  value: string
  icon: React.ReactNode
  color: string
  warn?: boolean
}) => (
  <div className={`card p-4 ${warn ? `bg-${color}-50 border-2 border-${color}-200` : 'bg-white'}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${warn ? `text-${color}-700` : 'text-gray-900'}`}>{value}</div>
      </div>
      <div className="flex-shrink-0 opacity-80">{icon}</div>
    </div>
  </div>
)

// Quality Metrics Card
const QualityMetricsCard = ({ metrics }: { metrics: any }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-4">
      <PieChart className="text-purple-600" size={20}/>
      <h3 className="text-lg font-semibold text-gray-900">Quality Assessment</h3>
    </div>
    
    <div className="space-y-4">
      <QualityMetricBar label="Average Loss Ratio" value={metrics.avgLossRatio * 100} max={100} unit="%" color="blue"/>
      <QualityMetricBar label="Renewal Rate" value={metrics.renewalRate * 100} max={100} unit="%" color="green" reverse/>
      <QualityMetricBar label="Complaint Rate" value={metrics.complaintRate * 100} max={100} unit="%" color="red"/>
      <QualityMetricBar label="Dispute Rate" value={metrics.reconciliationDisputeRate * 100} max={100} unit="%" color="orange"/>
      <QualityMetricBar label="Strategic Alignment" value={metrics.strategicAlignment} max={100} unit="%" color="purple" showStar/>
    </div>
  </div>
)

const QualityMetricBar = ({ 
  label, 
  value, 
  max, 
  unit, 
  color, 
  reverse,
  showStar 
}: { 
  label: string
  value: number
  max: number
  unit: string
  color: string
  reverse?: boolean
  showStar?: boolean
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${showStar ? 'text-yellow-600' : ''}`}>
        {reverse ? (100 - value).toFixed(1) : value.toFixed(1)}{unit}
      </span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-${color}-500 transition-all`}
        style={{ width: `${reverse ? 100 - value : value}%`, transition: 'width 0.3s ease' }}
      />
    </div>
  </div>
)

// Performance Chart Placeholder
const PerformanceChart = () => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-4">
      <BarChart2 className="text-blue-600" size={20}/>
      <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
    </div>
    
    <div className="text-sm text-gray-600 mb-4">
      <div className="flex gap-4">
        <span className="inline-flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"/> This Period
        </span>
        <span className="inline-flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"/> Last Period
        </span>
      </div>
    </div>
    
    {/* Simulated bar chart */}
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Premium Volume</span>
          <span className="font-bold">$12.5M</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-full bg-blue-500 rounded" style={{ width: '78%' }}/>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Policies Sold</span>
          <span className="font-bold">1,234</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-full bg-green-500 rounded" style={{ width: '65%' }}/>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Commission Income</span>
          <span className="font-bold">$456K</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-full bg-purple-500 rounded" style={{ width: '82%' }}/>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Channel Count</span>
          <span className="font-bold">48</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-full bg-orange-500 rounded" style={{ width: '56%' }}/>
        </div>
      </div>
    </div>
  </div>
)

// Rating Badge Component
const RatingBadge = ({ rating }: { rating: string }) => {
  const colors = {
    A: 'bg-green-100 text-green-800 border-green-300',
    B: 'bg-blue-100 text-blue-800 border-blue-300',
    C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    D: 'bg-red-100 text-red-800 border-red-300',
  }
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${colors[rating as keyof typeof colors] || 'bg-gray-100'}`}>
      {rating}
    </span>
  )
}
