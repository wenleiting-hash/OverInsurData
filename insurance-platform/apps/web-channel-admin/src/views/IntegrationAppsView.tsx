import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, KeyRound, RefreshCw, Trash2, Copy, Check, X, Shield, AlertTriangle, Eye,
} from 'lucide-react';
import type { ViewId } from '@/App';
import {
  integrationAppService,
  type IntegrationApp,
  type AppWithSecret,
  type CreateAppDto,
} from '@/services/integrationAppService';

interface Props {
  navigateTo: (view: ViewId) => void;
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(16,166,84,0.1)', color: '#10A654', label: '已启用' },
  disabled: { bg: 'rgba(113,119,134,0.12)', color: '#717786', label: '已停用' },
};

export default function IntegrationAppsView({ navigateTo }: Props) {
  const { t } = useTranslation('common');
  const [apps, setApps] = useState<IntegrationApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [secretModal, setSecretModal] = useState<AppWithSecret | null>(null);
  // V1.0.16：密钥展示模式 — created/reset 展示一次性明文；revealed 后续查看明文（带审计）
  const [secretModalMode, setSecretModalMode] = useState<'created' | 'reset' | 'revealed'>('created');
  const [revealConfirm, setRevealConfirm] = useState<IntegrationApp | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState<IntegrationApp | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await integrationAppService.list(1, 50);
      setApps(res.data?.items || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleCreate = async (dto: CreateAppDto) => {
    try {
      const res = await integrationAppService.create(dto);
      setSecretModal(res.data);
      setSecretModalMode('created');
      setShowCreate(false);
      fetchApps();
    } catch (e: any) {
      alert(e?.response?.data?.message || '创建失败');
    }
  };

  const handleToggleStatus = async (app: IntegrationApp) => {
    const next = app.status === 'active' ? 'disabled' : 'active';
    try {
      await integrationAppService.update(app.app_id, { status: next });
      fetchApps();
    } catch (e: any) {
      alert(e?.response?.data?.message || '操作失败');
    }
  };

  const handleReset = async (app: IntegrationApp) => {
    if (!confirm(`确认重置「${app.app_name}」的 appSecret？旧密钥将立即失效。`)) return;
    try {
      const res = await integrationAppService.resetSecret(app.app_id);
      setSecretModal(res.data);
      setSecretModalMode('reset');
    } catch (e: any) {
      alert(e?.response?.data?.message || '重置失败');
    }
  };

  // V1.0.16：后续查看明文 appSecret（用于复制），后端记录 INTEGRATION_APP_SECRET_VIEW 审计
  const handleReveal = async (app: IntegrationApp) => {
    try {
      const res = await integrationAppService.revealSecret(app.app_id);
      setRevealConfirm(null);
      setSecretModal(res.data);
      setSecretModalMode('revealed');
    } catch (e: any) {
      alert(e?.response?.data?.message || '查看密钥失败');
    }
  };

  const handleDelete = async (app: IntegrationApp) => {
    try {
      await integrationAppService.remove(app.app_id);
      setConfirmDel(null);
      fetchApps();
    } catch (e: any) {
      alert(e?.response?.data?.message || '删除失败');
    }
  };

  const copySecret = async (text: string) => {
    try {
      // navigator.clipboard 仅在安全上下文（HTTPS/localhost）可用；生产为 HTTP 时走 execCommand 回退
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand copy failed');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('复制失败，请手动选中文本复制');
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#181C23', margin: 0 }}>
            接入应用管理
          </h1>
          <p style={{ color: '#717786', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            管理外部系统（如 workOS）的接入凭证；appSecret 在创建/重置时展示，后续可点击「查看明文」复制（该操作会记录审计）
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0058BC,#0070EB)', color: '#fff',
            fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus size={15} /> 新建应用
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '0.5px solid rgba(193,198,215,0.5)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(113,119,134,0.06)' }}>
              {['应用名称', 'appKey', '状态', 'IP 白名单', '限流(次/分)', '最后调用', '创建人', '操作'].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5a6070',
                  borderBottom: '0.5px solid rgba(193,198,215,0.5)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#717786' }}>加载中…</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#717786' }}>
                暂无接入应用，点击「新建应用」创建
              </td></tr>
            ) : apps.map((app) => {
              const badge = STATUS_BADGE[app.status];
              return (
                <tr key={app.app_id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.3)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#181C23' }}>{app.app_name}</div>
                    {app.app_desc && <div style={{ color: '#717786', fontSize: 12, marginTop: 2 }}>{app.app_desc}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#4F46E5' }}>{app.app_key}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                      background: badge.bg, color: badge.color,
                    }}>{badge.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#5a6070', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {app.ip_whitelist || '不限'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#5a6070' }}>{app.rate_limit}</td>
                  <td style={{ padding: '12px 16px', color: '#717786', fontSize: 12 }}>
                    {app.last_called_at ? new Date(app.last_called_at).toLocaleString() : '从未'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#5a6070' }}>{app.created_by || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        title="查看 appSecret 明文"
                        onClick={() => setRevealConfirm(app)}
                        style={iconBtn('#4F46E5')}
                      ><Eye size={14} /></button>
                      <button
                        title="重置 appSecret"
                        onClick={() => handleReset(app)}
                        style={iconBtn('#0058BC')}
                      ><RefreshCw size={14} /></button>
                      <button
                        title={app.status === 'active' ? '停用' : '启用'}
                        onClick={() => handleToggleStatus(app)}
                        style={iconBtn(app.status === 'active' ? '#717786' : '#10A654')}
                      >{app.status === 'active' ? <X size={14} /> : <Check size={14} />}</button>
                      <button
                        title="删除"
                        onClick={() => setConfirmDel(app)}
                        style={iconBtn('#BA1A1A')}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateAppModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Secret Display Modal */}
      {secretModal && (
        <SecretModal
          app={secretModal}
          mode={secretModalMode}
          copied={copied}
          onCopy={() => copySecret(`${secretModal.app_key}\n${secretModal.app_secret}`)}
          onClose={() => setSecretModal(null)}
        />
      )}

      {/* Reveal Confirm */}
      {revealConfirm && (
        <Modal title="查看 appSecret 明文" onClose={() => setRevealConfirm(null)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <Shield size={22} color="#4F46E5" />
            <div>
              <p style={{ margin: 0, color: '#181C23' }}>
                确认查看应用「<b>{revealConfirm.app_name}</b>」的 appSecret 明文？
              </p>
              <p style={{ margin: '8px 0 0', color: '#717786', fontSize: 13 }}>
                该操作不会改动密钥，但会写入审计日志（INTEGRATION_APP_SECRET_VIEW）。请确认您有权限查看，并在复制后妥善保存。
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setRevealConfirm(null)} style={secondaryBtn}>取消</button>
            <button onClick={() => handleReveal(revealConfirm)} style={{ ...primaryBtn, background: '#4F46E5' }}>确认查看</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <Modal title="确认删除" onClose={() => setConfirmDel(null)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <AlertTriangle size={22} color="#BA1A1A" />
            <div>
              <p style={{ margin: 0, color: '#181C23' }}>
                确认删除应用「<b>{confirmDel.app_name}</b>」？
              </p>
              <p style={{ margin: '8px 0 0', color: '#717786', fontSize: 13 }}>
                删除后该应用的 appKey/appSecret 立即失效，且不可恢复。
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setConfirmDel(null)} style={secondaryBtn}>取消</button>
            <button onClick={() => handleDelete(confirmDel)} style={{ ...primaryBtn, background: '#BA1A1A' }}>确认删除</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateAppModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: CreateAppDto) => void }) {
  const [form, setForm] = useState<CreateAppDto>({ appName: '', appDesc: '', ipWhitelist: '', rateLimit: 60 });
  return (
    <Modal title="新建接入应用" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="应用名称" required>
          <input
            value={form.appName}
            onChange={(e) => setForm({ ...form, appName: e.target.value })}
            placeholder="如：workOS"
            style={inputStyle}
          />
        </Field>
        <Field label="描述">
          <input
            value={form.appDesc}
            onChange={(e) => setForm({ ...form, appDesc: e.target.value })}
            placeholder="可选"
            style={inputStyle}
          />
        </Field>
        <Field label="IP 白名单" hint="留空表示不限制；多个用英文逗号分隔，支持 CIDR（如 10.0.0.0/24）">
          <input
            value={form.ipWhitelist}
            onChange={(e) => setForm({ ...form, ipWhitelist: e.target.value })}
            placeholder="如 192.168.1.0/24,10.0.0.1"
            style={inputStyle}
          />
        </Field>
        <Field label="限流（次/分钟）">
          <input
            type="number"
            value={form.rateLimit}
            onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value, 10) || 60 })}
            style={inputStyle}
          />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button onClick={onClose} style={secondaryBtn}>取消</button>
        <button
          disabled={!form.appName.trim()}
          onClick={() => onSubmit(form)}
          style={{ ...primaryBtn, opacity: form.appName.trim() ? 1 : 0.5 }}
        >创建</button>
      </div>
    </Modal>
  );
}

// ─── Secret Modal ─────────────────────────────────────────────────────────────
function SecretModal({ app, mode, copied, onCopy, onClose }: {
  app: AppWithSecret;
  mode: 'created' | 'reset' | 'revealed';
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  // V1.0.16：created/reset 展示一次性明文；revealed 后续查看（带审计）
  const isReveal = mode === 'revealed';
  const title = isReveal ? '查看 appSecret 明文' : (mode === 'reset' ? '新凭证已生成' : '凭证已生成');
  const warnBg = isReveal ? 'rgba(79,70,229,0.06)' : 'rgba(186,26,26,0.06)';
  const warnBorder = isReveal ? 'rgba(79,70,229,0.2)' : 'rgba(186,26,26,0.2)';
  const warnIconColor = isReveal ? '#4F46E5' : '#BA1A1A';
  const warnText = isReveal
    ? '您正在查看已存在的 appSecret 明文，本次操作已写入审计日志（INTEGRATION_APP_SECRET_VIEW）。请仅在必要时查看，复制后立即妥善保存。'
    : '请立即复制并安全保存 appSecret。重置/创建后此密钥不再回显，如需再次查看请使用「查看明文」按钮（带审计）。';
  const WarnIcon = isReveal ? Shield : AlertTriangle;
  return (
    <Modal title={title} onClose={onClose} wide>
      <div style={{
        background: warnBg, border: `1px solid ${warnBorder}`,
        borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10,
      }}>
        <WarnIcon size={18} color={warnIconColor} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: '#181C23' }}>{warnText}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="appKey">
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={app.app_key} style={{ ...inputStyle, fontFamily: 'monospace', flex: 1 }} />
          </div>
        </Field>
        <Field label="appSecret">
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={app.app_secret} style={{ ...inputStyle, fontFamily: 'monospace', flex: 1 }} />
            <button onClick={onCopy} style={{ ...primaryBtn, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', whiteSpace: 'nowrap' }}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={onClose} style={primaryBtn}>我已保存，关闭</button>
      </div>
    </Modal>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose, wide }: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, width: wide ? 620 : 520, maxWidth: '92vw',
          padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#181C23' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#717786' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#BA1A1A' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: '#717786', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
  border: '0.5px solid rgba(193,198,215,0.8)', background: '#fff', color: '#181C23',
  boxSizing: 'border-box', outline: 'none',
};
const primaryBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg,#0058BC,#0070EB)', color: '#fff', fontSize: 13, fontWeight: 600,
};
const secondaryBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 8, border: '0.5px solid rgba(193,198,215,0.8)',
  cursor: 'pointer', background: '#fff', color: '#181C23', fontSize: 13, fontWeight: 500,
};
const iconBtn = (color: string): React.CSSProperties => ({
  width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
  background: 'rgba(113,119,134,0.08)', color, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
});
