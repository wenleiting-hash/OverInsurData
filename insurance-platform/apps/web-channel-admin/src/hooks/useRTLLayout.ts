/**
 * RTL (Right-to-Left) Layout Handler
 * 
 * Automatically applies RTL layout when switching to Arabic/Hebrew languages
 */

import { useEffect, useState } from 'react';

export function useRTLLayout(isRTL: boolean) {
  useEffect(() => {
    // Update document direction and lang attribute
    const html = document.documentElement;
    
    if (isRTL) {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', getDocumentLang());
      
      // Add RTL-specific CSS rules
      addRTLCSSRules();
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en-US');
      
      // Remove RTL-specific CSS rules
      removeRTLCSSRules();
    }
  }, [isRTL]);
}

function getDocumentLang(): string {
  // Determine the correct language code for RTL languages
  return navigator.language.startsWith('ar') ? 'ar-SA' : 'he-IL';
}

function addRTLCSSRules() {
  // Prevent duplicate rule injection
  if (document.getElementById('rtl-dynamic-rules')) return;

  const style = document.createElement('style');
  style.id = 'rtl-dynamic-rules';
  
  style.textContent = `
    /* RTL Text Alignment */
    [dir="rtl"] .text-left { text-align: right; }
    [dir="rtl"] .text-right { text-align: left; }
    [dir="rtl"] .text-center { text-align: center; }

    /* RTL Margins & Padding */
    [dir="rtl"] .ml-auto { margin-left: auto; margin-right: 0; }
    [dir="rtl"] .mr-auto { margin-right: auto; margin-left: 0; }
    [dir="rtl"] .pl-4 { padding-left: 0; padding-right: 1rem; }
    [dir="rtl"] .pr-4 { padding-right: 0; padding-left: 1rem; }

    /* RTL Borders */
    [dir="rtl"] .border-l-0 { border-left-width: 0; border-right-width: 1px; }
    [dir="rtl"] .border-r-0 { border-right-width: 0; border-left-width: 1px; }

    /* RTL Icons */
    [dir="rtl"] .rotate-flip { transform: scaleX(-1); }

    /* RTL Spacing */
    [dir="rtl"] .gap-2 { gap: 0.5rem; }
    [dir="rtl"] .gap-4 { gap: 1rem; }

    /* RTL Transitions */
    [dir="rtl"] * { transition: margin 0.3s ease, padding 0.3s ease; }
  `;

  document.head.appendChild(style);
}

function removeRTLCSSRules() {
  const rtlStyles = document.getElementById('rtl-dynamic-rules');
  if (rtlStyles) {
    document.head.removeChild(rtlStyles);
  }
}

/**
 * RTL Language Detection Hook
 * Returns true if current language is RTL
 */
export function useRTLDetection(): boolean {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('user_language');
    const browserLang = window.navigator?.language || '';
    const currentLang = savedLang || browserLang || 'en-US';
    
    const rtlLanguages = ['ar', 'ar-SA', 'ar-EG', 'he', 'he-IL', 'fa', 'fa-IR'];
    const isCurrentRTL = rtlLanguages.some(lang => currentLang.startsWith(lang));
    
    setIsRTL(isCurrentRTL);
  }, []);

  return isRTL;
}

// Default export
export default useRTLLayout;
