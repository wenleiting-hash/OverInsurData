import { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, Download, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMFA } from '../contexts/MFAContext';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MFAModal({ isOpen, onClose }: MFAModalProps) {
  const { t } = useTranslation(['settings', 'common']);
  const {
    generateSecret,
    verifyAndEnableMFA,
    regenerateBackupCodes,
    clearPendingState,
    isLoading,
  } = useMFA();

  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Step 1: Show QR Code
  const handleShowQR = async () => {
    setError('');
    try {
      const mfaSecret = await generateSecret();
      setSecret(mfaSecret.secret);
      setQrCodeUrl(mfaSecret.qrCodeUrl);
      localStorage.setItem('mfa_backup_codes', JSON.stringify(mfaSecret.backupCodes));
      setStep('qr');
    } catch (err) {
      setError(t('mfa:error.setupFailed', 'Failed to setup MFA'));
    }
  };

  // Step 2: Verify Code
  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setError(t('mfa:invalidCode', 'Please enter a valid 6-digit code'));
      return;
    }

    try {
      await verifyAndEnableMFA(verificationCode);
      setStep('backup');
    } catch (err) {
      setError(t('mfa:invalidCode', 'Invalid code. Please try again.'));
    }
  };

  // Step 3: Generate Backup Codes
  const handleGenerateBackup = async () => {
    try {
      const codes = await regenerateBackupCodes();
      localStorage.setItem('mfa_backup_codes', JSON.stringify(codes));
    } catch (err) {
      setError(t('mfa:error.generateBackupFailed', 'Failed to generate backup codes'));
      return;
    }
    setStep('backup');
  };

  // Close modal and reset state
  const handleClose = () => {
    onClose();
    setStep('qr');
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-lg rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(193, 198, 215, 0.5)' }}>
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} color="#0058BC" />
            <h2 className="text-xl font-semibold">{t('mfa:title', 'Two-Factor Authentication')}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: QR Code Display */}
          {step === 'qr' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-[#414755]">
                  {t('mfa:scanQR', 'Scan the QR code with your authenticator app')}
                </p>
                
                {qrCodeUrl ? (
                  <div className="flex justify-center p-4 bg-white rounded-lg inline-block mx-auto">
                    <img 
                      src={qrCodeUrl} 
                      alt="MFA QR Code" 
                      className="w-64 h-64 border-4 border-gray-100 rounded-lg"
                    />
                  </div>
                ) : (
                  <button
                    onClick={handleShowQR}
                    disabled={isLoading}
                    className="px-6 py-3 text-sm font-medium text-white rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                      opacity: isLoading ? 0.7 : 1,
                      boxShadow: '0 4px 14px rgba(0, 88, 188, 0.35)',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                        {t('common:loading', 'Loading')}...
                      </>
                    ) : (
                      t('mfa:showQRCode', 'Show QR Code')
                    )}
                  </button>
                )}

                <p className="text-xs text-[#717786]">
                  {t('mfa:recommendedApps', 'Recommended apps: Google Authenticator, Authy, Microsoft Authenticator')}
                </p>
              </div>

              {/* Next button */}
              {qrCodeUrl && (
                <button
                  onClick={() => setStep('verify')}
                  className="w-full py-3 text-sm font-medium text-white rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                    boxShadow: '0 4px 14px rgba(0, 88, 188, 0.35)',
                  }}
                >
                  {t('mfa:nextStep', 'Next: Verify Code')} →
                </button>
              )}
            </div>
          )}

          {/* Step 2: Verification Code Input */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-[#414755]">
                  {t('mfa:enterCode', 'Enter the 6-digit code from your authenticator app')}
                </p>

                <form onSubmit={handleVerify} className="space-y-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className="w-full px-4 py-3 text-center text-xl tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      borderColor: 'rgba(193, 198, 215, 0.7)',
                      background: 'rgba(241, 243, 254, 0.8)',
                    }}
                    autoFocus
                  />

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('qr');
                        setVerificationCode('');
                        setError('');
                      }}
                      className="flex-1 py-3 text-sm font-medium"
                      style={{
                        background: '#F8F9FA',
                        border: '1px solid rgba(193, 198, 215, 0.5)',
                      }}
                    >
                      ← {t('mfa:back')}
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || verificationCode.length !== 6}
                      className="flex-1 py-3 text-sm font-medium text-white rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                        opacity: isLoading || verificationCode.length !== 6 ? 0.5 : 1,
                        boxShadow: '0 4px 14px rgba(0, 88, 188, 0.35)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        t('mfa:verify', 'Verify Code')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 'backup' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-[#414755]">
                  {t('mfa:backupCodesDesc', 'Your backup codes can be used to access your account if you lose your authenticator device')}
                </p>

                {!localStorage.getItem('mfa_backup_codes') ? (
                  <button
                    onClick={handleGenerateBackup}
                    className="w-full py-3 text-sm font-medium text-white rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                      boxShadow: '0 4px 14px rgba(0, 88, 188, 0.35)',
                    }}
                  >
                    {t('mfa:generateBackup', 'Generate Backup Codes')} →
                  </button>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      💾 <strong>Important:</strong> Download or print these codes and store them in a safe place
                    </p>
                    
                    <div 
                      className="font-mono text-xs bg-white p-3 rounded border break-all"
                      style={{ fontSize: '10px' }}
                    >
                      {JSON.parse(localStorage.getItem('mfa_backup_codes') || '[]').join('\n')}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.parse(localStorage.getItem('mfa_backup_codes') || '[]').join('\n')
                        );
                        alert('Backup codes copied to clipboard!');
                      }}
                      className="mt-3 w-full py-2 text-sm font-medium"
                      style={{
                        background: '#F8F9FA',
                        border: '1px solid rgba(193, 198, 215, 0.5)',
                      }}
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                )}

                {localStorage.getItem('mfa_backup_codes') && (
                  <button
                    onClick={() => {
                      clearPendingState();
                      handleClose();
                    }}
                    className="w-full py-3 text-sm font-medium text-white rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                      boxShadow: '0 4px 14px rgba(0, 88, 188, 0.35)',
                    }}
                  >
                    <CheckCircle className="inline-block w-4 h-4 mr-2" />
                    I've saved my backup codes
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
