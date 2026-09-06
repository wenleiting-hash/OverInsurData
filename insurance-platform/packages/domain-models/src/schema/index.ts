/**
 * Database Schema Index - OverInsur (overinsur_db) Version
 * 
 * Exports all Drizzle ORM table definitions for clean OVERINSURDATA container
 * Database: overinsur_db within OVERINSURDATA container (port 5433)
 * Per V2.1 Design Document - No 'ovwr_' prefix for clarity
 */

// Import i18n_db schemas (clean names without prefix)
export { 
  ovwrAuthI18nTranslation, 
  ovwrAuthI18nVersion, 
  ovwrAuthI18nReviewQueue, 
  ovwrDictTerm 
} from './i18n-schema-ovwr';

// Import user management schemas (with ovwr_ prefix) - legacy
export { 
  ovwrAuthDepartment,
  ovwrAuthRole,
  ovwrAuthUser,
  ovwrAuthUserRole,
} from './auth-user-schema-ovwr';

// Import permission schemas (with ovwr_ prefix) - legacy
export { 
  ovwrAuthPermission,
  ovwrAuthRolePermission,
  ovwrAuthPermissionTemplate,
  ovwrAuthOperationLog,
  ovwrAuthRefreshToken,
} from './permission-schema-ovwr';

// Import user preferences schemas (with ovwr_ prefix)
export { 
  ovwrUserPreferences,
} from './user-preferences-ovwr';

// Import new V2.1 schemas (NO PREFIX - Clean design)
export { 
  authUser,
  authUserRole,
  authPermission,
  authRolePermission,
  authPermissionTemplate,
  authOperationLog,
} from './overinsur-auth';

// Re-export for backward compatibility only (i18n tables)
export { 
  ovwrAuthI18nTranslation as authI18nTranslation,
  ovwrAuthI18nVersion as authI18nVersion,
  ovwrAuthI18nReviewQueue as authI18nReviewQueue,
  ovwrDictTerm as dictTerm,
} from './i18n-schema-ovwr';

export { 
  ovwrUserPreferences as userPreferences,
} from './user-preferences-ovwr';
