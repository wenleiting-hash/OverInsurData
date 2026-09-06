import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// TypeScript types
export interface MFASetting {
  isEnabled: boolean;
  isSetupComplete: boolean;
  backupCodes?: string[];
}

interface MFAState {
  mfaSetting: MFASetting | null;
  isLoading: boolean;
  isSetupPending: boolean; // Waiting for user to scan QR and enter code
}

interface GenerateSecretResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface VerifyMFARequest {
  secret: string;
  code: string;
  backupCode?: string;
}

interface MFAContextType extends MFAState {
  generateSecret: () => Promise<GenerateSecretResponse>;
  verifyAndEnableMFA: (code: string) => Promise<void>;
  disableMFA: () => Promise<void>;
  regenerateBackupCodes: () => Promise<string[]>;
  clearPendingState: () => void;
}

// Create context with undefined
const MFAContext = createContext<MFAContextType | undefined>(undefined);

// Provider component
export function MFAProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MFAState>({
    mfaSetting: null,
    isLoading: true,
    isSetupPending: false,
  });

  // Initialize MFA state from localStorage on mount
  useEffect(() => {
    try {
      const mfaData = localStorage.getItem('auth.mfa_setting');
      if (mfaData) {
        const parsed = JSON.parse(mfaData);
        setState({
          mfaSetting: parsed,
          isLoading: false,
          isSetupPending: false,
        });
      } else {
        setState({
          mfaSetting: null,
          isLoading: false,
          isSetupPending: false,
        });
      }
    } catch (error) {
      console.error('Error initializing MFA state:', error);
      setState({
        mfaSetting: null,
        isLoading: false,
        isSetupPending: false,
      });
    }
  }, []);

  // Generate TOTP secret and QR code
  const generateSecret = async (): Promise<GenerateSecretResponse> => {
    // TODO: Implement Speakeasy integration
    // For now, return mock data
    const mockSecret = 'JBSWY3DPEHPK3PXP';
    const issuer = 'InsureOS';
    const accountName = localStorage.getItem('auth.user_info') 
      ? JSON.parse(localStorage.getItem('auth.user_info')!).username 
      : 'user@insureos.com';
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=otpauth://totp/${issuer}:${accountName}?secret=${mockSecret}&issuer=${issuer}&size=200x200`;
    
    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store pending secret for verification
    localStorage.setItem('auth.mfa_pending_secret', mockSecret);
    localStorage.setItem('auth.mfa_pending_backup_codes', JSON.stringify(backupCodes));

    setState(prev => ({
      ...prev,
      isSetupPending: true,
    }));

    return { secret: mockSecret, qrCodeUrl, backupCodes };
  };

  // Verify TOTP code and enable MFA
  const verifyAndEnableMFA = async (code: string): Promise<void> => {
    const pendingSecret = localStorage.getItem('auth.mfa_pending_secret');
    const pendingBackupCodes = localStorage.getItem('auth.mfa_pending_backup_codes');

    if (!pendingSecret || !pendingBackupCodes) {
      throw new Error('No pending MFA setup found. Please start over.');
    }

    // TODO: Implement Speakeasy TOTP verification
    // For demo, accept any 6-digit code
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Invalid verification code');
    }

    const backupCodes = JSON.parse(pendingBackupCodes);

    // Save MFA settings
    const mfaSetting: MFASetting = {
      isEnabled: true,
      isSetupComplete: true,
      backupCodes,
    };

    localStorage.setItem('auth.mfa_setting', JSON.stringify(mfaSetting));
    localStorage.removeItem('auth.mfa_pending_secret');
    localStorage.removeItem('auth.mfa_pending_backup_codes');

    setState({
      mfaSetting,
      isLoading: false,
      isSetupPending: false,
    });
  };

  // Disable MFA (requires current password verification)
  const disableMFA = async (): Promise<void> => {
    const password = prompt('请输入您的密码以确认禁用 MFA:');
    
    if (!password) {
      throw new Error('Password required to disable MFA');
    }

    // TODO: Call backend API to disable MFA
    // await apiClient.post('/auth/disable-mfa', { password });

    localStorage.removeItem('auth.mfa_setting');

    setState(prev => ({
      ...prev,
      mfaSetting: null,
      isSetupPending: false,
    }));
  };

  // Regenerate backup codes
  const regenerateBackupCodes = async (): Promise<string[]> => {
    if (!state.mfaSetting?.isEnabled) {
      throw new Error('MFA not enabled');
    }

    // Generate new backup codes
    const newBackupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    const updatedMfaSetting: MFASetting = {
      ...state.mfaSetting,
      backupCodes: newBackupCodes,
    };

    localStorage.setItem('auth.mfa_setting', JSON.stringify(updatedMfaSetting));

    setState(prev => ({
      ...prev!,
      mfaSetting: updatedMfaSetting,
    }));

    return newBackupCodes;
  };

  // Clear pending state (used when user cancels setup)
  const clearPendingState = () => {
    localStorage.removeItem('auth.mfa_pending_secret');
    localStorage.removeItem('auth.mfa_pending_backup_codes');
    
    setState(prev => ({
      ...prev,
      isSetupPending: false,
    }));
  };

  return (
    <MFAContext.Provider value={{ 
      ...state, 
      generateSecret, 
      verifyAndEnableMFA, 
      disableMFA, 
      regenerateBackupCodes,
      clearPendingState
    }}>
      {children}
    </MFAContext.Provider>
  );
}

// Custom hook to use MFA context
export const useMFA = (): MFAContextType => {
  const context = useContext(MFAContext);
  
  if (context === undefined) {
    throw new Error('useMFA must be used within an MFAProvider');
  }
  
  return context;
};
