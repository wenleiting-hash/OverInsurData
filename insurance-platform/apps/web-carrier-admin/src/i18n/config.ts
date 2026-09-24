import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUSCommon from './locales/en-US/common.json';
import zhCNCommon from './locales/zh-CN/common.json';
import enUSDashboard from './locales/en-US/dashboard.json';
import zhCNDashboard from './locales/zh-CN/dashboard.json';
import enUSInsurer from './locales/en-US/insurer.json';
import zhCNInsurer from './locales/zh-CN/insurer.json';
import enUSInsurerForm from './locales/en-US/insurer-form.json';
import zhCNInsurerForm from './locales/zh-CN/insurer-form.json';
import enUSProduct from './locales/en-US/product.json';
import zhCNProduct from './locales/zh-CN/product.json';
import enUSChannel from './locales/en-US/channel.json';
import zhCNChannel from './locales/zh-CN/channel.json';
import enUSPermission from './locales/en-US/permission.json';
import zhCNPermission from './locales/zh-CN/permission.json';
import enUSPermissionExtra from './locales/en-US/permission-extra.json';
import zhCNPermissionExtra from './locales/zh-CN/permission-extra.json';
import enUSAppointment from './locales/en-US/appointment.json';
import zhCNAppointment from './locales/zh-CN/appointment.json';
import enUSFinance from './locales/en-US/finance.json';
import zhCNFinance from './locales/zh-CN/finance.json';
import enUSCooperation from './locales/en-US/cooperation.json';
import zhCNCooperation from './locales/zh-CN/cooperation.json';
import enUSAnalytics from './locales/en-US/analytics.json';
import zhCNAnalytics from './locales/zh-CN/analytics.json';
import enUSLogin from './locales/en-US/login.json';
import zhCNLogin from './locales/zh-CN/login.json';
import enUSMfa from './locales/en-US/mfa.json';
import zhCNMfa from './locales/zh-CN/mfa.json';
import enUSAudit from './locales/en-US/audit.json';
import zhCNAudit from './locales/zh-CN/audit.json';
import enUSExport from './locales/en-US/export.json';
import zhCNExport from './locales/zh-CN/export.json';
import enUSDepartment from './locales/en-US/department.json';
import zhCNDepartment from './locales/zh-CN/department.json';
import enUSDict from './locales/en-US/dict.json';
import zhCNDict from './locales/zh-CN/dict.json';

const resources = {
  'en-US': {
    common: enUSCommon,
    dashboard: enUSDashboard,
    insurer: enUSInsurer,
    'insurer-form': enUSInsurerForm,
    product: enUSProduct,
    channel: enUSChannel,
    permission: {
      ...enUSPermission,
      ...enUSPermissionExtra
    },
    appointment: enUSAppointment,
    finance: enUSFinance,
    cooperation: enUSCooperation,
    analytics: enUSAnalytics,
    login: enUSLogin,
    mfa: enUSMfa,
    audit: enUSAudit,
    export: enUSExport,
    department: enUSDepartment,
    dict: enUSDict,
  },
  'zh-CN': {
    common: zhCNCommon,
    dashboard: zhCNDashboard,
    insurer: zhCNInsurer,
    'insurer-form': zhCNInsurerForm,
    product: zhCNProduct,
    channel: zhCNChannel,
    permission: {
      ...zhCNPermission,
      ...zhCNPermissionExtra
    },
    appointment: zhCNAppointment,
    finance: zhCNFinance,
    cooperation: zhCNCooperation,
    analytics: zhCNAnalytics,
    login: zhCNLogin,
    mfa: zhCNMfa,
    audit: zhCNAudit,
    export: zhCNExport,
    department: zhCNDepartment,
    dict: zhCNDict,
  },
};

// Helper function to get saved language preference
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

// Initialize i18n with resources configuration
// @ts-expect-error - i18next instance extension via plugin types
i18n.use(initReactI18next).init({
  lng: getSavedLanguage(), // Use saved language or auto-detect
  resources,
  fallbackLng: 'en-US',
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
});

export default i18n;
