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
    alert(t('terminate.submitSuccess', { reason: terminationReason }));
    setShowTerminateModal(false);
    setSelectedApp(null);
    setTerminationReason('');
    setConfirmSubmit(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      'under-review': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      expired: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      terminated: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    };
    const labelKeys: Record<string, string> = {
      approved: 'approved',
      pending: 'pending',
      'under-review': 'underReview',
      rejected: 'rejected',
      expired: 'expired',
      terminated: 'terminated',
    };
    const s = styles[status] || styles.approved;
    return (
      <span className={`px-3 py-1.5 border rounded-md text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
        {t(`terminate.status.${labelKeys[status] || 'approved'}`)}
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
          {t('terminate.backToList')}
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('terminate.title')}
        </h1>
        <p className="text-gray-600">
          {t('terminate.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 glass px-4 py-2 rounded-t-lg inline-flex gap-1">
        <button
          className="px-6 py-3 bg-white text-gray-900 font-semibold border-b-2 border-blue-500 rounded-t-lg"
        >
          {t('terminate.tab')}
        </button>
      </div>

      {/* Main Content */}
      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('terminate.listTitle')}</h2>

        {/* Termination Warning Box */}
        <div className="mb-6 p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">{t('terminate.noticeTitle')}</h3>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>{t('terminate.noticeItem1')}</li>
                <li>{t('terminate.noticeItem2')}</li>
                <li>{t('terminate.noticeItem3')}</li>
                <li>{t('terminate.noticeItem4')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.channel')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.insurer')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.stateLine')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.approvedDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.expiryDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.daysRemaining')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('terminate.col.actions')}</th>
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
                      {t('terminate.days', { n: app.daysToExpiry > 0 ? app.daysToExpiry : -Math.abs(app.daysToExpiry) })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenTerminateModal(app)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors shadow-sm"
                    >
                      {t('terminate.applyTerminate')}
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
            <p>{t('terminate.empty')}</p>
          </div>
        )}

        {/* Summary */}
        {terminableApps.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('terminate.summaryPrefix')}
              <span className="font-semibold text-gray-900">{terminableApps.length}</span>
              {t('terminate.summarySuffix')}
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
                  <h3 className="text-xl font-bold text-gray-900">{t('terminate.modalTitle')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('terminate.modalSubtitle')}</p>
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
                <h4 className="font-semibold text-gray-800 mb-2">{t('terminate.selectedInfoTitle')}</h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600">{t('terminate.col.channel')}</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.channelName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">{t('terminate.col.insurer')}</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.insurerShort}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">{t('terminate.col.stateLine')}</dt>
                    <dd className="font-medium text-gray-900">{selectedApp.state} · {selectedApp.line}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">{t('terminate.col.expiryDate')}</dt>
                    <dd className="font-medium text-gray-900">{formatDate(selectedApp.expiryDate)}</dd>
                  </div>
                </dl>
              </div>

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('terminate.reasonLabel')}
                </label>
                <textarea
                  rows={4}
                  placeholder={t('terminate.reasonPlaceholder')}
                  value={terminationReason}
                  onChange={e => setTerminationReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                {!terminationReason.trim() && (
                  <p className="text-xs text-red-600 mt-1">{t('terminate.reasonRequired')}</p>
                )}
              </div>

              {/* Warning Message */}
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-xs text-orange-700">
                  {t('terminate.irreversibleWarning')}
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
                    {t('terminate.acknowledge')}
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCancelTerminate}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  {t('terminate.cancel')}
                </button>
                <button
                  onClick={handleSubmitTermination}
                  disabled={!terminationReason.trim() || !confirmSubmit}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {t('terminate.confirmSubmit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
