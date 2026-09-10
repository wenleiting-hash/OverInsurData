import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { ShieldAlert, CheckCircle, Clock, XCircle, AlertTriangle, Filter, Download, RefreshCw, Shield, Search } from 'lucide-react';
import { useInterceptions, useResolveInterception } from '@/services/complianceService';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function ComplianceInterceptorView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterception, setSelectedInterception] = useState<any>(null);
  const resolveMut = useResolveInterception();

  const params: any = {};
  if (resultFilter !== 'ALL') params.result = resultFilter;
  const { data: interRes, isLoading } = useInterceptions(params);
  const interceptions: any[] = interRes?.data ?? [];
  
  // Get interception by ID for details view
  const getInterceptionById = (id: string) => {
    return interceptions.find(i => i.interception_id === id);
  };
  
  const filteredInterceptions = interceptions.filter((inter: any) => {
    const matchesResult = resultFilter === 'ALL' || inter.result === resultFilter;
    const matchesReason = reasonFilter === 'ALL' || inter.reason === reasonFilter;
    const matchesSearch = 
      (inter.channel_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inter.insurer_short || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inter.interception_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesResult && matchesReason && matchesSearch;
  });
  
  const stats = {
    total: interceptions.length,
    blocked: interceptions.filter(i => i.result === 'blocked').length,
    allowed: interceptions.filter(i => i.result === 'allowed').length,
    flagged: interceptions.filter(i => i.result === 'flagged').length,
    pendingRelease: interceptions.filter(i => i.result === 'blocked' && !i.releasedAt).length,
  };
  
  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'text-red-600 bg-red-50 border-red-200';
    if (severity === 'high') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (severity === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (severity === 'low') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };
  
  const getResultBadge = (result: string) => {
    if (result === 'blocked') return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Blocked' };
    if (result === 'allowed') return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Allowed' };
    if (result === 'flagged') return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Flagged' };
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Unknown' };
  };
  
  const handleRelease = (interception: any) => {
    // Release logic - in real implementation would call API
    console.log(`Releasing interception ${interception.id}`);
    // Here we just update the local state
    setSelectedInterception(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('dashboard')} className="hover:text-gray-900 flex items-center gap-1">
            <Shield size={18}/> Back to Dashboard
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={28}/>
          Compliance Interception Log
        </h1>
        <p className="text-gray-600 mt-1">Real-time monitoring of binding attempt blockages and compliance violations</p>
      </div>
      
      {/* Urgent Alerts */}
      {stats.pendingRelease > 0 && (
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="card p-4 bg-red-50 border-2 border-red-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5" size={20}/>
                <div>
                  <div className="font-semibold text-red-900 mb-1">
                    {stats.pendingRelease} Blocked Transaction(s) Awaiting Release Review
                  </div>
                  <div className="text-sm text-red-800">
                    Compliance officer action required before business can proceed
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
                  Review Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-5 gap-4">
        <StatCard label="Total Events" value={stats.total.toString()} icon={<ShieldAlert className="text-blue-600"/>} color="blue"/>
        <StatCard label="Blocked" value={stats.blocked.toString()} warn={stats.blocked > 0} icon={<XCircle className="text-red-600"/>} color="red"/>
        <StatCard label="Allowed" value={stats.allowed.toString()} icon={<CheckCircle className="text-green-600"/>} color="green"/>
        <StatCard label="Flagged" value={stats.flagged.toString()} icon={<AlertTriangle className="text-yellow-600"/>} color="yellow"/>
        <StatCard label="Pending Release" value={stats.pendingRelease.toString()} warn={stats.pendingRelease > 0} icon={<Clock className="text-orange-600"/>} color="orange"/>
      </div>
      
      {/* Filters */}
      <div className="max-w-[1600px] mx-auto mb-4 card p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder="Search by channel, insurer, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>
          
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="ALL">All Results</option>
            <option value="blocked">Blocked Only</option>
            <option value="allowed">Allowed</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="ALL">All Reasons</option>
            <option value="MissingApp">Missing Appointment</option>
            <option value="LicenseExp">Expired License</option>
            <option value="CERequired">CE Requirement Not Met</option>
            <option value="ProdUnauth">Product Unauthorized</option>
            <option value="TrainingReq">Agent Training Required</option>
            <option value="OFACMatch">OFAC Watchlist Match</option>
            <option value="ChannelBlock">Channel Restricted</option>
          </select>
          
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
              <Download size={16}/> Export
            </button>
            <button className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
              <RefreshCw size={16}/> Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Interception Table */}
      <div className="max-w-[1600px] mx-auto card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Compliance Blockage Log ({filteredInterceptions.length} entries)</h3>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[rgba(246,248,255,0.9)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID & Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel & Insurer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[rgba(255,255,255,0.95)] divide-y divide-[rgba(193,198,215,0.25)]">
            {filteredInterceptions.map((inter, idx) => {
              const severityClass = getSeverityColor(inter.severity);
              const resultBadge = getResultBadge(inter.result);
              return (
                <tr key={inter.id} className="hover:bg-[rgba(246,248,255,0.55)] transition-colors" style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{inter.id}</div>
                    <div className="text-xs text-gray-500">{new Date(inter.timestamp).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{inter.channelName}</div>
                    <div className="text-xs text-gray-500">{inter.insurerShort}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inter.actionType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inter.state}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {inter.reasonDescriptions[inter.reason] || inter.reason}
                    </div>
                    {inter.reason === 'ofac-match' && (
                      <div className="text-xs text-red-600 mt-1">
                        Entity: {inter.matchedEntity || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-xs font-semibold border rounded-md ${severityClass}`}>
                    {inter.severity.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 border rounded-md text-xs font-semibold ${resultBadge.bg} ${resultBadge.text} ${resultBadge.border}`}>
                      {resultBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {inter.result === 'blocked' ? (
                      <>
                        <button 
                          onClick={() => setSelectedInterception(inter)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Details
                        </button>
                        {!inter.releasedAt && (
                          <button className="text-green-600 hover:text-green-900">Release</button>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Release Modal */}
      {selectedInterception && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Interception Details - {selectedInterception.id}
                </h3>
                <button 
                  onClick={() => setSelectedInterception(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Channel" value={selectedInterception.channelName}/>
                <DetailRow label="NPN" value={selectedInterception.channelNpn || 'N/A'}/>
                <DetailRow label="Insurer" value={selectedInterception.insurerShort}/>
                <DetailRow label="State" value={selectedInterception.state}/>
                <DetailRow label="Line of Authority" value={selectedInterception.lineOfAuthority || 'N/A'}/>
                <DetailRow label="Action Type" value={selectedInterception.actionType}/>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Violation Details</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="font-semibold text-red-900 mb-1">
                    Reason Code: {selectedInterception.reason}
                  </div>
                  <div className="text-sm text-gray-700">
                    {selectedInterception.reasonDescriptions[selectedInterception.reason]}
                  </div>
                  {selectedInterception.rejectionDetail && (
                    <div className="mt-2 text-xs text-gray-600">
                      Detail: {selectedInterception.rejectionDetail}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedInterception.matchedEntity && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">OFAC Match Information</h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Entity Name:</div>
                      <div className="font-medium">{selectedInterception.matchedEntity}</div>
                      <div className="text-gray-600">List Source:</div>
                      <div className="font-medium">{selectedInterception.listSource || 'SDN List'}</div>
                      <div className="text-gray-600">Match Score:</div>
                      <div className="font-medium">{selectedInterception.matchScore || 'N/A'}%</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Review & Resolution</h4>
                <div className="space-y-3">
                  {selectedInterception.reviewedBy && (
                    <div className="text-sm">
                      <span className="text-gray-600">Reviewed by:</span>{' '}
                      <span className="font-medium">{selectedInterception.reviewedBy}</span>
                      {selectedInterception.reviewedAt && (
                        <span className="text-gray-500 ml-2">
                          {new Date(selectedInterception.reviewedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedInterception.releaseNote && (
                    <div className="text-sm">
                      <span className="text-gray-600">Resolution Note:</span>{' '}
                      <span className="font-medium">{selectedInterception.releaseNote}</span>
                    </div>
                  )}
                  
                  {selectedInterception.result === 'blocked' && !selectedInterception.releasedAt && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleRelease(selectedInterception)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Confirm Release
                      </button>
                      <button
                        onClick={() => setSelectedInterception(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
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

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium text-gray-900">{value}</div>
  </div>
);
