/**
 * Database Schema Index - OverInsur Platform
 *
 * Exports all Drizzle ORM table definitions.
 *
 * AUTHORITY:
 * - User/Role/Department/RefreshToken: auth-user-schema-ovwr.ts (V5)
 * - Permission/OperationLog: permission-schema-ovwr.ts (ovwr_auth_db)
 * - Carrier cooperation domain (overinsur_db): carrier-*-schema.ts (V1.0.10)
 */

// ─── i18n schemas ──────────────────────────────────────────────────

export {
  ovwrAuthI18nTranslation,
  ovwrAuthI18nVersion,
  ovwrAuthI18nReviewQueue,
  ovwrDictTerm,
} from './i18n-schema-ovwr';

// ─── User Management (auth_user table in ai_saas DB) ──────────────

export {
  ovwrAuthDepartment,
  ovwrAuthRole,
  ovwrAuthUser,
  ovwrAuthUserRole,
  ovwrAuthRefreshToken,
} from './auth-user-schema-ovwr';

// ─── Permission Management (ovwr_ prefixed tables in ovwr_auth_db) ─

export {
  ovwrAuthPermission,
  ovwrAuthUserRole as ovwrAuthUserRolePerm,
  ovwrAuthRolePermission,
  ovwrAuthPermissionTemplate,
  ovwrAuthOperationLog,
} from './permission-schema-ovwr';

// ─── User Preferences ──────────────────────────────────────────────

export {
  ovwrUserPreferences,
} from './user-preferences-ovwr';

// ─── Carrier Cooperation Domain (overinsur_db, V1.0.10) ───────────

export {
  carrierPartnership,
} from './carrier-partnership-schema';

export {
  carrierContract,
} from './carrier-contract-schema';

export {
  carrierContact,
} from './carrier-contact-schema';

export {
  carrierSettlementConfig,
} from './carrier-settlement-schema';

export {
  carrierRenewalTask,
} from './carrier-renewal-schema';

export {
  carrierProductAccessRequest,
} from './carrier-access-request-schema';

// ─── Backward-compatible aliases (i18n tables) ─────────────────────

export {
  ovwrAuthI18nTranslation as authI18nTranslation,
  ovwrAuthI18nVersion as authI18nVersion,
  ovwrAuthI18nReviewQueue as authI18nReviewQueue,
  ovwrDictTerm as dictTerm,
} from './i18n-schema-ovwr';

export {
  ovwrUserPreferences as userPreferences,
} from './user-preferences-ovwr';
