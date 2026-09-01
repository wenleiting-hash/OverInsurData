import { useState } from 'react';
import { ArrowLeft, Search, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ViewId } from '@/App';
import { OFAC_SCREENINGS, type OFACResult } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function OFACScreeningView({ navigateTo }: Props) {
  const { t } = useTranslation('ofac');
  
  const [searchKey, setSearchKey] = useState('');
  const [screeningEntityName, setScreeningEntityName] = useState('');
  const [screeningEntityType, setScreeningEntityType] = useState<'Individual' | 'Company' | 'Vessel' | 'Aircraft'>('Company');
  const [isScreening, setIsScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any>(null);

  // Get all screenings data
  const allScreenings = OFAC_SCREENINGS;

  // Filter by search key
  const filteredScreenings = allScreenings.filter(screening => 
    screening.entityName.toLowerCase().includes(searchKey.toLowerCase()) ||
    screening.result === searchKey
  );

  const handleScreenEntity = () => {
    if (!screeningEntityName.trim()) {
      alert('请输入实体名称进行 OFAC 筛查');
      return;
    }

    setIsScreening(true);
    setScreeningResult(null);

    // Simulate NIPR API call
    setTimeout(() => {
      setIsScreening(false);
      
      // Mock response - randomly show different results for demo
      const mockResults: Array<{ result: OFACResult; matchScore?: number; matchedEntry?: string; matchedList?: string; reviewNote?: string }> = [
        { result: 'clear' },
        { result: 'watchlist', matchScore: 78, matchedEntry: 'Sample Matched Entry', matchedList: 'SDN List', reviewNote: '经人工核查，确认为不同实体' },
        { result: 'blocked', matchScore: 96, matchedEntry: 'BLACKLISTED ENTITY', matchedList: 'SDN List', reviewNote: '确认为制裁名单人员/实体，拒绝出单' }
      ];

      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      setScreeningResult({
        entityName: screeningEntityName,
        entityType: screeningEntityType,
        screenedAt: new Date().toLocaleString('zh-CN'),
        ...randomResult
      });
    }, 1500);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusBadge = (result: OFACResult) => {
    const styles: Record<OFACResult, { bg: string; text: string; border: string; label: string; icon: any }> = {
      clear: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '通过 Clear', icon: CheckCircle },
      watchlist: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: '预警 Watchlist', icon: AlertTriangle },
      blocked: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '阻断 Blocked', icon: XCircle },
      pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: '待筛查 Pending', icon: Search },
    };
    const s = styles[result];
    const Icon = s.icon;
    return (
      <span className={`px-3 py-1.5 border rounded-md text-xs font-semibold flex items-center gap-2 ${s.bg} ${s.text} ${s.border}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  const canOverride = (result: OFACResult) => {
    return result !== 'blocked'; // Only clear and watchlist can be overridden
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('appointment')} // Navigate to compliance main page (ViewId needs update)
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回合规模块主页
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          OFAC Screening Center
        </h1>
        <p className="text-gray-600">
          筛查保单持有人、被保险人和受益人是否与美国财政部海外资产控制办公室制裁名单匹配
        </p>
      </div>

      {/* Warning Box */}
      <div className="mb-6 glass px-6 py-4 rounded-lg border-l-4 border-red-500">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-2">OFAC 筛查强制要求</h3>
            <p className="text-sm text-red-700 leading-relaxed">
              ⚠️ 根据美国联邦法律，所有保险交易在进行前必须筛查 OFAC SDN List（特别指定国民名单）、SDGT List（制裁目标全球恐怖分子名单）等制裁名单。未通过 OFAC 筛查的交易不得执行。
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Screening Form */}
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-xl sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Screening Request</h2>

            {/* Entity Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                实体名称 *
              </label>
              <input
                type="text"
                placeholder="输入公司或个人名称..."
                value={screeningEntityName}
                onChange={e => setScreeningEntityName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleScreenEntity()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Entity Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                实体类型 *
              </label>
              <div className="space-y-2">
                {['Company', 'Individual', 'Vessel', 'Aircraft'].map(type => (
                  <label
                    key={type}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      screeningEntityType === type
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="entityType"
                      value={type}
                      checked={screeningEntityType === type}
                      onChange={e => setScreeningEntityType(e.target.value as any)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleScreenEntity}
              disabled={isScreening || !screeningEntityName.trim()}
              className="w-full px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScreening ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  筛查中...
                </span>
              ) : (
                '开始 OFAC 筛查'
              )}
            </button>

            {/* Quick Examples */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-3">快速示例:</p>
              <div className="space-y-2">
                {['Desert Solar Holdings', 'Gulf Coast Energy Partners', 'Ali Hassan Al-Rashid'].map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      setScreeningEntityName(name);
                      setScreeningResult(null);
                    }}
                    className="block w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors truncate"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & History */}
        <div className="lg:col-span-2">
          {/* Screening Result Display */}
          {screeningResult && (
            <div className="glass p-6 rounded-xl mb-6 animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Screening Result</h2>
                {getStatusBadge(screeningResult.result)}
              </div>

              {/* Result Info */}
              <dl className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <dt className="text-sm text-gray-600">被筛查实体</dt>
                  <dd className="text-lg font-semibold text-gray-900">{screeningResult.entityName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">实体类型</dt>
                  <dd className="text-sm font-medium text-gray-900">{screeningResult.entityType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">筛查时间</dt>
                  <dd className="text-sm font-mono text-gray-700">{screeningResult.screenedAt}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">筛查引擎</dt>
                  <dd className="text-sm font-medium text-gray-900">System Auto</dd>
                </div>
              </dl>

              {/* Alert for Watchlist/Blocked */}
              {(screeningResult.result === 'watchlist' || screeningResult.result === 'blocked') && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ 风险识别</p>
                  {screeningResult.matchScore && (
                    <p className="text-sm text-yellow-700 mb-1">相似度得分：<span className="font-semibold">{screeningResult.matchScore}%</span></p>
                  )}
                  {screeningResult.matchedEntry && (
                    <p className="text-sm text-yellow-700 mb-1">匹配条目：<span className="font-mono">{screeningResult.matchedEntry}</span></p>
                  )}
                  {screeningResult.matchedList && (
                    <p className="text-sm text-yellow-700">匹配清单：<span className="font-mono">{screeningResult.matchedList}</span></p>
                  )}
                </div>
              )}

              {/* Review Section for Watchlist/Blocked */}
              {screeningResult.result !== 'clear' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">人工审核意见 (Required)</h3>
                  <textarea
                    rows={3}
                    placeholder="填写人工核查结果或理由..."
                    defaultValue={screeningResult.reviewNote || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-md">
                      ✓ 确认通过 (Override)
                    </button>
                    <button className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md">
                      × 保持拦截 (Block)
                    </button>
                  </div>
                </div>
              )}

              {/* Clear Result Success Message */}
              {screeningResult.result === 'clear' && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-sm text-green-800 font-semibold">✓ OFAC 筛查通过</p>
                  <p className="text-xs text-green-700 mt-1">该实体不在任何制裁名单上，可以继续交易流程。</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Screening History */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Screening History</h2>

            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜索筛查记录..."
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">实体名称</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">结果</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">匹配度</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">筛查时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredScreenings.map(screening => (
                    <tr key={screening.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{screening.entityName}</div>
                        {screening.policyId && (
                          <div className="text-xs text-gray-500 mt-1">Policy: {screening.policyId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{screening.entityType}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(screening.result)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {screening.matchScore ? (
                          <span className="text-sm font-semibold text-red-600">{screening.matchScore}%</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(screening.timestamp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {screening.reviewedBy && (
                          <span className="text-xs text-gray-500">Reviewed by: {screening.reviewedBy}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                共<span className="font-semibold text-gray-900">{allScreenings.length}</span>条筛查记录
              </p>
            </div>

            {/* Empty State */}
            {filteredScreenings.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p>暂无筛查记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
