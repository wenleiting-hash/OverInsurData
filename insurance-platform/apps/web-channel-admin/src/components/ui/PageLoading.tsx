/**
 * PageLoading — Standardized loading state
 *
 * Use when a page or section is fetching data.
 * Replaces the ad-hoc "Loading..." divs scattered across views.
 */

import type { CSSProperties } from 'react';

interface PageLoadingProps {
  /** Optional loading message */
  message?: string;
  /** Render as full-page (centered, min-height 100vh) or inline */
  fullPage?: boolean;
  /** Custom container style */
  style?: CSSProperties;
}

const containerBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
};

const fullPageStyle: CSSProperties = {
  ...containerBase,
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8f9ff 0%, #eef1ff 100%)',
};

const inlineStyle: CSSProperties = {
  ...containerBase,
  padding: '48px 24px',
};

const spinnerStyle: CSSProperties = {
  width: 32,
  height: 32,
  border: '3px solid rgba(0,88,188,0.15)',
  borderTopColor: '#0058BC',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const textStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: '#717786',
};

export function PageLoading({ message = 'Loading...', fullPage, style }: PageLoadingProps) {
  return (
    <div style={{ ...(fullPage ? fullPageStyle : inlineStyle), ...style }}>
      <div style={spinnerStyle} />
      <span style={textStyle}>{message}</span>
      {/* Inject keyframes once via a hidden style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default PageLoading;
