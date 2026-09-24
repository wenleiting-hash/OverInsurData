import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import authApiClient from '../../lib/auth-api-client';

type Phase = 'processing' | 'success' | 'error';

/**
 * V1.0.16 T2 · workOS SSO 回调页
 * 独立路由 /sso/callback，App.tsx 在 !isAuthenticated 之前短路渲染。
 * 流程：读 URL code+state[+mock_user] → POST /api/auth/sso/exchange → 写 localStorage → 跳回 /
 */
export default function SsoCallbackView() {
  const { t } = useTranslation('login');
  const [phase, setPhase] = useState<Phase>('processing');
  const [errorKey, setErrorKey] = useState<string>('unknown');

  // 在渲染阶段捕获 URL 参数，避免 App.tsx syncUrl 用 history.replaceState 改写 URL 后丢失参数
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const mockUserB64 = urlParams.get('mock_user');

  useEffect(() => {
    if (!code || !state) {
      setErrorKey('invalidCode');
      setPhase('error');
      return;
    }

    let mock_user: any = undefined;
    if (mockUserB64) {
      try {
        // UTF-8 安全的 base64 解码（含中文的 W1 响应）
        mock_user = JSON.parse(decodeURIComponent(escape(atob(mockUserB64))));
      } catch {
        // base64 损坏，忽略，让后端走真实 W1 或返回 code 失效
      }
    }

    (async () => {
      try {
        const resp = await authApiClient.post('/sso/exchange', { code, state, mock_user });
        const data = resp.data?.data;
        if (!data?.accessToken || !data?.user) {
          setErrorKey('security');
          setPhase('error');
          return;
        }
        localStorage.setItem('auth.access_token', data.accessToken);
        localStorage.setItem('auth.refresh_token', data.refreshToken);
        localStorage.setItem('auth.user_info', JSON.stringify(data.user));
        setPhase('success');
        // 重载让 AuthContext 从 localStorage 恢复并进入 Layout
        setTimeout(() => window.location.replace('/'), 600);
      } catch (err: any) {
        const code = err?.response?.data?.code as string | undefined;
        const map: Record<string, string> = {
          SSO_CODE_INVALID: 'invalidCode',
          SSO_USER_NOT_SYNCED: 'notSynced',
          SSO_USER_DISABLED: 'disabled',
          SSO_SECURITY_ERROR: 'security',
        };
        setErrorKey(map[code ?? ''] ?? 'unknown');
        setPhase('error');
      }
    })();
  }, [code, state, mockUserB64]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(1200px 600px at 80% -10%, rgba(0,88,188,0.08), transparent 60%), #f5f7fb',
    fontFamily: 'var(--font-sans)',
    color: '#181C23',
    padding: 24,
  };
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid rgba(193,198,215,0.6)',
    borderRadius: 14,
    padding: '32px 40px',
    maxWidth: 460,
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(20,30,50,0.08)',
  };

  if (phase === 'processing') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#0058BC', marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#414755' }}>{t('sso.callback.processing')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <CheckCircle2 size={32} style={{ color: '#16A34A', marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#414755' }}>{t('sso.callback.successRedirect')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <AlertCircle size={32} style={{ color: '#DC2626', marginBottom: 14 }} />
        <p style={{ fontSize: 14, color: '#414755', lineHeight: 1.7 }}>
          {t(`sso.callback.error.${errorKey}`)}
        </p>
        <button
          onClick={() => window.location.replace('/')}
          style={{
            marginTop: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: '#0058BC', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          {t('sso.gotoWorkos')}
        </button>
      </div>
    </div>
  );
}
