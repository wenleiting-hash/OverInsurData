import { useState } from 'react';
import { ArrowLeft, Edit2, StopCircle, PlayCircle, Download } from 'lucide-react';
import type { InsuranceCarrier } from '@/types/carrier';
import type { ViewId } from '@/App';
import insurerData from './data/insurerMasterData';

interface Props {
  carrierId: string;
  navigateTo: (view: ViewId) => void;
}

const TABS = [
  { id: 'info', label: '基本信息' },
  { id: 'ratings', label: '信用评级' },
  { id: 'products', label: '关联产品' },
  { id: 'performance', label: '业绩概览' },
];

// Section styles
const sectionBg = 'rgba(255,255,255,0.7)';
const sectionBorder = '0.5px solid rgba(193,198,215,0.5)';

// Rating colors
const RATING_COLOR: Record<string, string> = {
  'A++': '#1a7a2e', 'A+': '#1a7a2e', 
  'A': '#0058BC', 'A-': '#0058BC',
  'B+': '#7a5c00', 'B': '#7a5c00',
};

export default function CarrierDetail({ carrierId, navigateTo }: Props) {
  const [activeTab, setActiveTab] = useState('info');
  
  // Find carrier by ID or use first one for demo
  const carrier = carrierId === 'new' ? null : insurerData.find(c => c.carrierId === carrierId);
  const isEditMode = !carrier;

  // Sample loss ratio data
  const lossData = [
    { month: 'Mar', ratio: 61.2 }, { month: 'Apr', ratio: 60.8 }, 
    { month: 'May', ratio: 63.1 }, { month: 'Jun', ratio: 61.5 }, 
    { month: 'Jul', ratio: 59.8 }, { month: 'Aug', ratio: 62.2 },
  ];

  const handleDisable = () => {
    if (!carrier) return;
    alert(`${carrier.carrierName}: ${carrier.status === 'active' ? '停用' : '启用'} 功能待实现`);
  };

  if (isEditMode) {
    // New Carrier Form Mode - Simplified
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div className="flex items-center justify-between mb-6">
          <button className="btn-ghost" onClick={() => navigateTo('insurer-list')}>
            <ArrowLeft size={15} />返回列表
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary">
              <Download size={14} />保存草稿
            </button>
            <button className="btn-primary" onClick={() => {}}>
              提交审核
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#181C23] mb-6">新增保险公司</h1>

        {/* Tabs */}
        <div className="card overflow-hidden mb-6">
          <div className="flex tab-bar">
            {TABS.map(tab => (
              <div 
                key={tab.id} 
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {/* Basic Info Tab */}
            {activeTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Basic Info Section */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 12, padding: 16 }}>
                  <h3 className="font-semibold text-[#181C23] mb-4 text-sm">公司基本信息</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">公司代码 *</label>
                      <input type="text" className="input-glass" placeholder="自动生成或手动输入" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">NAIC 编码 *</label>
                      <input type="text" className="input-glass" placeholder="例如：12345" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="block text-xs text-[#717786] mb-1">公司全称 *</label>
                      <input type="text" className="input-glass" placeholder="Insurance Company Name" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">公司简称</label>
                      <input type="text" className="input-glass" placeholder="Short Name" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">公司类型 *</label>
                      <select className="input-glass">
                        <option value="">请选择</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Non-Admitted">Non-Admitted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">状态 *</label>
                      <select className="input-glass">
                        <option value="pending">待审核</option>
                        <option value="active">正常</option>
                        <option value="inactive">已停用</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">AM Best 评级</label>
                      <select className="input-glass">
                        <option value="">未评级</option>
                        <option value="A++">A++</option>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Contact Info Section */}
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 12, padding: 16 }}>
                  <h3 className="font-semibold text-[#181C23] mb-4 text-sm">联系信息</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="block text-xs text-[#717786] mb-1">总部地址</label>
                      <textarea className="input-glass" rows={2} placeholder="完整地址" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">联系电话</label>
                      <input type="tel" className="input-glass" placeholder="+1 (xxx) xxx-xxxx" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#717786] mb-1">电子邮箱</label>
                      <input type="email" className="input-glass" placeholder="contact@company.com" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Other tabs would go here */}
            {activeTab !== 'info' && (
              <div className="text-center py-12 text-[#717786]">
                <p>此功能模块正在开发中...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detail View Mode
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button className="btn-ghost" onClick={() => navigateTo('insurers')}>
          <ArrowLeft size={15} />返回列表
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Download size={14} />导出 PDF
          </button>
          {carrier.status === 'active' ? (
            <button className="btn-ghost" style={{ color: '#BA1A1A' }} onClick={handleDisable}>
              <StopCircle size={14} />停用
            </button>
          ) : (
            <button className="btn-ghost" style={{ color: '#1a7a2e' }} onClick={handleDisable}>
              <PlayCircle size={14} />启用
            </button>
          )}
          <button className="btn-primary" onClick={() => navigateTo('insurer-list')}>
            <Edit2 size={14} />编辑
          </button>
        </div>
      </div>

      {/* Company Header */}
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
          width: 72, height: 72,
          borderRadius: 18,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 60%, #60CDFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
        }}>
          {carrier.shortName?.slice(0, 2).toUpperCase()}
        </div>

        {/* Identity */}
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#181C23]">{carrier.carrierName}</h1>
            {carrier.rating && (
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: RATING_COLOR[carrier.rating] ?? '#414755',
                background: 'rgba(0,88,188,0.07)',
                padding: '3px 10px',
                borderRadius: 999,
              }}>
                AM Best {carrier.rating}
              </span>
            )}
            <span className={`badge ${carrier.status === 'active' ? 'badge-green' : carrier.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
              {carrier.status === 'active' ? '合作中' : carrier.status === 'pending' ? '待审核' : '已停用'}
            </span>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: '总保费', value: `$${(carrier.revenue ?? 0).toLocaleString()}`, sub: '本年' },
              { label: '保单数', value: (carrier.policyCount ?? 0).toLocaleString(), sub: '有效保单' },
              { label: '赔付率', value: `${((carrier.lossRatio ?? 0) * 100).toFixed(1)}%`, sub: carrier.lossRatio && carrier.lossRatio > 0.65 ? '⚠ 超预警' : '正常' },
              { label: '续保率', value: `${((carrier.renewalRate ?? 0) * 100).toFixed(1)}%`, sub: '本年' },
              { label: '产品数', value: (carrier.policyCount ?? 0).toString().slice(0, 2), sub: '个产品' },
            ].map(k => (
              <div key={k.label} style={{ 
                background: 'rgba(236,237,249,0.6)', 
                borderRadius: 12, 
                padding: '10px 14px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.sub?.includes('⚠') ? '#BA1A1A' : '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: 11, color: k.sub?.includes('⚠') ? '#BA1A1A' : '#717786', marginTop: 2 }}>{k.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex tab-bar">
          {TABS.map(tab => (
            <div 
              key={tab.id} 
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 24 }}>
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <h3 className="font-semibold text-[#181C23] mb-4 text-sm">基本资料</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      ['公司全称', carrier.carrierName],
                      ['公司简称', carrier.shortName || '-'],
                      ['NAIC 编码', carrier.naicCode],
                      ['公司类型', carrier.type],
                      ['状态', carrier.status],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, color: '#181C23', fontWeight: 500, fontFamily: label.includes('编码') ? "'JetBrains Mono', monospace" : undefined }}>
                          {value || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {carrier.contactInfo && (
                  <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                    <h3 className="font-semibold text-[#181C23] mb-4 text-sm">联系方式</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {carrier.contactInfo.address && (
                        <div>
                          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>地址</div>
                          <div style={{ fontSize: 14, color: '#181C23' }}>{carrier.contactInfo.address}</div>
                        </div>
                      )}
                      {carrier.contactInfo.phone && (
                        <div>
                          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>电话</div>
                          <div style={{ fontSize: 14, color: '#181C23' }}>{carrier.contactInfo.phone}</div>
                        </div>
                      )}
                      {carrier.contactInfo.email && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>邮箱</div>
                          <div style={{ fontSize: 14, color: '#181C23' }}>{carrier.contactInfo.email}</div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column */}
              {carrier.settlementConfig && (
                <section style={{ background: sectionBg, border: sectionBorder, borderRadius: 14, padding: 18 }}>
                  <h3 className="font-semibold text-[#181C23] mb-4 text-sm">结算配置</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>货币</div>
                      <div style={{ fontSize: 14, color: '#181C23' }}>{carrier.settlementConfig.currency}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>账期天数</div>
                      <div style={{ fontSize: 14, color: '#181C23' }}>{carrier.settlementConfig.paymentTermDays}天</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 4 }}>结算周期</div>
                      <div style={{ fontSize: 14, color: '#181C23' }}>
                        {carrier.settlementConfig.settlementCycle === 'Monthly' ? '月结' : '季结'}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab !== 'info' && (
            <div className="text-center py-12 text-[#717786]">
              <p>此功能模块正在开发中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
