/**
 * 险种字典管理（V1.0.18，PRD §7）
 * 三个 Tab：业务线与子险种（左右分栏）｜承保范围（全局表格）｜适用范围矩阵（行=业务线，列=承保范围）
 * 所有写操作走 /api/dictionaries，需 dict:manage；接口错误码映射 dict.errors.* 文案。
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, RefreshCw, AlertTriangle, Check,
} from 'lucide-react';
import type { ViewId } from '@/App';
import {
  dictionaryService,
  dictErrorKey,
  type DictLine,
  type DictSubLine,
  type DictCoverage,
  type DictTree,
  type DictUpsertDto,
} from '@/services/dictionaryService';

interface Props {
  navigateTo: (view: ViewId) => void;
}

type TabKey = 'lines' | 'coverages' | 'matrix';
type EditTarget =
  | { kind: 'line'; mode: 'create' | 'edit'; line?: DictLine }
  | { kind: 'sub-line'; mode: 'create'; lineCode: string }
  | { kind: 'sub-line'; mode: 'edit'; sub?: DictSubLine }
  | { kind: 'coverage'; mode: 'create' }
  | { kind: 'coverage'; mode: 'edit'; cov?: DictCoverage };

interface ConfirmState {
  title: string;
  message: string;
  needAck: boolean;
  okText: string;
  action: () => Promise<void>;
}

const C = {
  text: '#181C23', sub: '#717786', primary: '#0058BC', border: 'rgba(193,198,215,0.5)',
  okBg: 'rgba(16,166,84,0.1)', ok: '#10A654', offBg: 'rgba(113,119,134,0.12)', off: '#717786',
  warnBg: 'rgba(245,158,11,0.12)', warn: '#B45309', danger: '#DC2626',
};

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`,
  fontSize: 13, outline: 'none', background: '#fff', color: C.text,
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const active = status === 'active';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: active ? C.okBg : C.offBg, color: active ? C.ok : C.off,
    }}>
      {t(active ? 'status.active' : 'status.disabled')}
    </span>
  );
}

function IconBtn({ title, onClick, disabled, danger }: { title: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
        border: `0.5px solid ${C.border}`, background: '#fff', opacity: disabled ? 0.35 : 1,
        color: danger ? C.danger : C.sub,
      }}
    >
      {danger ? <Trash2 size={13} /> : <Pencil size={13} />}
    </button>
  );
}

/** 通用确认弹窗：涉及引用的停用要求勾选「我已知悉影响」（PRD §7.2） */
function ConfirmModal({ title, message, needAck, okText, onConfirm, onClose }: {
  title: string; message: string; needAck: boolean; okText: string;
  onConfirm: () => void; onClose: () => void;
}) {
  const { t } = useTranslation('dict');
  const [ack, setAck] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ width: 420, background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginBottom: needAck ? 10 : 18 }}>{message}</div>
        {needAck && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span style={{ color: C.warn, fontWeight: 600 }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />{t('confirm.acknowledge')}
            </span>
          </label>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>{t('actions.cancel')}</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            disabled={needAck && !ack}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: needAck && !ack ? 'not-allowed' : 'pointer', opacity: needAck && !ack ? 0.4 : 1, background: C.danger, color: '#fff' }}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormInitial { code: string; nameZh: string; nameEn: string; sortOrder?: number }

/** 新增/编辑表单弹窗（业务线 / 子险种 / 承保范围共用） */
function FormModal({ title, codeTip, editing, initial, onSubmit, onClose }: {
  title: string; codeTip: string; editing: boolean; initial?: FormInitial;
  onSubmit: (dto: DictUpsertDto) => Promise<void>; onClose: () => void;
}) {
  const { t } = useTranslation('dict');
  const [code, setCode] = useState(initial?.code ?? '');
  const [nameZh, setNameZh] = useState(initial?.nameZh ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder != null ? String(initial.sortOrder) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!nameZh.trim() || !nameEn.trim() || (!editing && !code.trim())) {
      setError(t('fields.required'));
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        code: editing ? undefined : code.trim(),
        nameZh: nameZh.trim(), nameEn: nameEn.trim(),
        sortOrder: sortOrder === '' ? undefined : Number(sortOrder),
      });
      onClose();
    } catch (e: unknown) {
      setError(t(dictErrorKey(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ width: 440, background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: C.sub }}>{t('fields.code')}</label>
          <div>
            <input value={code} disabled={editing} onChange={(e) => setCode(e.target.value)} style={{ ...inputStyle, width: '100%', opacity: editing ? 0.6 : 1 }} />
            {!editing && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{codeTip}</div>}
          </div>
          <label style={{ fontSize: 13, color: C.sub }}>{t('fields.nameZh')}</label>
          <input value={nameZh} onChange={(e) => setNameZh(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
          <label style={{ fontSize: 13, color: C.sub }}>{t('fields.nameEn')}</label>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
          <label style={{ fontSize: 13, color: C.sub }}>{t('fields.sortOrder')}</label>
          <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ''))} style={{ ...inputStyle, width: 120 }} />
        </div>
        {error && <div style={{ marginTop: 10, fontSize: 12, color: C.danger }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>{t('actions.cancel')}</button>
          <button onClick={submit} disabled={saving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#0058BC,#0070EB)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>{t('actions.save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function DictionaryManageView({ navigateTo: _navigateTo }: Props) {
  const { t, i18n } = useTranslation('dict');

  const [tab, setTab] = useState<TabKey>('lines');
  const [lines, setLines] = useState<DictLine[]>([]);
  const [selLineCode, setSelLineCode] = useState<string>('');
  const [subLines, setSubLines] = useState<DictSubLine[]>([]);
  const [coverages, setCoverages] = useState<DictCoverage[]>([]);
  const [tree, setTree] = useState<DictTree | null>(null);
  const [rel, setRel] = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [warnings, setWarnings] = useState<Record<string, { code: string; count: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [formTarget, setFormTarget] = useState<EditTarget | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const isZh = i18n.language?.startsWith('zh');
  const pickName = (o: { nameZh: string; nameEn: string }) => (isZh ? o.nameZh : o.nameEn);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const fetchLines = useCallback(async () => {
    const res = await dictionaryService.listLines(true);
    setLines(res.data);
    return res.data;
  }, []);
  const fetchSubLines = useCallback(async (lineCode: string) => {
    const res = await dictionaryService.listSubLines(lineCode, true);
    setSubLines(res.data);
  }, []);
  const fetchCoverages = useCallback(async () => {
    const res = await dictionaryService.listCoverages(true);
    setCoverages(res.data);
  }, []);
  const fetchMatrix = useCallback(async () => {
    const [treeRes, linesRes] = await Promise.all([dictionaryService.tree(), dictionaryService.listLines(false)]);
    const relRes = await Promise.all(
      linesRes.data.filter((l) => l.status === 'active').map((l) => dictionaryService.getLineCoverages(l.code)),
    );
    const relMap: Record<string, Set<string>> = {};
    for (const r of relRes) relMap[r.data.lineCode] = new Set(r.data.coverageCodes);
    setTree(treeRes.data);
    setRel(relMap);
    setDirty({});
    setWarnings({});
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ls = await fetchLines();
        if (ls.length > 0) {
          setSelLineCode((prev) => prev || ls[0].code);
          await fetchSubLines(ls[0].code);
        }
        await fetchCoverages();
      } catch {
        showToast(t('errors.network'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selLineCode) fetchSubLines(selLineCode).catch(() => setSubLines([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selLineCode]);

  useEffect(() => {
    if (tab === 'matrix' && !tree) fetchMatrix().catch(() => showToast(t('errors.network')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── 通用写操作 ────────────────────────────────────────────
  const refreshLineSide = async (code: string) => {
    await fetchLines();
    await fetchSubLines(code);
  };

  const handleFormSubmit = async (dto: DictUpsertDto) => {
    if (!formTarget) return;
    if (formTarget.kind === 'line') {
      if (formTarget.mode === 'create') await dictionaryService.createLine(dto);
      else await dictionaryService.updateLine(formTarget.line!.code, dto);
      await fetchLines();
      showToast(formTarget.mode === 'create' ? t('toast.created') : t('toast.updated'));
    } else if (formTarget.kind === 'sub-line') {
      if (formTarget.mode === 'create') await dictionaryService.createSubLine(formTarget.lineCode, dto);
      else await dictionaryService.updateSubLine(formTarget.sub!.id, dto);
      await refreshLineSide(formTarget.mode === 'create' ? formTarget.lineCode : formTarget.sub!.lineCode);
      showToast(formTarget.mode === 'create' ? t('toast.created') : t('toast.updated'));
    } else {
      if (formTarget.mode === 'create') await dictionaryService.createCoverage(dto);
      else await dictionaryService.updateCoverage(formTarget.cov!.code, dto);
      await fetchCoverages();
      showToast(formTarget.mode === 'create' ? t('toast.created') : t('toast.updated'));
    }
  };

  /** 停用确认（有引用时需勾选已知悉，无引用普通确认） */
  const askToggle = async (
    item: { code: string; status: string; productCount?: number },
    run: (next: 'active' | 'disabled') => Promise<void>,
  ) => {
    const next: 'active' | 'disabled' = item.status === 'active' ? 'disabled' : 'active';
    if (next === 'disabled') {
      const hasRefs = (item.productCount ?? 0) > 0;
      setConfirmState({
        title: t('confirm.disableTitle'),
        message: hasRefs
          ? t('confirm.disableWithRefs', { count: item.productCount })
          : t('confirm.disableNoRefs', { code: item.code }),
        needAck: hasRefs,
        okText: t('actions.disable'),
        action: () => run(next),
      });
    } else {
      await run(next);
    }
  };

  const toggleLine = async (line: DictLine, next: 'active' | 'disabled') => {
    await dictionaryService.setLineStatus(line.code, next);
    await fetchLines();
    showToast(t('toast.statusChanged'));
  };
  const toggleSubLine = async (s: DictSubLine, next: 'active' | 'disabled') => {
    await dictionaryService.setSubLineStatus(s.id, next);
    await fetchSubLines(s.lineCode);
    showToast(t('toast.statusChanged'));
  };
  const toggleCoverage = async (c: DictCoverage, next: 'active' | 'disabled') => {
    await dictionaryService.setCoverageStatus(c.code, next);
    await fetchCoverages();
    showToast(t('toast.statusChanged'));
  };

  const askDeleteLine = (line: DictLine) => {
    const blocked = (line.productCount ?? 0) > 0 || (line.subLineCount ?? 0) > 0;
    if (blocked) { showToast(t('errors.DICT_IN_USE')); return; }
    setConfirmState({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteLine', { code: line.code }),
      needAck: false,
      okText: t('actions.delete'),
      action: async () => {
        try {
          await dictionaryService.deleteLine(line.code);
          const ls = await fetchLines();
          const nextSel = ls.find((l) => l.code !== line.code)?.code ?? '';
          setSelLineCode(nextSel);
          if (nextSel) await fetchSubLines(nextSel); else setSubLines([]);
          showToast(t('toast.deleted'));
        } catch (e) { showToast(t(dictErrorKey(e))); }
      },
    });
  };
  const askDeleteSubLine = (s: DictSubLine) => {
    if ((s.productCount ?? 0) > 0) { showToast(t('errors.DICT_IN_USE')); return; }
    setConfirmState({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteSubLine', { code: s.code }),
      needAck: false,
      okText: t('actions.delete'),
      action: async () => {
        try {
          await dictionaryService.deleteSubLine(s.id);
          await fetchSubLines(s.lineCode);
          await fetchLines();
          showToast(t('toast.deleted'));
        } catch (e) { showToast(t(dictErrorKey(e))); }
      },
    });
  };
  const askDeleteCoverage = (c: DictCoverage) => {
    if ((c.productCount ?? 0) > 0) { showToast(t('errors.DICT_IN_USE')); return; }
    setConfirmState({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteCoverage', { code: c.code }),
      needAck: false,
      okText: t('actions.delete'),
      action: async () => {
        try {
          await dictionaryService.deleteCoverage(c.code);
          await fetchCoverages();
          showToast(t('toast.deleted'));
        } catch (e) { showToast(t(dictErrorKey(e))); }
      },
    });
  };

  /** 排序调整：与相邻项交换 sortOrder */
  const moveItem = async (
    list: { sortOrder: number }[], idx: number, dir: -1 | 1,
    run: (a: DictUpsertDto) => Promise<unknown>, refresh: () => Promise<unknown>,
  ) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    await run({ sortOrder: list[j].sortOrder });
    await run({ sortOrder: list[idx].sortOrder });
    await refresh();
  };

  // ── 矩阵交互 ──────────────────────────────────────────────
  const treeLines = tree?.lines ?? [];
  const allCoverageCodes = (tree?.allCoverages ?? []).map((c) => c.code);

  const toggleCell = async (lineCode: string, covCode: string) => {
    const cur = new Set(rel[lineCode] ?? []);
    if (cur.has(covCode)) {
      cur.delete(covCode);
      try {
        const u = await dictionaryService.usage('coverage', covCode, lineCode);
        if ((u.data.productCount ?? 0) > 0) {
          setWarnings((w) => {
            const row = (w[lineCode] ?? []).filter((x) => x.code !== covCode);
            return { ...w, [lineCode]: [...row, { code: covCode, count: u.data.productCount! }] };
          });
        }
      } catch { /* 统计失败不阻断 */ }
    } else {
      cur.add(covCode);
      setWarnings((w) => ({ ...w, [lineCode]: (w[lineCode] ?? []).filter((x) => x.code !== covCode) }));
    }
    setRel((r) => ({ ...r, [lineCode]: cur }));
    setDirty((d) => ({ ...d, [lineCode]: true }));
  };

  const saveRow = async (lineCode: string) => {
    try {
      await dictionaryService.replaceLineCoverages(lineCode, Array.from(rel[lineCode] ?? []));
      setDirty((d) => ({ ...d, [lineCode]: false }));
      showToast(t('toast.relSaved'));
    } catch (e) {
      showToast(t(dictErrorKey(e)));
    }
  };
  const saveAllRows = async () => {
    const targets = Object.keys(dirty).filter((k) => dirty[k]);
    try {
      for (const lineCode of targets) {
        await dictionaryService.replaceLineCoverages(lineCode, Array.from(rel[lineCode] ?? []));
      }
      setDirty({});
      showToast(t('toast.relSaved'));
    } catch (e) {
      showToast(t(dictErrorKey(e)));
    }
  };
  const rowSelectAll = (lineCode: string, all: boolean) => {
    setRel((r) => ({ ...r, [lineCode]: new Set(all ? allCoverageCodes : []) }));
    setDirty((d) => ({ ...d, [lineCode]: true }));
  };

  // ── 表格列头 ──────────────────────────────────────────────
  const th = (w?: number): React.CSSProperties => ({
    padding: '8px 10px', fontSize: 12, fontWeight: 600, color: C.sub, textAlign: 'left',
    borderBottom: `0.5px solid ${C.border}`, whiteSpace: 'nowrap', width: w,
  });
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, color: C.text, borderBottom: '0.5px solid rgba(193,198,215,0.3)' };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{t('title')}</h1>
          <p style={{ color: C.sub, fontSize: 13, marginTop: 4, marginBottom: 0 }}>{t('subtitle')}</p>
        </div>
        <button
          onClick={() => {
            fetchLines().catch(() => {});
            fetchCoverages().catch(() => {});
            if (tree) fetchMatrix().catch(() => {});
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}
        >
          <RefreshCw size={14} /> {t('actions.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `0.5px solid ${C.border}` }}>
        {(['lines', 'coverages', 'matrix'] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none',
              color: tab === k ? C.primary : C.sub,
              borderBottom: tab === k ? `2px solid ${C.primary}` : '2px solid transparent',
            }}
          >
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {/* ── Tab1 业务线与子险种 ─────────────────────────── */}
      {tab === 'lines' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t('tabs.lines')}</span>
              <button
                onClick={() => setFormTarget({ kind: 'line', mode: 'create' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: C.okBg, color: C.ok, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={13} /> {t('actions.createLine')}
              </button>
            </div>
            {lines.map((l) => (
              <div
                key={l.code}
                onClick={() => setSelLineCode(l.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer',
                  background: l.code === selLineCode ? 'rgba(0,88,188,0.06)' : 'transparent',
                  borderLeft: l.code === selLineCode ? `2px solid ${C.primary}` : '2px solid transparent',
                  borderBottom: '0.5px solid rgba(193,198,215,0.3)',
                  opacity: l.status === 'disabled' ? 0.55 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pickName(l)}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{l.code} · {t('columns.subLineCount')} {l.subLineCount ?? 0}</div>
                </div>
                <StatusBadge status={l.status} t={t} />
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
            {!selLineCode ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.sub, fontSize: 13 }}>{t('empty.noLineSelected')}</div>
            ) : (
              <>
                {/* 选中业务线信息卡 */}
                {(() => {
                  const line = lines.find((l) => l.code === selLineCode);
                  if (!line) return null;
                  const idx = lines.findIndex((l) => l.code === selLineCode);
                  const blocked = (line.productCount ?? 0) > 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `0.5px solid ${C.border}`, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{pickName(line)}</div>
                      <span style={{ fontSize: 12, color: C.sub, fontFamily: 'monospace' }}>{line.code}</span>
                      <StatusBadge status={line.status} t={t} />
                      <span style={{ fontSize: 12, color: C.sub }}>
                        {t('columns.productCount')}: {line.productCount ?? 0}
                      </span>
                      <div style={{ flex: 1 }} />
                      <button onClick={() => setFormTarget({ kind: 'line', mode: 'edit', line })} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: C.text }}>
                        <Pencil size={12} /> {t('actions.edit')}
                      </button>
                      <button
                        onClick={() => askToggle(line, (n) => toggleLine(line, n))}
                        style={{ padding: '5px 10px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: C.text }}
                      >
                        {line.status === 'active' ? t('actions.disable') : t('actions.enable')}
                      </button>
                      <span title={blocked ? t('errors.DICT_IN_USE') : undefined}>
                        <button
                          onClick={() => askDeleteLine(line)}
                          disabled={blocked}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 12, cursor: blocked ? 'not-allowed' : 'pointer', color: C.danger, opacity: blocked ? 0.4 : 1 }}
                        >
                          <Trash2 size={12} /> {t('actions.delete')}
                        </button>
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => moveItem(lines, idx, -1, (a) => dictionaryService.updateLine(line.code, a), () => fetchLines())} title={t('actions.moveUp')} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', color: C.sub }}><ArrowUp size={13} /></button>
                        <button onClick={() => moveItem(lines, idx, 1, (a) => dictionaryService.updateLine(line.code, a), () => fetchLines())} title={t('actions.moveDown')} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', color: C.sub }}><ArrowDown size={13} /></button>
                      </div>
                    </div>
                  );
                })()}

                {/* 子险种表 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t('tabs.lines')} · {subLines.length}</span>
                  <button
                    onClick={() => setFormTarget({ kind: 'sub-line', mode: 'create', lineCode: selLineCode })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: C.okBg, color: C.ok, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={13} /> {t('actions.createSubLine')}
                  </button>
                </div>
                {subLines.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: C.sub, fontSize: 13 }}>{t('empty.subLines')}</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th(200)}>{t('columns.code')}</th>
                        <th style={th()}>{t('columns.nameZh')}</th>
                        <th style={th()}>{t('columns.nameEn')}</th>
                        <th style={th(90)}>{t('columns.status')}</th>
                        <th style={th(110)}>{t('columns.productCount')}</th>
                        <th style={th(190)}>{t('columns.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subLines.map((s, i) => (
                        <tr key={s.id} style={{ opacity: s.status === 'disabled' ? 0.55 : 1 }}>
                          <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{s.code}</td>
                          <td style={td}>{s.nameZh}</td>
                          <td style={td}>{s.nameEn}</td>
                          <td style={td}><StatusBadge status={s.status} t={t} /></td>
                          <td style={td}>{s.productCount ?? 0}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <IconBtn title={t('actions.edit')} onClick={() => setFormTarget({ kind: 'sub-line', mode: 'edit', sub: s })} />
                              <button onClick={() => askToggle(s, (n) => toggleSubLine(s, n))} style={{ padding: '2px 8px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: C.text }}>
                                {s.status === 'active' ? t('actions.disable') : t('actions.enable')}
                              </button>
                              <span title={(s.productCount ?? 0) > 0 ? t('errors.DICT_IN_USE') : undefined}>
                                <IconBtn title={t('actions.delete')} danger disabled={(s.productCount ?? 0) > 0} onClick={() => askDeleteSubLine(s)} />
                              </span>
                              <button onClick={() => moveItem(subLines, i, -1, (a) => dictionaryService.updateSubLine(s.id, a), () => fetchSubLines(selLineCode))} title={t('actions.moveUp')} disabled={i === 0} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: i === 0 ? 'default' : 'pointer', color: C.sub, opacity: i === 0 ? 0.35 : 1 }}><ArrowUp size={13} /></button>
                              <button onClick={() => moveItem(subLines, i, 1, (a) => dictionaryService.updateSubLine(s.id, a), () => fetchSubLines(selLineCode))} title={t('actions.moveDown')} disabled={i === subLines.length - 1} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: i === subLines.length - 1 ? 'default' : 'pointer', color: C.sub, opacity: i === subLines.length - 1 ? 0.35 : 1 }}><ArrowDown size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tab2 承保范围 ───────────────────────────────── */}
      {tab === 'coverages' && (
        <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t('tabs.coverages')} · {coverages.length}</span>
            <button
              onClick={() => setFormTarget({ kind: 'coverage', mode: 'create' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: C.okBg, color: C.ok, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={13} /> {t('actions.createCoverage')}
            </button>
          </div>
          {coverages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.sub, fontSize: 13 }}>{t('empty.list')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th(180)}>{t('columns.code')}</th>
                  <th style={th()}>{t('columns.nameZh')}</th>
                  <th style={th()}>{t('columns.nameEn')}</th>
                  <th style={th(90)}>{t('columns.status')}</th>
                  <th style={th(110)}>{t('columns.productCount')}</th>
                  <th style={th(190)}>{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {coverages.map((c, i) => (
                  <tr key={c.code} style={{ opacity: c.status === 'disabled' ? 0.55 : 1 }}>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{c.code}</td>
                    <td style={td}>{c.nameZh}</td>
                    <td style={td}>{c.nameEn}</td>
                    <td style={td}><StatusBadge status={c.status} t={t} /></td>
                    <td style={td}>{c.productCount ?? 0}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <IconBtn title={t('actions.edit')} onClick={() => setFormTarget({ kind: 'coverage', mode: 'edit', cov: c })} />
                        <button onClick={() => askToggle(c, (n) => toggleCoverage(c, n))} style={{ padding: '2px 8px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: C.text }}>
                          {c.status === 'active' ? t('actions.disable') : t('actions.enable')}
                        </button>
                        <span title={(c.productCount ?? 0) > 0 ? t('errors.DICT_IN_USE') : undefined}>
                          <IconBtn title={t('actions.delete')} danger disabled={(c.productCount ?? 0) > 0} onClick={() => askDeleteCoverage(c)} />
                        </span>
                        <button onClick={() => moveItem(coverages, i, -1, (a) => dictionaryService.updateCoverage(c.code, a), fetchCoverages)} title={t('actions.moveUp')} disabled={i === 0} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: i === 0 ? 'default' : 'pointer', color: C.sub, opacity: i === 0 ? 0.35 : 1 }}><ArrowUp size={13} /></button>
                        <button onClick={() => moveItem(coverages, i, 1, (a) => dictionaryService.updateCoverage(c.code, a), fetchCoverages)} title={t('actions.moveDown')} disabled={i === coverages.length - 1} style={{ padding: 4, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', cursor: i === coverages.length - 1 ? 'default' : 'pointer', color: C.sub, opacity: i === coverages.length - 1 ? 0.35 : 1 }}><ArrowDown size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab3 适用范围矩阵 ───────────────────────────── */}
      {tab === 'matrix' && (
        <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              {t('tabs.matrix')}
              {tree && <span style={{ fontSize: 11, color: C.sub, marginLeft: 8, fontWeight: 400 }}>v {tree.version.slice(0, 19).replace('T', ' ')}</span>}
            </span>
            <button
              onClick={saveAllRows}
              disabled={!Object.values(dirty).some(Boolean)}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#0058BC,#0070EB)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: Object.values(dirty).some(Boolean) ? 'pointer' : 'not-allowed', opacity: Object.values(dirty).some(Boolean) ? 1 : 0.4 }}
            >
              {t('actions.saveAll')}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...th(160), position: 'sticky', left: 0, background: '#fff' }}>{t('columns.nameZh')}</th>
                  {(tree?.allCoverages ?? []).map((c) => (
                    <th key={c.code} style={{ ...th(110), textAlign: 'center' }} title={c.code}>{pickName(c)}</th>
                  ))}
                  <th style={th(100)}>{t('matrix.selectedCol')}</th>
                  <th style={th(140)}>{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {treeLines.map((l) => {
                  const set = rel[l.code] ?? new Set<string>();
                  const warns = warnings[l.code] ?? [];
                  return (
                    <tr key={l.code}>
                      <td style={{ ...td, position: 'sticky', left: 0, background: '#fff', fontWeight: 600 }}>
                        {pickName(l)}
                        <div style={{ fontSize: 10, color: C.sub, fontFamily: 'monospace' }}>{l.code}</div>
                      </td>
                      {(tree?.allCoverages ?? []).map((c) => (
                        <td key={c.code} style={{ ...td, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={set.has(c.code)}
                            onChange={() => toggleCell(l.code, c.code)}
                            style={{ cursor: 'pointer', width: 15, height: 15, accentColor: C.primary }}
                          />
                        </td>
                      ))}
                      <td style={{ ...td, fontSize: 12, color: C.sub }}>{t('matrix.selected', { n: set.size, total: allCoverageCodes.length })}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <button onClick={() => rowSelectAll(l.code, true)} style={{ padding: '3px 8px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: C.text }}>{t('matrix.selectAll')}</button>
                          <button onClick={() => rowSelectAll(l.code, false)} style={{ padding: '3px 8px', borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: C.text }}>{t('matrix.clearAll')}</button>
                          <button
                            onClick={() => saveRow(l.code)}
                            disabled={!dirty[l.code]}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 6, border: 'none', background: dirty[l.code] ? C.okBg : 'transparent', color: C.ok, fontSize: 11, fontWeight: 700, cursor: dirty[l.code] ? 'pointer' : 'default' }}
                          >
                            {dirty[l.code] ? <Check size={12} /> : null}{dirty[l.code] ? t('actions.save') : ''}
                          </button>
                        </div>
                        {warns.length > 0 && (
                          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 6, background: C.warnBg, color: C.warn, fontSize: 11, lineHeight: 1.5, maxWidth: 360 }}>
                            {warns.map((w) => (
                              <div key={w.code}>⚠ {t('matrix.usageWarning', { count: w.count })}（{w.code}）</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 弹窗们 */}
      {formTarget && (() => {
        const editingItem: FormInitial | undefined = formTarget.mode === 'edit'
          ? (formTarget.kind === 'line'
            ? formTarget.line
            : formTarget.kind === 'sub-line' ? formTarget.sub : formTarget.cov)
          : undefined;
        return (
          <FormModal
            title={
              formTarget.kind === 'line'
                ? (formTarget.mode === 'create' ? t('actions.createLine') : t('actions.edit'))
                : formTarget.kind === 'sub-line'
                  ? (formTarget.mode === 'create' ? t('actions.createSubLine') : t('actions.edit'))
                  : (formTarget.mode === 'create' ? t('actions.createCoverage') : t('actions.edit'))
            }
            codeTip={
              formTarget.kind === 'line' ? t('fields.codeTipLine')
                : formTarget.kind === 'sub-line' ? t('fields.codeTipSubLine')
                  : t('fields.codeTipCoverage')
            }
            editing={formTarget.mode === 'edit'}
            initial={editingItem}
            onSubmit={handleFormSubmit}
            onClose={() => setFormTarget(null)}
          />
        );
      })()}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          needAck={confirmState.needAck}
          okText={confirmState.okText}
          onConfirm={() => { confirmState.action().catch(() => showToast(t('errors.network'))); }}
          onClose={() => setConfirmState(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(24,28,35,0.9)', color: '#fff', padding: '9px 18px', borderRadius: 999, fontSize: 13, zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
      {loading && <div style={{ position: 'fixed', bottom: 20, right: 24, fontSize: 12, color: C.sub }}>…</div>}
    </div>
  );
}
