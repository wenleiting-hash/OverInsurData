/**
 * Language Switcher Component - User-specific language preference
 * 
 * Features:
 * - User-level language switching (not global)
 * - API integration for persistence
 * - Fallback to localStorage on error
 * - Instant UI feedback
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { i18nApi } from '../lib/api-client';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('en-US');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize current language on mount
  useEffect(() => {
    if (i18n.language) {
      setCurrentLang(i18n.language);
    } else {
      setCurrentLang('en-US');
    }
  }, [i18n.language]);

  /**
   * Change language and persist to backend
   */
  const changeLanguage = async (lng: string) => {
    setIsLoading(true);
    try {
      // Update local i18n instance immediately
      await i18n.changeLanguage(lng);
      setCurrentLang(lng);

      // Persist to backend (user preferences)
      if (user?.userId) {
        try {
          await i18nApi.put('/users/preferences/current', {
            languageCode: lng,
          });
          console.log(`[LanguageSwitcher] Saved language preference: ${lng}`);
        } catch (error) {
          console.warn('[LanguageSwitcher] Failed to save to backend:', error);
          
          // Fallback: Save to localStorage
          localStorage.setItem('user_language', lng);
          console.log(`[LanguageSwitcher] Fallback to localStorage: ${lng}`);
        }
      }
    } catch (err) {
      console.error('[LanguageSwitcher] Language change failed:', err);
    } finally {
      setIsLoading(false);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative group inline-block">
      {/* Language Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
          ${isLoading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95'
          }`}
        aria-label="Change language"
        title="切换语言"
      >
        {currentLang === 'zh-CN' && '🇨🇳 '}
        {currentLang === 'en-US' && '🇺🇸 '}
        <span className="text-sm">
          {currentLang === 'zh-CN' ? '中文' : 'EN'}
        </span>
        
        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-32 bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden z-50 animate-fade-in-down">
            <div className="py-1">
              {/* English Option */}
              <button
                onClick={() => changeLanguage('en-US')}
                disabled={currentLang === 'en-US' || isLoading}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors
                  ${currentLang === 'en-US' 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span>English (US)</span>
                </span>
              </button>

              {/* Chinese Option */}
              <button
                onClick={() => changeLanguage('zh-CN')}
                disabled={currentLang === 'zh-CN' || isLoading}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors
                  ${currentLang === 'zh-CN' 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span>🇨🇳</span>
                  <span>简体中文</span>
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
