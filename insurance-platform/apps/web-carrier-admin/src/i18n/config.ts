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
import enUSAppointment from './locales/en-US/appointment.json';
import zhCNAppointment from './locales/zh-CN/appointment.json';

const resources = {
  'en-US': { 
    common: enUSCommon,
    dashboard: enUSDashboard,
    insurer: enUSInsurer,
    'insurer-form': enUSInsurerForm,
    product: enUSProduct,
    channel: enUSChannel,
    permission: enUSPermission,
    appointment: enUSAppointment,
  },
  'zh-CN': { 
    common: zhCNCommon,
    dashboard: zhCNDashboard,
    insurer: zhCNInsurer,
    'insurer-form': zhCNInsurerForm,
    product: zhCNProduct,
    channel: zhCNChannel,
    permission: zhCNPermission,
    appointment: zhCNAppointment,
  },
};

// Initialize i18n with resources configuration
// @ts-expect-error - i18next instance extension via plugin types
i18n.use(initReactI18next).init({

  resources,
  fallbackLng: 'zh-CN',
  debug: import.meta.env?.DEV ?? false,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  defaultNS: 'common',
  react: {
    useSuspense: false,
  },
});

export default i18n;
