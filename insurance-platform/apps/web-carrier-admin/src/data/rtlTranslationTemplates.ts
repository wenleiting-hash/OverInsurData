/**
 * RTL Language Translation Templates
 * 
 * Pre-defined translation templates for RTL languages:
 * - Arabic (ar-SA, ar-EG)
 * - Hebrew (he-IL)
 * - Persian/Farsi (fa-IR)
 */

// Arabic Translation Template
export const arabicTranslationTemplate = {
  // Common phrases that need special RTL handling
  common: {
    rtl_direction: 'rtl',
    rtl_font_family: '"Traditional Arabic", Arial',
    rtl_alignments: {
      left: 'يمين',
      right: 'يسار',
      center: 'وسط'
    }
  },
  
  // Insurance-specific terminology (validated against glossary)
  insurance: {
    carrier: 'شركة التأمين', // Carrier
    agent: 'الوكيل', // Agent
    premium: 'القسط', // Premium
    commission: 'عمولة', // Commission
    policy: 'بوليصة التأمين', // Policy
    claim: 'مطالبة', // Claim
    underwriting: 'التحتيبي', // Underwriting
    endorsement: 'تصحيح البوليصة', // Endorsement
    renewal: 'تجديد', // Renewal
    retention: 'الاحتفاظ', // Retention
    reinsurance: 'إعادة التأمين', // Reinsurance
    override: 'المناولة', // Override
    chargeback: 'الإلغاء والرد', // Chargeback
    appointment: 'التعيين الرسمي', // Appointment
    admitted_carrier: 'شركة معتمدة', // Admitted Carrier
    non_admitted_carrier: 'شركة غير معتمدة', // Non-Admitted Carrier
    surplus_lines: 'خطوط الفائض', // Surplus Lines
    naic_code: 'رمز NAIC',
    npn: 'NPN',
    e_o_insurance: 'تأمين المسؤولية المهنية', // E&O Insurance
  },
  
  // UI elements with RTL-aware labels
  ui: {
    date_format: 'dd/mm/yyyy',
    number_format: '1,234.56',
    currency_symbol_position: 'before', // $100 vs 100$
    separator: ',',
    decimal_separator: '.',
  }
};

// Hebrew Translation Template
export const hebrewTranslationTemplate = {
  common: {
    rtl_direction: 'rtl',
    rtl_font_family: '"Arial", sans-serif',
    rtl_alignments: {
      left: 'ימין',
      right: 'שמאל',
      center: 'מרכז'
    }
  },
  
  insurance: {
    carrier: 'חברת ביטוח', // Carrier
    agent: 'סוכן', // Agent
    broker: 'בрокר', // Broker
    premium: 'פרמיה', // Premium
    commission: 'עמלה', // Commission
    policy: 'פוליסה', // Policy
    claim: 'תביעה', // Claim
    underwriting: 'כתיבת ביטוח', // Underwriting
    endorsement: 'נספח', // Endorsement
    renewal: 'חידוש', // Renewal
    retention: 'החזקה', // Retention
    reinsurance: 'ביטוח חוזר', // Reinsurance
    override: 'עיגול', // Override
    chargeback: 'חיוב חוזר', // Chargeback
    appointment: 'מינוי רשמי', // Appointment
    admitted_carrier: 'חברה מאושרת', // Admitted Carrier
    non_admitted_carrier: 'חברה לא מאושרת', // Non-Admitted Carrier
    surplus_lines: 'קווים עודפים', // Surplus Lines
    naic_code: 'קוד NAIC',
    npn: 'NPN',
    e_o_insurance: 'ביטוח אחריות מקצועית', // E&O Insurance
  },
  
  ui: {
    date_format: 'YYYY/MM/dd',
    number_format: '1,234.56',
    currency_symbol_position: 'after', // 100$
    separator: ',',
    decimal_separator: '.',
  }
};

// Persian Translation Template (Optional Future Support)
export const persianTranslationTemplate = {
  common: {
    rtl_direction: 'rtl',
    rtl_font_family: '"Tahoma", Arial',
    rtl_alignments: {
      left: 'راست',
      right: 'چپ',
      center: 'مرکز'
    }
  },
  
  insurance: {
    carrier: 'شرکت بیمه', // Carrier
    agent: 'کارگزار', // Agent
    premium: 'حق بیمه', // Premium
    commission: 'کمیسیون', // Commission
    policy: 'نامه بیمه', // Policy
    claim: 'ادعای بیمه', // Claim
    underwriting: 'پذیرش ریسک', // Underwriting
    endorsement: 'الحاقیه', // Endorsement
    renewal: 'تمدید', // Renewal
  },
  
  ui: {
    date_format: 'yyyy/mm/dd',
    number_format: '۱٬۲۳۴٫۵۶', // Persian numerals
    currency_symbol_position: 'after',
    separator: '٫',
    decimal_separator: '،',
  }
};

// Helper function to get correct RTL language code
export function getRTLLanguageCode(lang: string): string {
  const rtlMapping: Record<string, string> = {
    'ar': 'ar-SA',
    'ar-SA': 'ar-SA',
    'ar-EG': 'ar-EG',
    'he': 'he-IL',
    'he-IL': 'he-IL',
    'fa': 'fa-IR',
    'fa-IR': 'fa-IR',
  };
  
  return rtlMapping[lang] || lang;
}

// Helper function to check if a language is RTL
export function isRTL(language: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.some(rtlLang => language.startsWith(rtlLang));
}

// Export default for consistent import
export default {
  arabic: arabicTranslationTemplate,
  hebrew: hebrewTranslationTemplate,
  persian: persianTranslationTemplate,
  getRTLLanguageCode,
  isRTL,
};
