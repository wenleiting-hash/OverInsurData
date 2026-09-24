/**
 * Lazy i18n Resource Loader
 * 
 * Features:
 * - Dynamic import of locale files on demand
 * - Bundle size optimization by code splitting
 * - Prefetch strategy for better UX
 * - Cache management for repeated loads
 */

import i18n from 'i18next';

// Cache for loaded namespaces per language
const localeCache = new Map<string, Map<string, boolean>>();

/**
 * Define available namespaces for each language
 */
const NAMESPACES = {
  common: 'common',
  dashboard: 'dashboard',
  insurer: 'insurer',
  'insurer-form': 'insurer-form',
  product: 'product',
  channel: 'channel',
  permission: 'permission',
  department: 'department',
  appointment: 'appointment',
  finance: 'finance',
  cooperation: 'cooperation',
  analytics: 'analytics',
  login: 'login',
  export: 'export',
} as const;

type LocaleNamespace = keyof typeof NAMESPACES;

/**
 * Load a single namespace for a specific language
 */
async function loadNamespace(
  lng: string,
  ns: LocaleNamespace
): Promise<boolean> {
  // Check cache first
  if (!localeCache.has(lng)) {
    localeCache.set(lng, new Map());
  }
  
  const langCache = localeCache.get(lng)!;
  if (langCache.has(ns)) {
    return true; // Already loaded
  }

  try {
    // Dynamic import with webpack chunk name
    const localeModule = await import(`./locales/${lng}/${NAMESPACES[ns]}.json`);
    
    // Add to i18n instance (type-assert for dynamic method)
    (i18n as any).addResourceBundle(lng, ns, localeModule.default);
    
    // Mark as loaded in cache
    langCache.set(ns, true);
    
    console.log(`[LazyLoader] Loaded ${ns} for ${lng}`);
    return true;
  } catch (error) {
    console.error(`[LazyLoader] Failed to load ${ns} for ${lng}:`, error);
    throw error;
  }
}

/**
 * Load multiple namespaces for a language
 */
export async function loadLocales(
  lng: string,
  namespaces: LocaleNamespace[]
): Promise<void> {
  const promises = namespaces.map(ns => loadNamespace(lng, ns));
  await Promise.all(promises);
}

/**
 * Initialize with default namespace and preload others
 */
export async function initLazyI18n(
  initialLng: string,
  fallbackLng: string = 'en-US'
): Promise<void> {
  // Set initial language (type-assert for dynamic method)
  await (i18n as any).changeLanguage(initialLng);
  
  // Always load common namespace first (used everywhere)
  await loadNamespace(initialLng, 'common');
  
  // Preload frequently used namespaces for current language
  const primaryNamespaces: LocaleNamespace[] = [
    'dashboard',
    'insurer',
    'product',
    'channel',
    'permission',
    'department',
  ];
  
  await loadLocales(initialLng, primaryNamespaces);
  
  // Prefetch fallback language
  await loadNamespace(fallbackLng, 'common');
  
  console.log(`[LazyLoader] Initialized i18n for ${initialLng}`);
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchLocales(
  lng: string,
  namespaces: LocaleNamespace[]
): void {
  // Use network priority hint (if supported)
  if ('prefetch' in HTMLLinkElement.prototype) {
    // This would require server-side configuration
    // For now, just trigger the imports
    loadLocales(lng, namespaces).then(() => {
      console.log(`[LazyLoader] Prefetched locales for ${lng}`);
    });
  }
}

/**
 * Clear cache for re-initialization
 */
export function clearLocaleCache(): void {
  localeCache.clear();
  console.log('[LazyLoader] Cleared locale cache');
}

/**
 * Get loaded namespaces count
 */
export function getLoadStats(lng?: string): Record<string, number> {
  const stats: Record<string, number> = {};
  
  if (lng) {
    const count = localeCache.get(lng)?.size || 0;
    stats[lng] = count;
  } else {
    for (const [lang, nsMap] of localeCache.entries()) {
      stats[lang] = nsMap.size;
    }
  }
  
  return stats;
}
