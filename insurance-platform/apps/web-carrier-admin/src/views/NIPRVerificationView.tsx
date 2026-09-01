import React, { useState, useEffect } from 'react'
import { ArrowLeft, Shield, Search, Filter, AlertTriangle, CheckCircle, XCircle, RefreshCw, Bell } from 'lucide-react'
import type { LicenseVerification } from './data/mockAppointmentData'
import { generateMockVerifications } from './data/mockAppointmentData'
import { useTranslation } from 'react-i18next'

/**
 * NIPR License Verification View (功能点 4.5)
 * Real-time license verification through National Insurance Producer Registry API
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function NIPRVerificationView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment')
  const verifications = generateMockVerifications()
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAutoVerify, setShowAutoVerify] = useState(false)
  
  // Auto-verification simulation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showAutoVerify) {
      interval = setInterval(() => {
        alert(`Automated NIPR validation running for ${Math.floor(Math.random() * 20 + 5)} licenses...`)
      }, 30000) // Every 30 seconds
    }
    return () => clearInterval(interval)
  }, [showAutoVerify])
  
  const filteredVerifications = verifications.filter((v: any) => {
    const matchesStatus = statusFilter === 'ALL' || v.licenseStatus === statusFilter
    const matchesSearch = v.npnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.agentName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })
  
  const getStatusColor = (status: string): string => {
    if (status === 'Active') return 'bg-green-100 text-green-800 border-green-300'
    if (status === 'Expired') return 'bg-red-100 text-red-800 border-red-300'
    if (status === 'Suspended') return 'bg-orange-100 text-orange-800 border-orange-300'
    if (status === 'Revoked') return 'bg-gray-100 text-gray-600 border-gray-300'
    return 'bg-gray-100'
  }
  
  const getAnomalyFlags = (verif: any) => {
    if (!verif.anomalyFlags || verif.anomalyFlags.length === 0) return null
    return verif.anomalyFlags.map((flag: string) => ({
      flag,
      icon: flag === 'LicenseExpired' ? <XCircle size={14}/> :
           flag === 'LicenseSuspended' ? <AlertTriangle size={14}/> :
           <Shield size={14}/>,
      severity: flag === 'LicenseExpired' ? 'red' : flag === 'LicenseSuspended' ? 'orange' : 'yellow'
    }))
  }
  
  const stats = {
    total: verifications.length,
    active: verifications.filter((v: any) => v.licenseStatus === 'Active').length,
    expired: verifications.filter((v: any) => v.licenseStatus === 'Expired').length,
    suspended: verifications.filter((v: any) => v.licenseStatus === 'Suspended').length,
    withAnomalies: verifications.filter((v: any) => v.anomalyFlags.length > 0).length,
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('appointment-dashboard')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Appointment Dashboard
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="text-blue-600" size={28}/>
          NIPR License Verification
        </h1>
        <p className="text-gray-600 mt-1">Real-time validation of agent licenses through National Insurance Producer Registry</p>
      </div>
      
      {/* Stats Overview */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-4 gap-4">
        <StatCard 
          label="Total Verified" 
          value={stats.total.toString()} 
          icon={<Shield className="text-blue-600"/>}
          description="All verified this month"
        />
        <StatCard 
          label="Active Licenses" 
          value={stats.active.toString()} 
          icon={<CheckCircle className="text-green-600"/>}
          description="Valid and current"
        />
        <StatCard 
          label="Expired/Issues" 
          value={(stats.expired + stats.suspended).toString()} 
          warn
          icon={<AlertTriangle className="text-red-600"/>}
          description="Require immediate attention"
        />
        <StatCard 
          label="With Anomalies" 
          value={stats.withAnomalies.toString()} 
          warn
          icon={<RefreshCw className="text-yellow-600"/>}
          description="Flagged for review"
        />
      </div>
      
      {/* Auto-verify Toggle */}
      <div className="max-w-[1600px] mx-auto mb-6 card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bell className="text-blue-600 mt-0.5" size={20}/>
            <div>
              <div className="font-semibold text-blue-900 mb-1">Automated Scheduled Verification</div>
              <div className="text-sm text-blue-800">
                System automatically validates licenses via NIPR API every 30 minutes
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showAutoVerify}
              onChange={() => setShowAutoVerify(!showAutoVerify)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      
      {/* Single & Batch Verification */}
      <div className="max-w-[1600px] mx-auto mb-6 card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Immediate Verification</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NPN Number</label>
            <input
              type="text"
              placeholder="e.g., NPN100001"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => alert(`Starting NIPR verification for NPN: ${searchQuery}\nThis may take 3-5 seconds...`)}
              className="w-full px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw size={18}/> Verify Now
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Upload CSV Batch
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Download Template
          </button>
        </div>
      </div>
      
      {/* Filters & Search */}
      <div className="max-w-[1600px] mx-auto mb-4 card p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder="Search by NPN number or agent name..."
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
            <option value="Active">Active Only</option>
            <option value="Expired">Expired Only</option>
            <option value="Suspended">Suspended Only</option>
            <option value="Revoked">Revoked Only</option>
          </select>
        </div>
      </div>
      
      {/* Verification Results Table */}
      <div className="max-w-[1600px] mx-auto card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">License Verification Results ({filteredVerifications.length} entries)</h3>
          <button 
            onClick={() => alert('Exporting verification results to CSV...')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Export to CSV
          </button>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPN Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licensed States</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOB Authorization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVerifications.map((verif: any) => {
              const anomalies = getAnomalyFlags(verif)
              return (
                <tr key={verif.id} className={`hover:bg-gray-50 transition-colors ${
                  verif.licenseStatus !== 'Active' ? 'bg-red-50' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{verif.npnNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{verif.agentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{verif.organizationName || '-'}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(verif.licenseStatus)}`}>
                      {verif.licenseStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-1">
                      {verif.licensedStates.slice(0, 4).map((state: string) => (
                        <span key={state} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                          {state}
                        </span>
                      ))}
                      {verif.licensedStates.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{verif.licensedStates.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {verif.authorizedLines.join(', ').split('/').map((line: string, idx: number, arr: string[]) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{line}</span>
                        {idx < arr.length - 1 && ', '}
                      </React.Fragment>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {verif.expirationDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="space-y-1">
                      {anomalies && anomalies.map((a: any, idx: number) => (
                        <button
                          key={idx}
                          title={a.flag}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-${a.severity}-100 text-${a.severity}-600 hover:bg-${a.severity}-200 transition-colors`}
                        >
                          {a.icon}
                        </button>
                      ))}
                      <button className="text-blue-600 hover:text-blue-900 block ml-auto">Details</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Anomaly Warning Banner */}
      {stats.withAnomalies > 0 && (
        <div className="max-w-[1600px] mx-auto mt-6">
          <div className="card p-4 bg-orange-50 border-2 border-orange-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 mt-0.5" size={20}/>
                <div>
                  <div className="font-semibold text-orange-900 mb-1">
                    {stats.withAnomalies} License(s) With Validation Issues Detected
                  </div>
                  <div className="text-sm text-orange-800 space-y-1">
                    <div><strong>{stats.expired}</strong> expired licenses require renewal</div>
                    <div><strong>{stats.suspended}</strong> suspended licenses need compliance review</div>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium">
                Review All →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ label, value, icon, warn, description }: { label: string; value: string; icon: React.ReactNode; warn?: boolean; description: string }) => (
  <div className={`card p-4 ${warn ? 'border-2 border-red-400' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-1">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-xs text-gray-500">{description}</div>
  </div>
)
