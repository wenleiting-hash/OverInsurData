import { useState, useEffect } from 'react';
import { X, LogOut, Check, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import type { ViewId } from '@/App';
import { MFAModal } from './MFAModal';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  navigateTo: (view: ViewId, params?: any) => void;
}

const LANGUAGES = [
  { code: 'zh-CN', nameKey: 'settings.langZh' },
  { code: 'en-US', nameKey: 'settings.langEn' },
];

const TIMEZONES = [
  'America/New_York (ET)',
  'America/Chicago (CT)',
  'America/Denver (MT)',
  'America/Los_Angeles (PT)',
  'America/Anchorage (AKT)',
  'Pacific/Honolulu (HST)',
  'Asia/Shanghai (CST)',
  'Asia/Tokyo (JST)',
  'Europe/London (GMT)',
  'Europe/Paris (CET)',
];

export default function SettingsModal({ isOpen, onClose, navigateTo }: Props) {
  const { t } = useTranslation('common');
  const { logout } = useAuth();
  
  // Initialize with zh-CN as default
  const [language, setLanguage] = useState('zh-CN');
  const [isMFAModalOpen, setIsMFAModalOpen] = useState(false);

  // Listen to i18n language changes and update state
  useEffect(() => {
    // Immediately sync when modal opens
    const syncLanguage = () => {
      // i18next may return 'zh' or 'en', we need to map to 'zh-CN' or 'en-US'
      const currentLang = (i18n as any).language || 'zh';
      const fullLangCode = currentLang === 'en' ? 'en-US' : 'zh-CN';
      setLanguage(fullLangCode);
    };
    
    syncLanguage(); // Run immediately on mount
    
    // Also listen for language changes
    const handleLanguageChange = (newLng: string) => {
      // Map 'zh'/'en' to 'zh-CN'/'en-US'
      const fullLangCode = newLng === 'en' ? 'en-US' : 'zh-CN';
      setLanguage(fullLangCode);
    };
    
    // Attach listener to i18next
    (i18n as any).on('languageChanged', handleLanguageChange);
    
    return () => {
      (i18n as any).off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleLogout = () => {
    // Logout: clear jwt then full reload; App renders LoginPage when no jwt present
    localStorage.removeItem('jwt');
    window.location.replace('/');
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 56,
          right: 24,
          width: 300,
          maxHeight: 'calc(100vh - 70px)',
          overflow: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          zIndex: 9999,
          background: '#fff',
          border: '1px solid rgba(193, 198, 215, 0.3)',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(193, 198, 215, 0.3)',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>
              {t('settings.title')}
            </h2>
            <button
              className="btn-ghost"
              onClick={onClose}
              style={{ padding: 6, minWidth: 24, minHeight: 24 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {/* Language */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                {t('settings.langSection')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`btn-${language === lang.code ? 'primary' : 'secondary'}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      (i18n as any).changeLanguage(lang.code);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: 14,
                      justifyContent: 'center',
                      background: language === lang.code ? '#0058BC' : '#F8F9FA',
                      border: `1px solid ${language === lang.code ? '#0058BC' : 'rgba(193, 198, 215, 0.5)'}`,
                      borderRadius: '8px',
                      transition: 'all 120ms',
                    }}
                  >
                    <span style={{
                      fontWeight: language === lang.code ? 700 : 500,
                      color: language === lang.code ? '#fff' : '#181C23',
                      fontSize: 14,
                    }}>{t(lang.nameKey)}</span>
                    {language === lang.code && (
                      <Check size={14} style={{ marginLeft: 6, display: 'inline-block' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* MFA Button */}
            <button
              onClick={() => setIsMFAModalOpen(true)}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 16px',
                fontSize: 13.5,
                background: '#F8F9FA',
                color: '#181C23',
                border: '1px solid rgba(193, 198, 215, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 120ms',
              }}
            >
              <ShieldCheck size={16} />
              {t('settings.mfa') || 'Two-Factor Auth'}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '10px 16px',
                fontSize: 13.5,
                background: '#FEF2F2',
                color: '#BA1A1A',
                border: '1px solid rgba(186, 26, 26, 0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 120ms',
              }}
            >
              <LogOut size={16} />
              {t('settings.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* MFA Modal */}
      <MFAModal
        isOpen={isMFAModalOpen}
        onClose={() => setIsMFAModalOpen(false)}
      />
    </>
  );
}
