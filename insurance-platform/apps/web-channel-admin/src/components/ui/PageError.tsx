/**
 * PageError — Standardized error state
 *
 * Display when an API call fails or a page encounters an error.
 * Includes retry button and optional error details.
 */

import type { CSSProperties } from 'react';

interface PageErrorProps {
  /** Error title */
  title?: string;
  /** Error description / message */
  message?: string;
  /** Callback for the retry button (omit to hide button) */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Render as full-page or inline */
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
  textAlign: 'center',
};

const fullPageStyle: CSSProperties = {
  ...containerBase,
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #fff8f8 0%, #fff0f0 100%)',
  padding: 40,
};

const inlineStyle: CSSProperties = {
  ...containerBase,
  padding: '48px 24px',
};

const iconStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'rgba(255,59,48,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
};

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#181C23',
  margin: 0,
};

const messageStyle: CSSProperties = {
  fontSize: 14,
  color: '#717786',
  lineHeight: 1.6,
  maxWidth: 480,
  margin: 0,
};

const buttonStyle: CSSProperties = {
  marginTop: 8,
  padding: '8px 24px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: '#C0392B',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

export function PageError({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  fullPage,
  style,
}: PageErrorProps) {
  return (
    <div style={{ ...(fullPage ? fullPageStyle : inlineStyle), ...style }}>
      <div style={iconStyle}>⚠</div>
      <h3 style={titleStyle}>{title}</h3>
      {message && <p style={messageStyle}>{message}</p>}
      {onRetry && (
        <button
          style={buttonStyle}
          onClick={onRetry}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default PageError;
