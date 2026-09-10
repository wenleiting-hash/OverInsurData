/**
 * Domain Models Package Entry Point
 *
 * @module @overinsur/domain-models
 */

// Export schema definitions (table objects)
export * from './schema';

// Type aliases for convenience using typeof
import {
  ovwrAuthI18nTranslation,
  ovwrAuthI18nVersion,
  ovwrAuthI18nReviewQueue,
  ovwrDictTerm,
  ovwrAuthPermission,
  ovwrAuthRolePermission,
  ovwrAuthPermissionTemplate,
  ovwrAuthOperationLog,
} from './schema';

// Table type exports
export type OvwrAuthI18nTranslation = typeof ovwrAuthI18nTranslation;
export type OvwrAuthI18nVersion = typeof ovwrAuthI18nVersion;
export type OvwrAuthI18nReviewQueue = typeof ovwrAuthI18nReviewQueue;
export type OvwrDictTerm = typeof ovwrDictTerm;
export type OvwrAuthPermission = typeof ovwrAuthPermission;
export type OvwrAuthRolePermission = typeof ovwrAuthRolePermission;
export type OvwrAuthPermissionTemplate = typeof ovwrAuthPermissionTemplate;
export type OvwrAuthOperationLog = typeof ovwrAuthOperationLog;
