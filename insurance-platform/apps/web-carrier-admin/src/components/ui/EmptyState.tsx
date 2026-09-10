/**
 * EmptyState — Standardized empty / no-data state
 *
 * Use when a list, table, or section has no data to display.
 * Includes icon, title, description, and optional action button.
 */

import type { CSSProperties, ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon element (emoji, SVG, or Lucide icon) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Custom container style */
  style?: CSSProperties;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '56px 24px',
  textAlign: 'center',
};

const iconContainerStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'rgba(0,88,188,0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  marginBottom: 4,
};

const titleTextStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#414755',
  margin: 0,
};

const descStyle: CSSProperties = {
  fontSize: 13,
  color: '#717786',
  lineHeight: 1.5,
  maxWidth: 400,
  margin: 0,
};

const actionBtnStyle: CSSProperties = {
  marginTop: 8,
  padding: '8px 20px',
  fontSize: 13,
  fontWeight: 600,
  color: '#0058BC',
  background: 'rgba(0,88,188,0.09)',
  border: '1px solid rgba(0,88,188,0.2)',
  borderRadius: 8,
  cursor: 'pointer',
};

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <div style={{ ...containerStyle, ...style }}>
      <div style={iconContainerStyle}>{icon}</div>
      <h3 style={titleTextStyle}>{title}</h3>
      {description && <p style={descStyle}>{description}</p>}
      {actionLabel && onAction && (
        <button
          style={actionBtnStyle}
          onClick={onAction}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0,88,188,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(0,88,188,0.09)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
