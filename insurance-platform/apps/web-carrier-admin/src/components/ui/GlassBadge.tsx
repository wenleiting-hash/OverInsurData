/**
 * GlassBadge — Colored status badge with optional dot indicator
 *
 * Replaces the 6+ duplicate inline Badge definitions across views.
 * Supports custom colors, backgrounds, and an optional leading dot.
 */

import type { CSSProperties, ReactNode } from 'react';

interface GlassBadgeProps {
  /** Badge label text */
  label?: string;
  /** Alternative: pass children for richer content */
  children?: ReactNode;
  /** Text color (CSS value) */
  color?: string;
  /** Background color (CSS value) */
  bg?: string;
  /** Leading dot color (omit to hide dot) */
  dot?: string;
  /** Compact size */
  xs?: boolean;
  /** Extra class name */
  className?: string;
  /** Extra inline styles */
  style?: CSSProperties;
}

const MUTED = '#717786';
const MUTED_BG = 'rgba(193,198,215,0.18)';

export function GlassBadge({
  label,
  children,
  color = MUTED,
  bg = MUTED_BG,
  dot,
  xs,
  className,
  style,
}: GlassBadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: xs ? '1px 6px' : '2px 8px',
        borderRadius: 6,
        fontSize: xs ? 10 : 11,
        fontWeight: 700,
        color,
        background: bg,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: dot,
            flexShrink: 0,
          }}
        />
      )}
      {children ?? label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Pre-built semantic badges for common statuses
// ────────────────────────────────────────────────────────────────────────────

const SEMANTIC_COLORS = {
  success: { color: '#1A7A2E', bg: 'rgba(52,199,89,0.10)', dot: '#1A7A2E' },
  danger: { color: '#C0392B', bg: 'rgba(255,59,48,0.08)', dot: '#C0392B' },
  warning: { color: '#A05C00', bg: 'rgba(255,159,10,0.09)', dot: '#A05C00' },
  info: { color: '#0058BC', bg: 'rgba(0,88,188,0.09)', dot: '#0058BC' },
  neutral: { color: '#717786', bg: 'rgba(193,198,215,0.18)', dot: '#717786' },
  purple: { color: '#6B35C2', bg: 'rgba(123,63,202,0.09)', dot: '#6B35C2' },
} as const;

export type BadgeSemantic = keyof typeof SEMANTIC_COLORS;

/** Convenience wrapper: <StatusBadge type="success" label="Active" /> */
export function StatusBadge({
  type,
  label,
  xs,
}: {
  type: BadgeSemantic;
  label: string;
  xs?: boolean;
}) {
  const c = SEMANTIC_COLORS[type];
  return <GlassBadge label={label} color={c.color} bg={c.bg} dot={c.dot} xs={xs} />;
}

export default GlassBadge;
