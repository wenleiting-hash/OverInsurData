/**
 * Unified Table Component System for Overseas Insurance Platform
 * 
 * SOLVES: Column width overflow, status/action column hiding, inconsistent table layouts
 * BASED ON: UI-V1.2 design spec with strict layout constraints
 */

import type { JSX } from 'react';

export const TABLE_CONFIG = {
  // Standard column widths (pixels)
  COLUMNS: {
    checkbox: 50,
    name: 220,        // Product/Company/Agent name with subtitle
    code: 100,
    lineOfBusiness: 130,
    type: 70,
    states: 60,       // Number of states or "全国" badge
    numeric: 90,      // Premium, policy count, percentages (right-aligned)
    date: 110,        // ISO date display (YYYY-MM-DD)
    status: 75,       // Badge-only status indicator
    actions: 85,      // MoreHorizontal icon button only
    priority: 50,     // Critical columns that should not shrink
  },

  // Badge-only status variants (NO orb prefix)
  STATUS_BADGES: {
    Active: 'badge-green',
    Paused: 'badge-yellow',
    Inactive: 'badge-gray',
    Pending: 'badge-purple',
    Approved: 'badge-green',
    Rejected: 'badge-red',
    Expired: 'badge-gray',
    UnderReview: 'badge-orange',
  } as const,

  // Action button configuration
  ACTIONS_BUTTONS: {
    viewDetails: true,
    edit: true,
    delete: false,  // Protected by confirmation modal
    toggleStatus: false,  // Moved to context menu
    moreMenu: true,       // Primary action method
  },

  // Table container constraints
  CONTAINER: {
    maxWidth: 1440,
    minWidth: 1024,     // Prevent horizontal scrolling on small screens
    tableLayout: 'auto' as const,  // Allow content-based sizing but prevent overflow
  },
} as const;

/**
 * Generate consistent TD styles for any data column
 */
export function tdStyle(
  width?: number,
  textAlign: 'left' | 'center' | 'right' = 'left',
  fontSize = 13,
  monoFont = false,
  fontWeight = 400,
  color = '#414755'
): React.CSSProperties {
  return {
    width,
    textAlign,
    fontFamily: monoFont ? "'JetBrains Mono', monospace" : undefined,
    fontSize,
    fontWeight,
    color,
    whiteSpace: 'nowrap',  // CRITICAL: Prevent text wrapping
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

/**
 * Generate badge-only status display (UI-V1.2 standard)
 * Returns: `<span className={`badge ${variant}`}> Label</span>`
 */
export function renderStatusBadge(status: string, t: Function, variantMap: Record<string, string> = TABLE_CONFIG.STATUS_BADGES): JSX.Element {
  const variant = variantMap[status] || TABLE_CONFIG.STATUS_BADGES.Inactive;
  const labelKey = `values.status${status}`;
  
  return (
    <span className="badge" style={{ fontSize: 11 }}>{t(labelKey)}</span>
  );
}

/**
 * Generate action menu button (single MoreHorizontal icon)
 */
export function renderActionMenu(t: Function, menuItems: Array<{label: string; onClick: () => void; danger?: boolean}>): JSX.Element {
  return (
    <button className="btn-ghost" title={t('actions.more')} style={{ padding: '8px', borderRadius: 8 }}>
      {/* Render dropdown here */}
    </button>
  );
}

/**
 * Base table styles injected globally
 */
export const TABLE_STYLES = `
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table thead th {
    white-space: nowrap;
    font-weight: 600;
    font-size: 13px;
    color: #181C23;
  }

  .data-table tbody td {
    white-space: nowrap;
    vertical-align: middle;
    font-size: 13px;
  }

  /* Ensure status and action columns NEVER shrink */
  .data-table th[data-col="status"],
  .data-table th[data-col="actions"],
  .data-table td[data-col="status"],
  .data-table td[data-col="actions"] {
    min-width: 70px;
    flex-shrink: 0;
  }

  /* Priority columns that must maintain width */
  .data-table th[data-col="priority"],
  .data-table td[data-col="priority"] {
    min-width: 50px;
    flex-shrink: 0;
  }
`;

/**
 * Common translation key patterns for table columns
 */
export const TABLE_KEYS = {
  productName: 'tables.productName',
  productCode: 'tables.productCode',
  insurerName: 'tables.insurerName',
  lineOfBusiness: 'tables.lineOfBusiness',
  agentName: 'tables.agentName',
  licenseNumber: 'tables.licenseNumber',
  type: 'tables.type',
  availableStates: 'tables.availableStates',
  premiumYTD: 'tables.premiumYTD',
  totalPremium: 'tables.premiumYTD',  // Alias for consistency
  policyCount: 'tables.policyCount',
  avgPremium: 'tables.avgPremium',
  lossRatio: 'tables.lossRatio',
  renewalRate: 'tables.renewalRate',
  commissionRate: 'tables.commissionRate',
  settlementStatus: 'tables.settlementStatus',
  appointmentStatus: 'tables.appointmentStatus',
  cooperationStatus: 'tables.cooperationStatus',
  effectiveDate: 'tables.effectiveDate',
  lastUpdated: 'tables.lastUpdated',
  actions: 'tables.actions',
};

// Expose for global usage
if (typeof window !== 'undefined') {
  (window as any).TableUtils = {
    TABLE_CONFIG,
    tdStyle,
    renderStatusBadge,
    TABLE_KEYS,
  };
}
