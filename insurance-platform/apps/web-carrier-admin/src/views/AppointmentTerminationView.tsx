import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Flag, CheckCircle, XCircle } from 'lucide-react';
import type { ViewId } from '@/App';
import { generateMockAppointmentRecords } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function AppointmentTerminationView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  // Get all appointments data
  const allApps = generateMockAppointmentRecords();
  
  // Filter terminable appointments (approved status only)
  const terminableApps = allApps.filter(app => 
    app.status === 'approved' && 
    app.daysToExpiry > 0 &&
    app.renewalStatus !== 'in-progress'
  );
  
  // Termination reason modal state
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const handleOpenTerminateModal = (app: any) => {
    setSelectedApp(app);
    setTerminationReason('');
    setConfirmSubmit(false);
    setShowTerminateModal(true);
  };

  const handleCancelTerminate = () => {
    setShowTerminateModal(false);
    setSelectedApp(null);
    setTerminationReason('');
    setConfirmSubmit(false);
  };

  const handleSubmitTermination = () => {
    if (!terminationReason.trim()) return;
    
    // Here you would call API to submit termination
    console.log(`Terminating appointment ${selectedApp?.id}`, { reason: terminationReason });
    
    // Show success and close modal
    alert(`已提交终止申请\n原因：${terminationReason}`);
    setShowTerminateModal(false);
    setSelectedApp(null);
    setTerminationReason('');
    setConfirmSubmit(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '已批准' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: '待审核' },
      'under-review': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: '审核中' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '已拒绝' },
      expired: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: '已过期' },
      terminated: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: '已终止' },
    };
    const s = styles[status] || styles.approved;
    return (
      <span className={`px-3 py-1.5 border rounded-md text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('appointment')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回列表页
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          续期与终止管理
        </h1>
        <p className="text-gray-600">
          管理 Appointment 的续期和终止流程
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 glass px-4 py-2 rounded-t-lg inline-flex gap-1">
        <button
          className="px-6 py-3 bg-white text-gray-900 font-semibold border-b-2 border-blue-500 rounded-t-lg"
        >
          续期与终止
        </button>
      </div>

      {/* Main Content */}
      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">可终止的 Appointment</h2>

        {/* Termination Warning Box */}
        <div className="mb-6 p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">⚠️ 终止前须知</h3>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>终止 Appointment 后，渠道将无法在对应州/业务线为该保险公司出单</li>
                <li>终止操作将通过 NIPR 向监管机构报告，不可撤销</li>
                <li>所有未完成的保单将受到严重影响，请谨慎操作</li>
                <li>请务必填写真实的终止原因以便后续审计</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">渠道商</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">保险公司</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">州/业务线</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">批准日期</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">到期日</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">剩余天数</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {terminableApps.map((app, index) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.channelName}</div>
                    <div className="text-xs text-gray-500 mt-1">NPN: {app.channelNpn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.insurerShort}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                      {app.state} · {app.line}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(app.approvedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(app.expiryDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        app.daysToExpiry <= 30
                          ? 'text-red-600'
                          : app.daysToExpiry <= 90
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {app.daysToExpiry > 0 ? `${app.daysToExpiry}天` : `-${Math.abs(app.daysToExpiry)}天`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenTerminateModal(app)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors shadow-sm"
                    >
                      申请终止
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {terminableApps.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Flag className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>当前无可终止的 Appointment</p>
          </div>
        )}

        {/* Summary */}
        {terminableApps.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              共<span className="font-semibold text-gray-900">{terminableApps.length}</span>条可终止记录
            </p>
          </div>
        )}
      </div>

      {/* Termination Confirmation Modal */}
      {showTerminateModal && selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">确认终止申请</h3>
                  <p className="text-sm text-gray-600 mt-1">请填写终止原因并确认操作</p>
                </div>
                <button
                  onClick={handleCancelTerminate}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Selected App Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">即将终止的信息:</h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600">渠道商</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.channelName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">保险公司</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.insurerShort}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">州/业务线</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.state} · {selectedApp.line}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">到期日</dt>
                    <dd className="font-medium text-gray-900">{formatDate(selectedApp.expiryDate)}</dd>
                  </div>
                </dl>
              </div>

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  终止原因 * (必填)
                </label>
                <textarea
                  rows={4}
                  placeholder="请输入终止原因，例如：渠道主动申请终止、合作到期不再续约等..."
                  value={terminationReason}
                  onChange={e => setTerminationReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                {!terminationReason.trim() && (
                  <p className="text-xs text-red-600 mt-1">终止原因不能为空</p>
                )}
              </div>

              {/* Warning Message */}
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-xs text-orange-700">
                  ⚠️ 此操作将向 NIPR 提交终止申请，一旦提交将不可撤销。请确保已与合作方协商一致。
                </p>
              </div>

              {/* Checkbox for acknowledgment */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmSubmit}
                    onChange={e => setConfirmSubmit(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm text-gray-700">
                    我理解上述风险，确认要终止该 Appointment
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCancelTerminate}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitTermination}
                  disabled={!terminationReason.trim() || !confirmSubmit}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
