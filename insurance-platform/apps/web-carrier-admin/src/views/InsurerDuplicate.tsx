import { useState } from 'react';
import { ArrowLeft, Search, RefreshCw, GitMerge, CheckCircle, X, AlertTriangle, Eye, ArrowRight, Shield } from 'lucide-react';
import type { ViewId } from '@/App';

interface Props {
  navigateTo: (view: ViewId, params?: any) => void;
}

// Mock duplicate groups data
const DUPLICATE_GROUPS = [
  {
    id: 'g1',
    similarity: 0.98,
    matchFields: ['NAIC 编码', '公司名称'],
    records: [
      {
        id: 'r1-1',
        name: 'Chubb Limited',
        shortName: 'Chubb',
        naicCode: '11234',
        type: 'Admitted',
        headquarters: 'New York, NY',
        status: 'active',
        createdAt: '2024-01-15',
        createdBy: 'Admin User'
      },
      {
        id: 'r1-2',
        name: 'Chubb Insurance Company',
        shortName: 'Chubb Inc.',
        naicCode: '11234',
        type: 'Admitted',
        headquarters: 'New York, NY',
        status: 'active',
        createdAt: '2024-03-20',
        createdBy: 'Data Importer'
      }
    ]
  },
  {
    id: 'g2',
    similarity: 0.87,
    matchFields: ['总部州', '公司类型'],
    records: [
      {
        id: 'r2-1',
        name: 'Travelers Property Casualty Corp',
        shortName: 'Travelers',
        naicCode: '23456',
        type: 'Admitted',
        headquarters: 'Hartford, CT',
        status: 'active',
        createdAt: '2023-11-05',
        createdBy: 'System'
      },
      {
        id: 'r2-2',
        name: 'Travelers Insurance Company LLC',
        shortName: 'Travelers LLC',
        naicCode: '23789',
        type: 'Admitted',
        headquarters: 'Hartford, CT',
        status: 'pending',
        createdAt: '2024-02-10',
        createdBy: 'External Feed'
      }
    ]
  },
  {
    id: 'g3',
    similarity: 0.92,
    matchFields: ['NAIC 编码', '大区'],
    records: [
      {
        id: 'r3-1',
        name: 'Liberty Mutual Insurance',
        shortName: 'Liberty Mutual',
        naicCode: '34567',
        type: 'Admitted',
        headquarters: 'Boston, MA',
        status: 'active',
        createdAt: '2024-01-08',
        createdBy: 'API Sync'
      },
      {
        id: 'r3-2',
        name: 'Liberty Mutual Insurance Group',
        shortName: 'Liberty Mutual Group',
        naicCode: '34567',
        type: 'Admitted',
        headquarters: 'Boston, MA',
        status: 'active',
        createdAt: '2024-04-15',
        createdBy: 'Data Importer'
      }
    ]
  }
];

type GroupStatus = 'unresolved' | 'merged' | 'dismissed';

export default function InsurerDuplicate({ navigateTo }: Props) {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(true);
  const [selected, setSelected] = useState<string | null>(DUPLICATE_GROUPS[0].id);
  const [groupStatus, setGroupStatus] = useState<Record<string, GroupStatus>>({});
  const [primaryRecord, setPrimaryRecord] = useState<Record<string, string>>({});

  const startDetect = () => {
    setDetecting(true);
    setTimeout(() => { setDetecting(false); setDetected(true); }, 1800);
  };

  const currentGroup = DUPLICATE_GROUPS.find(g => g.id === selected);
  const currentPrimary = selected ? (primaryRecord[selected] ?? currentGroup?.records[0]?.id) : null;

  const markMerge = (groupId: string) => {
    setGroupStatus(p => ({ ...p, [groupId]: 'merged' }));
    const next = DUPLICATE_GROUPS.find(g => g.id !== groupId && !groupStatus[g.id]);
    if (next) setSelected(next.id);
  };

  const dismiss = (groupId: string) => {
    setGroupStatus(p => ({ ...p, [groupId]: 'dismissed' }));
    const next = DUPLICATE_GROUPS.find(g => g.id !== groupId && !groupStatus[g.id]);
    if (next) setSelected(next.id);
  };

  const unresolved = DUPLICATE_GROUPS.filter(g => !groupStatus[g.id] || groupStatus[g.id] === 'unresolved');
  const resolved = DUPLICATE_GROUPS.filter(g => groupStatus[g.id] && groupStatus[g.id] !== 'unresolved');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigateTo('insurer-list')}><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>重复数据检测</h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>按 NAIC 编码与公司名称自动识别潜在重复记录，支持并排对比和一键合并</p>
          </div>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={startDetect} disabled={detecting}>
          {detecting
            ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />检测中…</>
            : <><RefreshCw size={14} />重新检测</>
          }
        </button>
      </div>

      {!detected ? (
        /* Not yet run */
        <div className="card" style={{ padding: '72px 40px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,88,188,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Search size={32} style={{ color: '#0058BC' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>启动重复数据检测</h2>
          <p style={{ fontSize: 14, color: '#717786', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
            系统将基于 NAIC 编码精确匹配和公司名称模糊匹配，识别可能重复的保险公司记录，支持并排对比和一键合并。
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 28 }}>
            {[
              { label: 'NAIC 编码精确匹配', desc: '相同 5 位 NAIC 编码' },
              { label: '公司名称模糊匹配', desc: '相似度 > 80%' },
              { label: '总部信息匹配', desc: '相同州 + 城市' },
            ].map(c => (
              <div key={c.label} style={{ background: 'rgba(241,243,254,0.8)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', maxWidth: 160 }}>
                <CheckCircle size={16} style={{ color: '#0058BC', marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: '#717786' }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ fontSize: 14, padding: '11px 32px' }} onClick={startDetect}>
            <Search size={14} />开始检测
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Left: group list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>重复记录组</div>
              <div className="flex gap-1">
                {unresolved.length > 0 && <span className="badge badge-red" style={{ fontSize: 10.5 }}>{unresolved.length} 待处理</span>}
                {resolved.length > 0 && <span className="badge badge-green" style={{ fontSize: 10.5 }}>{resolved.length} 已解决</span>}
              </div>
            </div>
            <div>
              {DUPLICATE_GROUPS.map(group => {
                const st = groupStatus[group.id];
                const isActive = selected === group.id;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelected(group.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '0.5px solid rgba(193,198,215,0.3)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(0,88,188,0.08)' : 'transparent',
                      transition: 'background 120ms',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0058BC' : '#181C23' }}>
                        {group.records[0].shortName} × {group.records[1].shortName}
                      </div>
                      {st === 'merged' && <span className="badge badge-green" style={{ fontSize: 10 }}>已合并</span>}
                      {st === 'dismissed' && <span className="badge badge-gray" style={{ fontSize: 10 }}>已忽略</span>}
                      {!st && <span className="badge badge-red" style={{ fontSize: 10 }}>待处理</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${group.similarity * 100}%`, background: group.similarity > 0.9 ? '#BA1A1A' : '#FFCC00', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: group.similarity > 0.9 ? '#BA1A1A' : '#a05800', fontWeight: 600 }}>
                        {(group.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 4 }}>
                      {group.matchFields.slice(0, 2).join(' · ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: comparison */}
          {currentGroup ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Group header */}
              <div style={{ padding: '16px 22px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(241,243,254,0.5)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>
                      相似度 <span style={{ color: currentGroup.similarity > 0.9 ? '#BA1A1A' : '#a05800', fontFamily: "'JetBrains Mono', monospace" }}>{(currentGroup.similarity * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#717786' }}>
                      匹配依据：{currentGroup.matchFields.join(' · ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" style={{ fontSize: 13, color: '#717786' }} onClick={() => dismiss(currentGroup.id)}>
                      <X size={14} />标记非重复
                    </button>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 13, background: '#0058BC' }}
                      onClick={() => markMerge(currentGroup.id)}
                      disabled={!currentPrimary}
                    >
                      <GitMerge size={14} />合并记录
                    </button>
                  </div>
                </div>
              </div>

              {/* Select primary */}
              <div style={{ padding: '14px 22px', borderBottom: '0.5px solid rgba(193,198,215,0.3)', background: 'rgba(0,88,188,0.03)' }}>
                <span style={{ fontSize: 12.5, color: '#414755', fontWeight: 500 }}>
                  选择主记录（保留的记录）：
                </span>
                {currentGroup.records.map(r => (
                  <label key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 16, cursor: 'pointer' }}>
                    <input type="radio" name="primary" value={r.id} checked={currentPrimary === r.id}
                      onChange={() => setPrimaryRecord(p => ({ ...p, [currentGroup.id]: r.id }))}
                      style={{ accentColor: '#0058BC' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: currentPrimary === r.id ? '#0058BC' : '#181C23' }}>{r.shortName}</span>
                    {r.status === 'active' && <span className="orb orb-green" />}
                  </label>
                ))}
              </div>

              {/* Side-by-side comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {currentGroup.records.map((rec, i) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '22px 24px',
                      borderRight: i === 0 ? '0.5px solid rgba(193,198,215,0.4)' : 'none',
                      background: currentPrimary === rec.id ? 'rgba(0,88,188,0.04)' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {currentPrimary === rec.id && (
                      <div style={{ position: 'absolute', top: 14, right: 14 }}>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}><Shield size={10} />主记录</span>
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>{rec.name}</div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {rec.status === 'active'
                          ? <span className="flex items-center gap-1.5"><span className="orb orb-green" />合作中</span>
                          : <span className="flex items-center gap-1.5"><span className="orb orb-yellow" />待审核</span>
                        }
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        ['公司简称', rec.shortName],
                        ['NAIC 编码', rec.naicCode],
                        ['公司类型', rec.type],
                        ['总部', rec.headquarters],
                        ['创建时间', rec.createdAt],
                        ['创建人', rec.createdBy],
                      ].map(([label, value]) => {
                        const other = currentGroup.records.find(r => r.id !== rec.id);
                        const isDiff = other && (other as any)[Object.keys(other).find(k => (other as any)[k] === value) ?? ''] !== value;
                        return (
                          <div key={label} style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(193,198,215,0.3)' }}>
                            <div style={{ fontSize: 11, color: '#717786', marginBottom: 3 }}>{label}</div>
                            <div style={{ fontSize: 13.5, color: '#181C23', fontFamily: ['NAIC 编码', '创建时间'].includes(label as string) ? "'JetBrains Mono', monospace" : undefined, fontWeight: 500 }}>
                              {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {currentPrimary !== rec.id && (
                      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(186,26,26,0.06)', borderRadius: 10, border: '0.5px solid rgba(186,26,26,0.15)' }}>
                        <div style={{ fontSize: 12, color: '#BA1A1A', fontWeight: 500 }}>
                          合并后此记录将被删除
                        </div>
                        <div style={{ fontSize: 11.5, color: '#717786', marginTop: 3 }}>
                          关联数据将迁移至主记录
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '16px 22px', borderTop: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(241,243,254,0.4)', display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ fontSize: 13 }}><Eye size={14} />查看完整记录</button>
                <button
                  onClick={() => markMerge(currentGroup.id)}
                  className="btn-primary"
                  style={{ fontSize: 13, marginLeft: 'auto' }}
                  disabled={!currentPrimary}
                >
                  <GitMerge size={14} />以「{currentGroup.records.find(r => r.id === currentPrimary)?.shortName ?? '—'}」为主记录合并
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <CheckCircle size={40} style={{ color: '#34C759', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>所有重复记录已处理</div>
              <p style={{ fontSize: 13.5, color: '#717786' }}>共处理 {resolved.length} 组，已合并或标记为非重复</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
