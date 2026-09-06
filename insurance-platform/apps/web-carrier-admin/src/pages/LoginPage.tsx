import { useState, type CSSProperties, type FocusEvent, type FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Globe, Info, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LoginLang = 'zh' | 'en';
type LoginTab = 'password' | 'sso';

export default function LoginPage() {
  // 登录页语言独立于系统语言：初始读取 localStorage['insure-os-lang']（异常回退 zh），
  // 切换仅改本地状态、绝不回写 localStorage；登录后系统语言不受登录页切换影响
  const [loginLang, setLoginLang] = useState<LoginLang>(() => {
    try {
      const saved = localStorage.getItem('insure-os-lang');
      return saved === 'en' || saved === 'zh' ? saved : 'zh';
    } catch {
      return 'zh';
    }
  });
  const { t } = useTranslation('login');
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth(); // Get auth state from Context
  const location = useLocation();
  // t() 通过 lng 选项按登录页本地语言取词，不改动全局 i18n 语言
  const lng = loginLang === 'en' ? 'en-US' : 'zh-CN';
  const tr = (key: string): string => t(key, { lng });

  const [tab, setTab] = useState<LoginTab>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputStyle: CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14, color: '#181C23',
    background: 'rgba(241,243,254,0.8)', border: '1px solid rgba(193,198,215,0.7)',
    borderRadius: 10, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
  };
  const codeStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)', color: '#0058BC',
  };
  const paramRowStyle: CSSProperties = {
    display: 'flex', gap: 8, marginBottom: 4, fontSize: 12,
  };
  const chipStyle: CSSProperties = {
    ...codeStyle, fontSize: 11, background: 'rgba(0,88,188,0.08)',
    padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#0058BC';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,88,188,0.12)';
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(193,198,215,0.7)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleSubmit = async (e?: FormEvent) => {
    console.log('[Login] handleSubmit called with username:', username, 'password length:', password.length);
    e?.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError(tr('form.emptyError'));
      return;
    }

    setIsLoading(true);
    try {
      await login({ username, password }); // ✅ Call real API via AuthContext
      // Note: Navigation is handled by useEffect watching auth state
    } catch (err: any) {
      // Handle specific error cases
      if (err.message.includes('Invalid')) {
        setError(tr('invalidCredentials'));
      } else if (err.message.includes('locked')) {
        setError(tr('accountLocked'));
      } else {
        setError(tr('networkError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-navigate to dashboard after successful login
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Get the original destination or redirect to dashboard
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    flex: '1 1 0%', padding: '14px 0', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? '#0058BC' : '#717786', background: 'none',
    borderBottom: `2px solid ${active ? '#0058BC' : 'transparent'}`,
    cursor: 'pointer', transition: '0.2s', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-sans)',
  })

  const langButtonStyle = (active: boolean): CSSProperties => ({
    padding: '4px 12px', fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? '#fff' : '#717786',
    background: active ? 'linear-gradient(135deg, #0058BC, #0070EB)' : 'none',
    border: 'none', borderRadius: 7, cursor: 'pointer', transition: '0.18s',
    boxShadow: active ? '0 2px 8px rgba(0,88,188,0.25)' : 'none',
    fontFamily: 'var(--font-sans)',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(at 15% 25%, rgba(0,88,188,0.18) 0%, transparent 50%),' +
          'radial-gradient(at 85% 75%, rgba(0,112,235,0.12) 0%, transparent 50%),' +
          'radial-gradient(rgba(173,198,255,0.25) 0%, rgb(238,242,255) 100%)',
      }}
    >
      {/* Language toggle（登录页独立语言，与系统设置互不影响） */}
      <div
        className="absolute right-6 top-5 z-10 flex items-center rounded-[10px]"
        style={{
          gap: 2,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(193,198,215,0.5)', padding: '3px 4px',
        }}
      >
        <button style={langButtonStyle(loginLang === 'zh')} aria-label={tr('a11y.switchToZh')} onClick={() => setLoginLang('zh')}>中文</button>
        <button style={langButtonStyle(loginLang === 'en')} aria-label={tr('a11y.switchToEn')} onClick={() => setLoginLang('en')}>EN</button>
      </div>
      {/* Decorative orbs */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          top: '8%', left: '6%', width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(0,88,188,0.09) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          bottom: '10%', right: '8%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(0,112,235,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Center column */}
      <div className="relative mx-4 w-full max-w-[448px]">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px]"
            style={{
              background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
              boxShadow: '0 8px 24px rgba(0,88,188,0.35)',
            }}
          >
            <ShieldCheck size={26} color="#fff" strokeWidth={2} />
          </div>
          <h1
            className="mb-1 text-2xl font-bold"
            style={{ fontFamily: 'var(--font-sans)', color: '#0058BC', letterSpacing: '-0.4px', lineHeight: 1.3 }}
          >
            InsureOS
          </h1>
          <p className="text-[13px] font-normal text-[#717786]">{tr('brand.subtitle')}</p>
        </div>

        {/* Card */}
        <div
          className="overflow-hidden rounded-[20px]"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.72)',
            boxShadow: '0 4px 32px rgba(0,58,152,0.10), 0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(193,198,215,0.5)' }}>
            <button style={tabButtonStyle(tab === 'password')} onClick={() => setTab('password')}>
              <Lock size={13} />{tr('tabs.password')}
            </button>
            <button style={tabButtonStyle(tab === 'sso')} onClick={() => setTab('sso')}>
              <Globe size={13} />{tr('tabs.sso')}
            </button>
          </div>

          {tab === 'password' ? (
            /* ── Tab 1: account & password ── */
            <div className="px-8 pb-8 pt-7">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-[#414755]">
                    {tr('form.usernameLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={tr('form.usernamePlaceholder')}
                    autoComplete="username"
                    value={username}
                    onChange={e => { setUsername(e.target.value); if (error) setError('') }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-medium text-[#414755]">
                    {tr('form.passwordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder={tr('form.passwordPlaceholder')}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); if (error) setError('') }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      style={{ ...inputStyle, padding: '10px 40px 10px 14px' }}
                    />
                    <button
                      type="button"
                      aria-label={tr('a11y.togglePassword')}
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent p-0.5 text-[#717786]"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 text-center text-xs text-[#BA1A1A]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none py-[11px] text-sm font-semibold text-white transition-all duration-200"
                  style={{
                    background: isLoading ? 'rgba(0,88,188,0.5)' : 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                    opacity: isLoading ? 0.7 : 1,
                    boxShadow: isLoading ? 'none' : '0 4px 14px rgba(0,88,188,0.35)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {isLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {tr('form.signIn')}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent text-xs text-[#0058BC]"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {tr('form.forgotPassword')}
                  </button>
                </div>

                <div
                  className="mt-5 rounded-lg px-3.5 py-2.5 text-xs leading-[1.7] text-[#717786]"
                  style={{ background: 'rgba(241,243,254,0.9)', border: '1px dashed rgba(193,198,215,0.8)' }}
                >
                  <span className="font-semibold text-[#414755]">{tr('demo.title')}</span>
                  &nbsp;&nbsp;{tr('demo.usernameLabel')}<code style={codeStyle}>admin</code>
                  &nbsp;&nbsp;{tr('demo.passwordLabel')}<code style={codeStyle}>admin123</code>
                </div>
              </form>
            </div>
          ) : (
            /* ── Tab 2: integration platform ── */
            <div className="px-8 pb-8 pt-7">
              <div className="pb-5 pt-3 text-center">
                <div
                  className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,88,188,0.07)' }}
                >
                  <Globe size={24} color="#0058BC" strokeWidth={2} />
                </div>
                <p className="mb-1.5 text-sm font-medium text-[#414755]">
                  {tr('sso.viaTitle')}
                </p>
                <p className="text-xs leading-[1.6] text-[#717786]">
                  {tr('sso.descLine1')}
                  <br />
                  {tr('sso.descLine2')}
                </p>
              </div>

              <div
                className="mb-5 rounded-[10px] px-4 py-3.5"
                style={{ background: 'rgba(241,243,254,0.8)', border: '1px solid rgba(193,198,215,0.5)' }}
              >
                <p className="mb-2 text-[11px] font-semibold text-[#414755]" style={{ letterSpacing: '0.5px' }}>
                  {tr('sso.paramsTitle')}
                </p>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>token</code>
                  <span className="text-[#717786]">{tr('sso.paramToken')}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>user</code>
                  <span className="text-[#717786]">{tr('sso.paramUser')}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>role</code>
                  <span className="text-[#717786]">{tr('sso.paramRole')}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>platform</code>
                  <span className="text-[#717786]">{tr('sso.paramPlatform')}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#9EA6B4]">
                  {tr('sso.exampleLabel')}
                  <code style={{ ...codeStyle, fontSize: 10 }}>{tr('sso.exampleCode')}</code>
                </p>
              </div>

              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs text-[#717786]"
                style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)' }}
              >
                <Info size={14} className="mt-px shrink-0" />
                <span>
                  {tr('sso.warning')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#9EA6B4]">
          {tr('footer.copyright')}
        </p>
      </div>
    </div>
  )
}
