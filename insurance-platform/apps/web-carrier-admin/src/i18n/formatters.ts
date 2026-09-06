/**
 * Internationalization Helper Functions
 * Provides locale-aware formatting for dates, currencies, numbers, and percentages
 */

import i18n from '@/i18n/config';

/**
 * Format currency with locale-specific format
 * @param value - The numeric value to format
 * @param options - Optional configuration
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number, 
  options: { short?: boolean; locale?: string } = {}
): string {
  const { short = false, locale } = options;
  
  // If no locale provided, use current i18n language
  const currentLocale = locale || (i18n as any).language || 'zh-CN';
  
  if (short) {
    const B = Math.abs(value) / 1_000_000_000;
    return `${value < 0 ? '-' : ''}$${B.toFixed(1)}B`;
  }
  
  // Use proper locale formatting
  return new Intl.NumberFormat(currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage with locale-specific suffix
 * @param value - The decimal value (0.75) to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number, 
  decimals: number = 1
): string {
  const currentLocale = (i18n as any).language || 'zh-CN';
  const percent = (value * 100).toFixed(decimals);
  
  // Add space before % in English
  if (currentLocale === 'en-US') {
    return `${percent} %`;
  }
  return `${percent}%`;
}

/**
 * Format number with thousands separator
 * @param value - The number to format
 * @param locale - Optional locale override
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string, 
  locale?: string
): string {
  const currentLocale = locale || (i18n as any).language || 'zh-CN';
  
  return new Intl.NumberFormat(currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    maximumSignificantDigits: 12,
  }).format(Number(value));
}

/**
 * Format date with locale-specific format
 * @param date - Date object or string
 * @param formatType - 'short', 'long', 'time', or 'custom'
 * @param customFormat - Custom format pattern
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  formatType: 'short' | 'long' | 'time' | 'custom' = 'short',
  customFormat?: string
): string {
  const currentLocale = (i18n as any).language || 'zh-CN';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const commonOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  switch (formatType) {
    case 'short':
      // 2026/08/22 (Chinese) or Aug 22, 2026 (English)
      if (currentLocale === 'zh-CN') {
        return d.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      
    case 'long':
      // 2026 年 08 月 22 日 (Chinese) or August 22, 2026 (English)
      if (currentLocale === 'zh-CN') {
        return d.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      
    case 'time':
      // 14:30 (both locales)
      return d.toLocaleTimeString(currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
    case 'custom':
      if (!customFormat) {
        throw new Error('Custom format required');
      }
      // Support simple patterns: YYYY/MM/DD, HH:mm, etc.
      return customFormat
        .replace('YYYY', d.getFullYear().toString())
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(d.getDate()).padStart(2, '0'))
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'));
      
    default:
      return d.toLocaleDateString(currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US');
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "昨天")
 * @param date - Date object or string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const currentLocale = (i18n as any).language || 'zh-CN';
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - pastDate.getTime()) / 1000);
  
  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  if (seconds < 60) {
    return currentLocale === 'zh-CN' ? '刚刚' : 'Just now';
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      if (currentLocale === 'zh-CN') {
        return `${interval}${getChineseTimeUnit(unit)}前`;
      } else {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
  }
  
  return '';
}

/**
 * Get Chinese time unit translation
 */
function getChineseTimeUnit(unit: string): string {
  const units: { [key: string]: string } = {
    year: '年',
    month: '个月',
    week: '周',
    day: '天',
    hour: '小时',
    minute: '分钟',
  };
  return units[unit] || unit;
}

/**
 * Format byte size (KB, MB, GB)
 * @param bytes - Size in bytes
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted size string
 */
export function formatBytes(
  bytes: number, 
  decimals: number = 1
): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
