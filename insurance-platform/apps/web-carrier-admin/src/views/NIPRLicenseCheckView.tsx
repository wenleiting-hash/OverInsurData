import { useState } from 'react';
import { ArrowLeft, Search, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import type { ViewId } from '@/App';
import { generateMockNIPRLicenses, type VerificationStatus } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function NIPRLicenseCheckView({ navigateTo }: Props) {
  const { t } = useTranslation('license');
  
  const [searchKey, setSearchKey] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<null | 'success' | 'error'>('success');
  const [verifyMessage, setVerifyMessage] = useState('');

  // Get all licenses data
  const allLicenses = generateMockNIPRLicenses();
  
  // Filter by search key
  const filteredLicenses = allLicenses.filter(license => 
    license.channelName.toLowerCase().includes(searchKey.toLowerCase()) ||
    license.npnNumber.toLowerCase().includes(searchKey.toLowerCase()) ||
    license.licenseNumber.toLowerCase().includes(searchKey.toLowerCase())
  );

  const handleSearch = () => {
    if (!searchKey.trim()) {
      alert('请输入渠道名称、NPN 或牌照号码进行查询');
    }
  };

  const handleVerifyNIPR = (channelName: string, npnNumber: string, state: string) => {
    setIsVerifying(true);
    setVerificationResult(null);
    setVerifyMessage('正在连接 NIPR API...');
    
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult('success');
      setVerifyMessage(`成功! NPN ${npnNumber} 在 ${state} 州已验证为有效状态`);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setVerificationResult(null);
        setVerifyMessage('');
      }, 2000);
    }, 1500);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      inactive: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: X },
      expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
      suspended: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertCircle },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: RefreshCw },
      cancelled: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200', icon: X },
    };
    const s = styles[status] || styles.active;
    const Icon = s.icon;
    return (
      <span className={`px-3 py-1.5 border rounded-md text-xs font-semibold flex items-center gap-2 ${s.bg} ${s.text} ${s.border}`}>
        <Icon className="w-3 h-3" />
        {status === 'active' ? '有效' : status === 'inactive' ? '非活动' : status === 'expired' ? '已过期' : status === 'suspended' ? '已暂停' : status === 'pending' ? '审核中' : '已取消'}
      </span>
    );
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    const styles: Record<VerificationStatus, { bg: string; text: string; border: string; label: string }> = {
      verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: '已验证 ✓' },
      mismatch: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: '数据不匹配 ✗' },
      'not-found': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: '未找到' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: '待验证' },
    };
    const s = styles[status];
    return (
      <span className={`px-3 py-1.5 border rounded-full text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
        {s.label}
      </span>
    );
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('appointment')} // Navigate to compliance main page
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回合规模块主页
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          NIPR License Checker
        </h1>
        <p className="text-gray-600">
          查询渠道商/代理人 NIPR 牌照状态与有效性
        </p>
      </div>

      {/* CE Hours Reminder */}
      <div className="mb-6 glass px-6 py-4 rounded-lg border-l-4 border-purple-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-800 mb-2">CE 学时提醒</h3>
            <p className="text-sm text-purple-700">
              部分州要求保险代理人完成继续教育（Continuing Education）学时才能维持牌照有效性。请密切关注渠道的 CE 完成情况。
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass p-6 rounded-xl">
        {/* Search Box */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            查询关键词
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="输入渠道名称、NPN 号或牌照号码..."
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            提示：同时搜索渠道名称、NPN 号码和州牌照号
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">渠道商</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NPN 号码</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">牌照信息</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">业务线</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态 & 到期</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">验证状态</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CE 学时</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenses.map(license => (
                <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{license.channelName}</div>
                    <div className="text-xs text-gray-500 mt-1">Residency: {license.residencyState}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-700">{license.npnNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{license.licenseNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">{license.licenseType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {license.lines.slice(0, 3).map(line => (
                        <span key={line} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                          {line}
                        </span>
                      ))}
                      {license.lines.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">+{license.lines.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(license.status)}
                      <div className="text-xs text-gray-600 mt-1">
                        到期:{formatDate(license.expiryDate)} ({daysUntilExpiry(license.expiryDate)}天)
                      </div>
                      {daysUntilExpiry(license.expiryDate) <= 30 && (
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          即将到期
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVerificationBadge(license.verificationStatus)}
                    <div className="text-xs text-gray-500 mt-1">最后验证:{formatDate(license.lastVerified)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={license.ceHoursCompleted && license.ceHoursRequired
                              ? license.ceHoursCompleted >= license.ceHoursRequired * 0.9
                                ? '#22c55e' // green
                                : license.ceHoursRequired
                                ? '#fbbf24' // yellow
                                : '#6b7280' // gray
                              : '#d1d5db' // gray
                            }
                            strokeWidth="3"
                            strokeDasharray={`${license.ceHoursCompleted && license.ceHoursRequired
                              ? (license.ceHoursCompleted / license.ceHoursRequired) * 100
                              : 0}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-900">
                            {license.ceHoursCompleted}/{license.ceHoursRequired}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {license.ceCompleted ? '✓ 已完成' : '× 未完成'}
                      </div>
                      {license.ceHoursCompleted && license.ceHoursRequired && (
                        <div className={`text-xs font-medium mt-1 ${
                          license.ceHoursCompleted >= license.ceHoursRequired * 0.9
                            ? 'text-green-600'
                            : license.ceHoursRequired
                            ? 'text-orange-600'
                            : 'text-gray-500'
                        }`}>
                          {license.ceHoursRequired ? `${Math.round((license.ceHoursCompleted / license.ceHoursRequired) * 100)}%` : '-'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleVerifyNIPR(license.channelName, license.npnNumber, license.state)}
                      disabled={isVerifying}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? '验证中...' : 'NIPR 验证'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-strong p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">总计牌照</div>
              <div className="text-2xl font-bold text-gray-900">{allLicenses.length}</div>
            </div>
            <div className="glass-strong p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">有效期数</div>
              <div className="text-2xl font-bold text-green-600">
                {allLicenses.filter(l => l.status === 'active').length}
              </div>
            </div>
            <div className="glass-strong p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">已过期/暂停</div>
              <div className="text-2xl font-bold text-red-600">
                {allLicenses.filter(l => l.status === 'expired' || l.status === 'suspended').length}
              </div>
            </div>
            <div className="glass-strong p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">CE 未完成</div>
              <div className="text-2xl font-bold text-orange-600">
                {allLicenses.filter(l => !l.ceCompleted).length}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredLicenses.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>没有找到匹配的牌照记录</p>
          </div>
        )}

        {/* Verification Result Toast */}
        {verificationResult && (
          <div className={`fixed bottom-4 right-4 glass p-4 rounded-lg shadow-lg max-w-md animate-fade-in ${
            verificationResult === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {verificationResult === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <X className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${
                  verificationResult === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  NIPR 验证 {verificationResult === 'success' ? '成功' : '失败'}
                </p>
                <p className="text-sm mt-1">{verifyMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
