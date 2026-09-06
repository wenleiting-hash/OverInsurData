import { useState, useEffect } from 'react';
import { Search, Bell, ChevronRight, User as UserIcon, LogOut, Settings, Cog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { useAuth } from '../contexts/AuthContext';
import { VIEW_LABELS } from '../navigation/viewMeta';
import type { ViewId } from '../navigation/viewMeta';

interface Props {
  currentView: ViewId | string;
  navigateTo: (view: ViewId) => void;
}

export default function TopBar({ currentView, navigateTo }: Props) {
  const { t } = useTranslation('common');
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (isProfileOpen && typeof document !== 'undefined') {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.profile-dropdown-container')) {
          setIsProfileOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProfileOpen]);

  const info = VIEW_LABELS[currentView as string] ?? { crumbs: [], title: currentView as string };
  const adminName = t('common.admin');

  return (
    <>
      <header
        className="glass-strong flex items-center justify-between shrink-0"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: '0.5px solid rgba(193,198,215,0.5)',
          borderRadius: 0,
          zIndex: 10,
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5" style={{ fontSize: 13.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <button
            className="btn-ghost"
            style={{ padding: '3px 6px', fontSize: 13.5, color: '#717786' }}
            onClick={() => navigateTo('dashboard')}
          >
            InsureOS
          </button>
          {info.crumbs.map(c => (
            <span key={c} className="flex items-center gap-1.5">
              <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
              <span style={{ color: '#717786' }}>{t(c)}</span>
            </span>
          ))}
          {info.title && (
            <span className="flex items-center gap-1.5">
              <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
              <span style={{ color: '#181C23', fontWeight: 600 }}>{t(info.title)}</span>
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5" style={{ flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          {/* Search */}
          <div className="relative" style={{ flex: '0 1 320px', minWidth: 0, maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input
              type="text"
              placeholder={t('common.search')}
              className="input-glass"
              style={{ paddingLeft: 30, width: '100%', minWidth: 0, fontSize: 13 }}
            />
          </div>

          {/* Notification bell */}
          <button className="btn-ghost relative" style={{ padding: 8 }}>
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#FF3B30',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 5px rgba(255,59,48,0.5)',
                border: '1.5px solid rgba(249,249,255,0.9)',
              }}
            >
              3
            </span>
          </button>

          {/* User dropdown */}
          <div className="profile-dropdown-container relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileOpen(v => !v);
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors profile-trigger"
              style={{ 
                cursor: 'pointer',
                background: '#F8F9FA',
                borderRadius: '12px'
              }}
            >
              {/* 齿轮图标 + 文字 */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={16} color="#6B7280" />
              </div>
              <div style={{ textAlign: 'left', marginLeft: 8, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1D2939', lineHeight: 1.15 }}>{adminName}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.2 }}>Platform Admin</div>
              </div>
              <Cog size={16} color="#6B7280" />
            </button>

            {isProfileOpen && (
              <ProfileDropdown
                isProfileOpen={isProfileOpen}
                setProfileOpen={setIsProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                navigateTo={navigateTo}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}

// Profile Dropdown Component
function ProfileDropdown({ isProfileOpen, setProfileOpen, onClose, navigateTo }: {
  isProfileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  navigateTo: (view: ViewId) => void;
}) {
  const { t } = useTranslation('common');
  const { logout } = useAuth();

  // Sync with i18n language
  const currentLang = (i18n as any).language || 'zh-CN';
  const fullLangCode = currentLang === 'en' ? 'en-US' : 'zh-CN';

  const handleLanguageChange = (langCode: string) => {
    setProfileOpen(false);
    (i18n as any).changeLanguage(langCode);
    localStorage.setItem('user_language', langCode);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('jwt');
    window.location.replace('/');
  };

  return (
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
            <ChevronRight size={18} style={{ transform: 'rotate(90deg)' }} />
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
              {[{ code: 'zh-CN', nameKey: 'settings.langZh' }, { code: 'en-US', nameKey: 'settings.langEn' }].map(lang => (
                <button
                  key={lang.code}
                  className={`btn-${fullLangCode === lang.code ? 'primary' : 'secondary'}`}
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: 14,
                    justifyContent: 'center',
                    background: fullLangCode === lang.code ? '#0058BC' : '#F8F9FA',
                    border: `1px solid ${fullLangCode === lang.code ? '#0058BC' : 'rgba(193, 198, 215, 0.5)'}`,
                    borderRadius: '8px',
                    transition: 'all 120ms',
                    color: fullLangCode === lang.code ? '#fff' : '#181C23',
                    fontWeight: fullLangCode === lang.code ? 700 : 500,
                  }}
                >
                  {t(lang.nameKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: 8,
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
  );
}
