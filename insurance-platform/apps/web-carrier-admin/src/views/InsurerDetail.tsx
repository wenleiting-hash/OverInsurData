import { useState } from 'react';
import {
  ArrowLeft, Edit2, StopCircle, PlayCircle, Download, ExternalLink,
  Building2, MapPin, Globe, Calendar, Star, Phone, Mail, Briefcase,
  TrendingUp, TrendingDown, Package, Users, DollarSign, ShieldCheck,
  Upload, Eye, Trash2, Clock, CheckCircle, AlertTriangle, MoreHorizontal,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { insurers } from './data/mockDashboardData';
import { products, channels, documents, changeHistory } from './data/insurerDetails';
import { premiumTrendData, marketShareData } from './data/mockDashboardData';
import type { ViewId } from '@/App';

interface Props {
  carrierId: string;
  navigateTo: (view: ViewId, params?: any) => void;
}

const TABS = [
  { id: 'info', label: '基本信息' },
  { id: 'ratings', label: '财务评级' },
  { id: 'products', label: '关联产品' },
  { id: 'channels', label: '合作渠道' },
  { id: 'performance', label: '业绩概览' },
  { id: 'documents', label: '资质附件' },
  { id: 'history', label: '变更历史' },
];

const sectionBg = 'rgba(255,255,255,0.7)';
const sectionBorder = '0.5px solid rgba(193,198,215,0.5)';
const fieldLabel = { fontSize: 12 as const, color: '#717786' as const, fontWeight: 500 as const, marginBottom: 4 };
const fieldValue = { fontSize: 14 as const, color: '#181C23' as const, fontWeight: 500 as const };

const RATING_COLOR: Record<string, string> = {
  'A++': '#1a7a2e', 'A+': '#1a7a2e', 'A': '#0058BC', 'A-': '#0058BC',
  'B++': '#7a5c00', 'B+': '#7a5c00',
};

const lossData = [
  { month: 'Mar', ratio: 61.2 }, { month: 'Apr', ratio: 60.8 }, { month: 'May', ratio: 63.1 },
  { month: 'Jun', ratio: 61.5 }, { month: 'Jul', ratio: 59.8 }, { month: 'Aug', ratio: 62.2 },
];

const DOC_TYPE_COLOR: Record<string, string> = {
  '主合作协议': 'badge-blue',
  '保密协议 (NDA)': 'badge-gray',
  '数据处理协议 (DPA)': 'badge-purple',
  '评级报告': 'badge-yellow',
  '州营业执照': 'badge-green',
  '佣金补充协议': 'badge-orange',
};

export default function CarrierDetail({ carrierId, navigateTo }: Props) {
  const [activeTab, setActiveTab] = useState('info');
  
  const findCarrier = (id: string) => insurers.find(i => i.carrierId === id) || insurers[0];
  const carrier = findCarrier(carrierId);
  
  const carrierProducts = products.filter(p => p.insurerId === carrierId);
  const carrierChannels = channels.filter(c => !c.parentId).slice(0, 5);
  const carrierDocs = documents.filter(d => d.insurerId === carrierId);
  const carrierHistory = changeHistory.filter(h => h.insurerId === carrierId);
  
  const coopColors: Record<string, string> = { 
    active: '#1a7a2e', 
    expiring: '#a05800', 
    negotiating: '#0058BC', 
    terminated: '#BA1A1A' 
  };
  const coopLabels: Record<string, string> = { 
    active: '正常', 
    expiring: '即将到期', 
    negotiating: '洽谈中', 
    terminated: '已终止' 
  }

  const formatFileSize = (kb: number): string => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Back + Actions Bar */}
      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
          <ArrowLeft size={15} /> 返回列表
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={14} /> 导出 PDF
          </button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-edit', { carrierId })}>
            <Edit2 size={14} /> 编辑
          </button>
        </div>
      </div>

      {/* Company Header Card */}
      <div className="glass-strong" style={{ 
        borderRadius: 20, 
        padding: '24px 28px', 
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24 
      }}>
        {/* Logo Placeholder */}
        <div style={{
          width: 72, 
          height: 72, 
          borderRadius: 18, 
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 60%, #60CDFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,88,188,0.28)',
        }}>
          {carrier.shortName.slice(0, 2).toUpperCase()}
        </div>

        {/* Identity */}
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#181C23' }}>{carrier.carrierName}</h1>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: RATING_COLOR[carrier.amBestRating || ''] ?? '#414755',
              background: 'rgba(0,88,188,0.07)',
              padding: '3px 10px',
              borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              AM Best {carrier.amBestRating || '-'}
            </span>
            <span className={`badge ${carrier.status === 'active' ? 'badge-green' : carrier.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
              <span className={`orb ${carrier.status === 'active' ? 'orb-green' : carrier.status === 'pending' ? 'orb-yellow' : 'orb-gray'}`} />
              {carrier.status === 'active' ? '合作中' : carrier.status === 'pending' ? '待审核' : '已停用'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: '#414755', marginBottom: 16 }}>
            <span className="flex items-center gap-1.5"><Building2 size={13} />NAIC {carrier.naicCode}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} />{carrier.region || '-'}</span>
            <span className="flex items-center gap-1.5"><Globe size={13} />website.com</span>
            <span className="flex items-center gap-1.5">
              <span className={`badge ${carrier.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>{carrier.type}</span>
            </span>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: '总保费', value: `$${((carrier.revenue ?? 0) / 1000000000).toFixed(1)}B`, sub: '本年' },
              { label: '保单数', value: (carrier.policyCount ?? 0).toLocaleString(), sub: '有效保单' },
              { label: '赔付率', value: `${((carrier.lossRatio ?? 0) * 100).toFixed(1)}%`, sub: (carrier.lossRatio ?? 0) > 0.65 ? '⚠ 超预警' : '正常', warn: (carrier.lossRatio ?? 0) > 0.65 },
              { label: '续保率', value: `${((carrier.renewalRate ?? 0) * 100).toFixed(1)}%`, sub: '本年' },
              { label: '合作渠道', value: '12', sub: '个渠道' },
              { label: '产品数量', value: '8', sub: '个产品' },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(236,237,249,0.6)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? '#BA1A1A' : '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: k.warn ? '#BA1A1A' : '#717786', marginTop: 2 }}>
                  {k.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coop status badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>合作状态</div>
          <div className="flex items-center gap-1.5 justify-end" style={{ marginBottom: 12 }}>
            <span className={`orb orb-${carrier.status === 'active' ? 'green' : carrier.status === 'pending' ? 'yellow' : 'gray'}`} />
            <span style={{ fontSize: 14, fontWeight: 600, color: coopColors[carrier.status] }}>{coopLabels[carrier.status]}</span>
          </div>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>合同到期</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>2026-12-31</div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 24px' }}>
          {TABS.map(t => (
            <div key={t.id} className={`tab-item${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.id === 'history' && carrierHistory.length > 0 && (
                <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{carrierHistory.length}</span>
              )}
              {t.id === 'documents' && carrierDocs.some(d => d.status === 'expiring') && (
                <span className="badge badge-yellow" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>!</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          
          {/* ─── 基本信息 Tab ─── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Basic Info */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} style={{ color: '#0058BC' }} />公司基本信息
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['公司全称', carrier.carrierName],
                      ['公司简称', carrier.shortName],
                      ['NAIC 编码', carrier.naicCode],
                      ['公司类型', carrier.type],
                      ['成立年份', '2005'],
                      ['官方网站', 'www.company.com'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={{ ...fieldValue, fontFamily: ['NAIC 编码'].includes(label) ? "'JetBrains Mono', monospace" : undefined }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* HQ */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#0058BC' }} />总部信息
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['总部地址', 'New York, NY'],
                      ['所在州', 'New York'],
                      ['大区', carrier.region || 'National'],
                      ['业务线', 'AUTO, HOME, HEALTH'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={fieldValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Settlement */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={14} style={{ color: '#0058BC' }} />结算配置
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['结算周期', carrier.settlementCycle === 'Monthly' ? '月度结算' : '季度结算'],
                      ['账单格式', 'API 自动拉取'],
                      ['账单截止日', '每月 25 日'],
                      ['支付周期', '月后 15 个工作日'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={fieldValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contact */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: '#0058BC' }} />联系信息
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['联系人', 'John Smith'],
                      ['职位', 'Partnership Manager'],
                      ['电话', '+1 (555) 123-4567'],
                      ['邮箱', 'john.smith@company.com'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={fieldLabel}>{label}</div>
                        <div style={fieldValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ─── 财务评级 Tab ─── */}
          {activeTab === 'ratings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>当前评级</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    ['AM Best', carrier.amBestRating || '未评级', '行业权威评级机构'],
                    ['S&P', 'AA-', '标准普尔评级'],
                    ['Moody\'s', 'A2', '穆迪评级'],
                    ['Fitch', 'AA', '惠誉评级'],
                  ].map(([agency, rating, desc]) => (
                    <div key={agency} style={{ padding: 12, background: 'rgba(255,255,255,0.6)', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>{agency} - {desc}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: RATING_COLOR[rating || ''] ?? '#414755' }}>
                        {rating || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>评级趋势</div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lossData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="ratio" stroke="#0058BC" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* ─── 合作渠道 Tab ─── */}
          {activeTab === 'channels' && (
            <div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>渠道名称</th>
                    <th>类型</th>
                    <th>州</th>
                    <th>佣金率</th>
                    <th>状态</th>
                    <th>协议日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierChannels.map(channel => (
                    <tr key={channel.channelId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{channel.name}</div>
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{channel.shortName}</div>
                      </td>
                      <td>{channel.type}</td>
                      <td>{channel.state}</td>
                      <td><span className="font-data">{(channel.commissionRate * 100).toFixed(1)}%</span></td>
                      <td>
                        <span className={`badge ${channel.status === 'active' ? 'badge-green' : channel.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
                          {channel.status === 'active' ? '活跃' : channel.status === 'pending' ? '审核中' : '停用'}
                        </span>
                      </td>
                      <td>{channel.agreementDate}</td>
                      <td>
                        <button className="btn-ghost" style={{ padding: 5 }}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* ─── 资质附件 Tab ─── */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>共 {carrierDocs.length} 个文件</h3>
                <button className="btn-secondary">
                  <Upload size={14} /> 上传文件
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>发布日期</th>
                    <th>到期日期</th>
                    <th>文件大小</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierDocs.map(doc => (
                    <tr key={doc.documentId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} style={{ color: '#0058BC' }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{doc.name}</div>
                            <div style={{ fontSize: 11.5, color: '#717786' }}>ID: {doc.documentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${DOC_TYPE_COLOR[doc.type] || 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {doc.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${doc.status === 'valid' ? 'badge-green' : doc.status === 'expiring' ? 'badge-yellow' : 'badge-red'}`}>
                          {doc.status === 'valid' ? '有效' : doc.status === 'expiring' ? '即将到期' : '已过期'}
                        </span>
                      </td>
                      <td>{doc.issueDate}</td>
                      <td>{doc.expiryDate}</td>
                      <td><span className="font-data">{formatFileSize(doc.fileSize)}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost" style={{ padding: 5 }} title="预览"><Eye size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title="下载"><Download size={14} /></button>
                          <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} title="删除"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* ─── 变更历史 Tab ─── */}
          {activeTab === 'history' && (
            <div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th width="200">字段</th>
                    <th>旧值</th>
                    <th>新值</th>
                    <th>操作人</th>
                    <th>变更日期</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierHistory.map(hist => (
                    <tr key={hist.historyId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock size={14} style={{ color: '#717786' }} />
                          <span style={{ fontWeight: 500 }}>{hist.field}</span>
                        </div>
                      </td>
                      <td><span className="font-data" style={{ color: '#BA1A1A' }}>{hist.oldValue ?? '-'}</span></td>
                      <td><span className="font-data" style={{ color: '#1a7a2e', fontWeight: 600 }}>{hist.newValue}</span></td>
                      <td>{hist.changedBy}</td>
                      <td>{new Date(hist.changedAt).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── 关联产品 Tab ─── */}
          {activeTab === 'products' && (
            <div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>产品名称</th>
                    <th>产品代码</th>
                    <th>业务线</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>生效日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierProducts.map(product => (
                    <tr key={product.productId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{product.shortName}</div>
                      </td>
                      <td><span className="font-data">{product.code}</span></td>
                      <td>{product.lob}</td>
                      <td>{product.type}</td>
                      <td>
                        <span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                          {product.status === 'active' ? '启用' : '停用'}
                        </span>
                      </td>
                      <td>{product.effectiveDate}</td>
                      <td>
                        <button className="btn-ghost" style={{ padding: 5 }}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── 业绩概览 Tab ─── */}
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Revenue Trend */}
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} style={{ color: '#0058BC' }} />保费趋势（本年）
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={premiumTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.4)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + 'M'} width={42} />
                      <Tooltip formatter={(v: any) => [v + 'M', '保费']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="newBiz" stroke="#34C759" strokeWidth={2} dot={{ r: 3, fill: '#34C759' }} name="新业务" />
                      <Line type="monotone" dataKey="renewal" stroke="#0058BC" strokeWidth={2} dot={{ r: 3, fill: '#0058BC' }} name="续保" />
                      <Line type="monotone" dataKey="premium" stroke="#9E3D00" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#9E3D00' }} name="总计" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Channel Contribution + Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Channel Market Share */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>渠道保费贡献占比</div>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marketShareData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(193,198,215,0.3)" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#717786' }} hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#717786' }} width={72} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                        <Tooltip cursor={{ fill: 'rgba(0,88,188,0.05)' }} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                        {marketShareData.map((m, i) => (
                          <Cell key={i} fill={m.color} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Performance Metrics */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>核心绩效指标</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: '本年累计保费', value: '$219.2M', trend: '+12.8%', positive: true },
                      { label: '新保单增长', value: '+18.5%', trend: '+8.2%', positive: true },
                      { label: '平均保单价值', value: '$1,458', trend: '-3.1%', positive: false },
                      { label: '客户留存率', value: '91.8%', trend: '+4.5%', positive: true },
                      { label: '获客成本', value: '$182', trend: '-12.5%', positive: true },
                    ].map(k => (
                      <div key={k.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 12.5, color: '#181C23', fontWeight: 500 }}>{k.label}</div>
                          <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>同比{k.positive ? '✓' : '✗'}{k.trend}</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: k.positive ? '#1a7a2e' : '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>
                          {k.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Loss Ratio Ranking */}
              <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>产品赔付率排名</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th style={{ textAlign: 'right' }}>总保费</th>
                      <th style={{ textAlign: 'right' }}>赔款额</th>
                      <th style={{ textAlign: 'right' }}>赔付率</th>
                      <th>风险等级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['个人汽车险', '家庭财产险', '团体健康险', '商业责任险', '意外险'].map((productName, i) => (
                      <tr key={i}>
                        <td><span style={{ fontWeight: 500 }}>{productName}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${(Math.random() * 50).toFixed(1)}M</td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${(Math.random() * 30).toFixed(1)}M</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            fontFamily: "'JetBrains Mono', monospace",
                            color: i === 0 ? '#BA1A1A' : i <= 2 ? '#FF9500' : '#34C759'
                          }}>{(55 + Math.random() * 15).toFixed(1)}%</span>
                        </td>
                        <td>
                          <span className={`badge ${i === 0 ? 'badge-red' : i <= 2 ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 11 }}>
                            {i === 0 ? '高风险' : i <= 2 ? '中风险' : '低风险'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
