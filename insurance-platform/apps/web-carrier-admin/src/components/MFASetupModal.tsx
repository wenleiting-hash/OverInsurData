import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, QrCode, AlertTriangle, RefreshCw } from 'lucide-react';
import { useMFA } from '../contexts/MFAContext';

interface MFASetupModalProps {
  onClose: () => void;
}

export function MFASetupModal({ onClose }: MFASetupModalProps) {
  const { t } = useTranslation('mfa');
  const { generateSecret, verifyAndEnableMFA, clearPendingState } = useMFA();
  
  const [step, setStep] = useState<'generating' | 'scanning' | 'verifying'>('generating');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Step 1: Generate secret and QR code
  const handleGenerateSecret = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { qrCodeUrl: url, backupCodes: codes } = await generateSecret();
      setQrCodeUrl(url);
      setBackupCodes(codes);
      setStep('scanning');
    } catch (err: any) {
      setError(err.message || t('errors.generateFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify TOTP code
  const handleVerifyCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyAndEnableMFA(verificationCode);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('errors.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onSuccess = () => {
    alert(t('success.mfaEnabled'));
    onClose();
  };

  const onBackupCodesViewed = () => {
    // User confirmed they've saved backup codes
    // This is a simplification - in production, you'd want more safeguards
    setStep('verifying');
  };

  const onCancel = () => {
    clearPendingState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-[#717786] hover:text-[#414755]"
          aria-label={t('a11y.close')}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
          <Shield className="text-[#0058BC]" size={24} />
          <h2 className="text-lg font-semibold text-[#181C23]">
            {t('title')}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step 1: Generating */}
          {step === 'generating' && (
            <div className="space-y-4">
              <p className="text-sm text-[#717786]">{t('steps.initial')}</p>
              <button
                onClick={handleGenerateSecret}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0058BC] px-4 py-3 font-medium text-white transition-all"
                style={{
                  opacity: loading ? 0.7 : 1,
                  boxShadow: loading ? 'none' : '0 2px 8px rgba(0,88,188,0.25)',
                }}
              >
                <QrCode size={18} />
                {loading ? t('actions.generating') : t('actions.enableMFA')}
              </button>
            </div>
          )}

          {/* Step 2: Scanning QR Code */}
          {step === 'scanning' && (
            <div className="space-y-4">
              <p className="text-sm text-[#414755] font-medium">{t('steps.scanTitle')}</p>
              
              {/* QR Code */}
              <div className="flex items-center justify-center py-6">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="TOTP QR Code"
                    className="rounded-lg border-2 border-[#0058BC]"
                    style={{ width: 200, height: 200 } as any}
                  />
                )}
              </div>

              <p className="text-xs text-[#717786] text-center">
                {t('steps.scanDesc')}
              </p>

              {/* Backup codes warning */}
              <div 
                className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-left"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 shrink-0 text-yellow-600" size={16} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {t('warnings.backupCodes.title')}
                    </p>
                    <button
                      onClick={onBackupCodesViewed}
                      className="mt-2 text-sm font-medium text-[#0058BC] underline"
                    >
                      {t('warnings.backupCodes.action')}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={onCancel}
                className="w-full cursor-pointer rounded-lg border border-gray-300 py-2.5 font-medium text-[#414755] hover:bg-gray-50"
              >
                {t('actions.cancel')}
              </button>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 'verifying' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-[#417755]">
                {t('steps.verifyTitle')}
              </p>

              {/* Verification code input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#414755]">
                  {t('forms.codeLabel')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#0058BC';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,88,188,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(193,198,215,0.7)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    color: '#181C23',
                    background: 'rgba(241,243,254,0.8)',
                    border: '1px solid rgba(193,198,215,0.7)',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'center' as const,
                    letterSpacing: '4px',
                    fontWeight: 600,
                  }}
                />
                <p className="mt-1 text-xs text-[#9EA6B4]">
                  {t('forms.codeHint')}
                </p>
              </div>

              {error && (
                <div className="text-center text-xs text-[#BA1A1A]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0058BC] px-4 py-3 font-medium text-white transition-all"
                style={{
                  opacity: (loading || verificationCode.length !== 6) ? 0.5 : 1,
                  pointerEvents: (loading || verificationCode.length !== 6) ? 'none' : 'auto',
                }}
              >
                {loading ? t('actions.verifying') : t('actions.verify')}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full cursor-pointer rounded-lg border border-gray-300 py-2.5 font-medium text-[#414755] hover:bg-gray-50"
              >
                {t('actions.cancel')}
              </button>
            </form>
          )}

          {/* Backup Codes Display (after viewing) */}
          {step === 'verifying' && backupCodes.length > 0 && (
            <div className="mt-4">
              <details className="rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer text-sm font-medium text-[#0058BC]">
                  {t('sections.backupCodes')}
                </summary>
                <div className="mt-3 space-y-1">
                  {backupCodes.map((code, idx) => (
                    <div 
                      key={idx}
                      className="rounded bg-gray-50 px-3 py-2 text-center font-mono text-sm font-medium text-[#414755]"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#717786]">
                  {t('texts.backupCodesNote')}
                </p>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-xs text-[#717786] text-center">
            {t('footer.info')}
          </p>
        </div>
      </div>
    </div>
  );
}
