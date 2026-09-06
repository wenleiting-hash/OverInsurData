/**
 * Enhanced Language Switcher Component with Smooth Transitions
 * 
 * Features:
 * - Smooth transition animations on language change
 * - Loading state indicator
 * - Visual feedback for language changes
 * - Fallback to localStorage on API failure
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function EnhancedLanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLangRef = useRef<string>(i18n.language);
  
  // Initialize current language on mount
  useEffect(() => {
    if (i18n.language) {
      setCurrentLang(i18n.language);
    } else {
      setCurrentLang('en-US');
    }
    
    // Update ref when language changes
    prevLangRef.current = i18n.language;
  }, [i18n.language]);

  /**
   * Change language with smooth animation
   */
  const changeLanguage = async (lng: string) => {
    if (isLoading || isTransitioning || lng === currentLang) return;
    
    setIsLoading(true);
    setIsTransitioning(true);
    
    try {
      // 1. Show transition animation first
      await i18n.changeLanguage(lng);
      
      // 2. Update UI immediately
      setCurrentLang(lng);
      
      // 3. Persist to backend asynchronously
      if (user?.userId) {
        try {
          // Use simple fetch for user preferences API
          await fetch('http://localhost:8080/api/users/preferences/current', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer AT-${user.userId}-${Date.now()}`,
            },
            body: JSON.stringify({ languageCode: lng }),
          }).then(res => res.json());
          console.log(`[EnhancedLanguageSwitcher] Saved preference: ${lng}`);
        } catch (error) {
          console.warn('[EnhancedLanguageSwitcher] Backend save failed:', error);
          
          // Fallback to localStorage
          localStorage.setItem('user_language', lng);
          console.log(`[EnhancedLanguageSwitcher] Fallback to localStorage`);
        }
      }
      
      // 4. Remove transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setIsLoading(false);
        setIsDropdownOpen(false);
      }, 300); // Match CSS animation duration
      
    } catch (err) {
      console.error('[EnhancedLanguageSwitcher] Failed to change language:', err);
      setIsLoading(false);
      setIsTransitioning(false);
      setIsDropdownOpen(false);
    }
  };

  // Detect direction for RTL languages in the future
  const isRTL = ['ar-SA', 'he-IL'].includes(currentLang);

  return (
    <div className="relative group" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Language Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading || isTransitioning}
        className={`
          px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
          relative overflow-hidden
          ${isLoading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 active:scale-95'
          }
          ${isTransitioning ? 'cursor-wait' : 'cursor-pointer'}
        `}
        aria-label="Change language"
        title="切换语言"
      >
        {/* Background Animation Effect */}
        {isTransitioning && (
          <span className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 animate-pulse" />
        )}
        
        {/* Flag and Label */}
        <span className="flex items-center gap-1.5 relative z-10">
          {currentLang === 'zh-CN' && <span className="text-lg">🇨🇳</span>}
          {currentLang === 'en-US' && <span className="text-lg">🇺🇸</span>}
          <span className="text-sm font-semibold relative z-10">
            {currentLang === 'zh-CN' ? '中文' : 'English'}
          </span>
        </span>
        
        {/* Loading Spinner */}
        {isLoading && (
          <svg className="w-4 h-4 ml-1 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        
        {/* Dropdown Arrow with Rotation */}
        {!isLoading && (
          <svg
            className={`w-4 h-4 transition-transform duration-200 relative z-10 ${
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
              d="M19 9l-7 7-7 7"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu with Slide-in Animation */}
      {isDropdownOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 transition-opacity duration-200"
            style={{ backgroundColor: 'rgba(0,0,0,0)' }}
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Panel with Stagger Animation */}
          <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden z-50 animate-slide-down">
            {/* Header */}
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600">Select Language</p>
            </div>
            
            {/* Language Options */}
            <div className="py-1">
              {/* English Option */}
              <button
                onClick={() => changeLanguage('en-US')}
                disabled={currentLang === 'en-US' || isLoading || isTransitioning}
                className={`
                  block w-full px-4 py-3 text-left text-sm transition-all duration-200
                  flex items-center justify-between
                  ${currentLang === 'en-US' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${isLoading || isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇺🇸</span>
                  <span>English (US)</span>
                </span>
                
                {currentLang === 'en-US' && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </button>

              {/* Chinese Option */}
              <button
                onClick={() => changeLanguage('zh-CN')}
                disabled={currentLang === 'zh-CN' || isLoading || isTransitioning}
                className={`
                  block w-full px-4 py-3 text-left text-sm transition-all duration-200
                  flex items-center justify-between
                  ${currentLang === 'zh-CN' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${isLoading || isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇨🇳</span>
                  <span>简体中文</span>
                </span>
                
                {currentLang === 'zh-CN' && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </button>
            </div>
            
            {/* Footer Tip */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic">
                Changes apply instantly across the app
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* CSS Animations (injected dynamically) */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Export default fallback
export default EnhancedLanguageSwitcher;
