/**
 * GlassCard — Glassmorphism card primitive
 *
 * Shared across views that use the frosted-glass visual style.
 * Replaces the per-view inline-styled GlassCard definitions.
 */

import type { CSSProperties, ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  padding?: number | string;
  /** stronger blur / saturation for hero sections */
  elevated?: boolean;
}

const base: CSSProperties = {
  background: 'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(24px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
  border: '0.5px solid rgba(193,198,215,0.38)',
  borderRadius: 14,
  boxShadow: '0 2px 12px rgba(0,58,152,0.05), 0 1px 2px rgba(0,0,0,0.03)',
};

const elevated: CSSProperties = {
  ...base,
  background: 'rgba(255,255,255,0.82)',
  border: '0.5px solid rgba(193,198,215,0.55)',
  boxShadow: '0 4px 20px rgba(0,58,152,0.08), 0 2px 4px rgba(0,0,0,0.04)',
};

export function GlassCard({ children, style, className, padding, elevated: isElevated }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        ...(isElevated ? elevated : base),
        ...(padding !== undefined ? { padding } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
