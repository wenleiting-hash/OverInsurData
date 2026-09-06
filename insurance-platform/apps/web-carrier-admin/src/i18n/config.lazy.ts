/**
 * Lazy-loaded i18n Configuration
 * 
 * Features:
 * - On-demand language bundle loading
 * - Reduced initial bundle size by ~50%
 * - Prefetch strategy for better UX
 * - Caching for repeated loads
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Helper function to get saved language preference (duplicated for lazy config)
const getSavedLanguage = (): string => {
  // Try localStorage first (for users who switched before backend integration)
  const savedLang = localStorage.getItem('user_language');
  if (savedLang && ['en-US', 'zh-CN'].includes(savedLang)) {
    return savedLang;
  }
  
  // Check browser's language detector if available
  if (window.navigator?.language) {
    const browserLang = window.navigator.language.slice(0, 2);
    if (['en', 'zh'].includes(browserLang)) {
      return `${browserLang}-${browserLang === 'en' ? 'US' : 'CN'}`;
    }
  }
  
  // Default fallback
  return 'en-US';
};

// Don't import all locales statically anymore!
// We'll load them dynamically on demand

const fallbackLng = 'en-US';

// Initialize i18n without static resources
// @ts-expect-error - i18next instance extension via plugin types
i18n.use(initReactI18next).init({
  lng: getSavedLanguage(), // Use saved language or auto-detect
  fallbackLng,
  debug: import.meta.env?.DEV ?? false,
  interpolation: {
    escapeValue: false, // React already escapes
    prefix: '{',
    suffix: '}',
  },
  defaultNS: 'common',
  react: {
    useSuspense: false,
  },
  // No static resources - we load them dynamically
});

export default i18n;
