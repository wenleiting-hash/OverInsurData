import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RTL Direction Manager Hook
 * 
 * Automatically handles RTL direction switching based on current language.
 * This hook should be used at the app root level or in a layout component.
 */
export function useRTLManager() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // RTL language codes
    const rtlLanguages = ['ar-SA', 'he-IL'];
    
    // Function to set document direction
    const setDirection = (lng: string) => {
      const html = document.documentElement;
      const isRTL = rtlLanguages.includes(lng);
      
      // Set direction attribute
      html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      html.setAttribute('lang', lng);
      
      // Update HTML lang attribute for SEO
      const htmlElement = document.querySelector('html');
      if (htmlElement) {
        htmlElement.setAttribute('lang', lng);
      }
      
      console.log(`[RTL Manager] Direction set to: ${isRTL ? 'RTL' : 'LTR'} (${lng})`);
    };

    // Set initial direction
    setDirection(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', setDirection);

    // Cleanup - remove the listener
    return () => {
      i18n.off('languageChanged', setDirection);
    };
  }, [i18n]);
}

export default useRTLManager;
