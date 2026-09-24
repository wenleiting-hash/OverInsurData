import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Key, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { useMFA } from '../contexts/MFAContext';
import { MFASetupModal } from './MFASetupModal';

export function MFASettings() {
  const { t } = useTranslation('mfa');
  const { mfaSetting, disableMFA, regenerateBackupCodes } = useMFA();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (mfaSetting?.isEnabled) {
    // MFA is already enabled - show status and disable option
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="text-green-600" size={28} />
          <div>
            <h3 className="text-base font-semibold text-[#181C23]">
              {t('status.enabled')}
            </h3>
            <p className="text-sm text-[#717786]">
              {t('status.activeDesc')}
            </p>
          </div>
        </div>

        {/* Backup codes management */}
        <div className="mt-4 rounded-lg bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="text-[#0058BC]" size={20} />
              <div>
                <p className="font-medium text-[#181C23]">
                  {t('sections.backupCodes')}
                </p>
                <p className="text-xs text-[#717786]">
                  {backupCodes.length > 0 
                    ? `${backupCodes.length} codes available` 
                    : 'No backup codes saved'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (backupCodes.length > 0) {
                  setBackupCodes([]);
                } else {
                  setBackupCodes([...Array(10)].map(() => 
                    Math.random().toString(36).substring(2, 10).toUpperCase()
                  ));
                }
              }}
              disabled={loading}
              className="cursor-pointer rounded-lg border border-[#0058BC] px-4 py-2 font-medium text-[#0058BC] hover:bg-blue-50 transition-all"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t('actions.generating') : (
                backupCodes.length > 0 ? t('actions.viewCodes') : t('actions.generate')
              )}
            </button>
          </div>

          {backupCodes.length > 0 && (
            <details className="mt-3 rounded bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-[#0058BC]">
                查看备份代码
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div 
                    key={idx}
                    className="rounded bg-white px-3 py-2 text-center font-mono text-sm font-medium text-[#414755] shadow-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#9EA6B4]">
                {t('texts.saveNote')}
              </p>
            </details>
          )}
        </div>

        {/* Disable button with warning */}
        <div className="mt-6 border-t border-green-200 pt-4">
          <button
            onClick={async () => {
              if (confirm(t('warnings.disableConfirm'))) {
                setLoading(true);
                try {
                  await disableMFA();
                  setBackupCodes([]);
                  alert(t('success.disabled'));
                } catch (err: any) {
                  setError(err.message || t('errors.disableFailed'));
                } finally {
                  setLoading(false);
                }
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 transition-all"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Unlock size={18} />
            {t('actions.disable')}
          </button>
          
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // MFA not enabled - show setup option
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <Shield className="text-[#0058BC]" size={28} />
        <div>
          <h3 className="text-base font-semibold text-[#181C23]">
            {t('title')}
          </h3>
          <p className="text-sm text-[#717786]">
            {t('desc')}
          </p>
        </div>
      </div>

      {/* Benefits list */}
      <ul className="mb-6 space-y-2 pl-6">
        <li className="text-sm text-[#414755]">• {t('benefits.improvedSecurity')}</li>
        <li className="text-sm text-[#414755]">• {t('benefits.backupCodes')}</li>
        <li className="text-sm text-[#414755]">• {t('benefits.recoveryAccess')}</li>
      </ul>

      {/* Setup button */}
      <button
        onClick={() => setShowSetupModal(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0058BC] px-4 py-3 font-medium text-white transition-all hover:bg-blue-600"
        style={{ boxShadow: '0 2px 8px rgba(0,88,188,0.25)' }}
      >
        <Lock size={18} />
        {t('actions.enable')}
      </button>

      {/* Supported apps info */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-medium text-[#717786] mb-2">
          {t('supportedApps.title')}
        </p>
        <div className="space-y-1 text-xs text-[#9EA6B4]">
          <p>• Google Authenticator</p>
          <p>• Microsoft Authenticator</p>
          <p>• Authy</p>
          <p>• 1Password / LastPass</p>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 shrink-0 text-yellow-600" size={16} />
          <p className="text-xs text-yellow-800">
            {t('warnings.importance')}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showSetupModal && (
        <MFASetupModal onClose={() => setShowSetupModal(false)} />
      )}
    </div>
  );
}
