import { useState } from 'react';
import { Search, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import type { ViewId } from '../App';
import SettingsModal from '@/views/SettingsModal';

interface VIEW_LABELS {
  crumbs: string[];
  title: string;
}

const VIEW_LABELS: Record<string, VIEW_LABELS> = {
  dashboard: { crumbs: [], title: '总览' },
  'insurer-list': { crumbs: ['保险公司管理'], title: '保险公司列表' },
  'insurer-detail': { crumbs: ['保险公司管理', '保险公司列表'], title: '保险公司详情' },
  'insurer-new': { crumbs: ['保险公司管理', '保险公司列表'], title: '新增保险公司' },
  'insurer-edit': { crumbs: ['保险公司管理', '保险公司列表'], title: '编辑保险公司' },
  'insurer-import': { crumbs: ['保险公司管理', '保险公司列表'], title: '批量导入' },
  'insurer-duplicate': { crumbs: ['保险公司管理', '保险公司列表'], title: '重复数据检测' },
  'product-list': { crumbs: ['保险公司管理'], title: '产品管理' },
  'product-detail': { crumbs: ['保险公司管理', '产品管理'], title: '产品详情' },
  'product-new': { crumbs: ['保险公司管理', '产品管理'], title: '新增产品' },
  'product-edit': { crumbs: ['保险公司管理', '产品管理'], title: '编辑产品' },
  cooperation: { crumbs: ['保险公司管理'], title: '合作管理' },
  appointment: { crumbs: ['保险公司管理'], title: 'Appointment & 合规' },
  finance: { crumbs: ['保险公司管理'], title: '财务与结算' },
  'insurer-analytics': { crumbs: ['保险公司管理'], title: '数据分析' },
  'channel-list': { crumbs: ['渠道管理'], title: '渠道列表' },
  'channel-hierarchy': { crumbs: ['渠道管理'], title: '渠道层级' },
  'channel-onboarding': { crumbs: ['渠道管理'], title: '入驻管理' },
  'product-auth': { crumbs: ['渠道管理'], title: '产品授权' },
  'commission-scheme': { crumbs: ['渠道管理'], title: '佣金方案' },
  'commission-settlement': { crumbs: ['渠道管理'], title: '佣金结算' },
  'channel-performance': { crumbs: ['渠道管理'], title: '绩效考核' },
  'channel-training': { crumbs: ['渠道管理'], title: '培训认证' },
  'channel-portal': { crumbs: ['渠道管理'], title: '渠道门户' },
  'channel-analytics': { crumbs: ['渠道管理'], title: '渠道分析' },
};

interface Props {
  currentView: ViewId | string;
  navigateTo: (view: ViewId) => void;
}

export default function TopBar({ currentView, navigateTo }: Props) {
  const info = VIEW_LABELS[currentView as string] ?? { crumbs: [], title: currentView as string };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleUserClick = () => {
    setIsSettingsOpen(!isSettingsOpen); // Toggle
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <>
      <header
        className="glass-strong flex items-center justify-between shrink-0"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: '0.5px solid rgba(193,198,215,0.5)',
          borderRadius: 0,
          zIndex: 10,
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5" style={{ fontSize: 13.5 }}>
          <button
            className="btn-ghost"
            style={{ padding: '3px 6px', fontSize: 13.5, color: '#717786' }}
            onClick={() => navigateTo('dashboard')}
          >
            InsureOS
          </button>
          {info.crumbs.map(c => (
            <span key={c} className="flex items-center gap-1.5">
              <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
              <span style={{ color: '#717786' }}>{c}</span>
            </span>
          ))}
          {info.title && (
            <span className="flex items-center gap-1.5">
              <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
              <span style={{ color: '#181C23', fontWeight: 600 }}>{info.title}</span>
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input
              type="text"
              placeholder="搜索保险公司、产品、渠道…"
              className="input-glass"
              style={{ paddingLeft: 30, width: 240, fontSize: 13 }}
            />
          </div>

          {/* Notification */}
          <button
            className="btn-ghost relative"
            style={{ padding: 8 }}
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#FF3B30',
                boxShadow: '0 0 5px rgba(255,59,48,0.5)',
                border: '1.5px solid rgba(249,249,255,0.9)',
              }}
            />
          </button>

          {/* User Dropdown - Complete panel with avatar, name, role and settings icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: '#F8F9FA',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'background 120ms',
              border: '1px solid rgba(193, 198, 215, 0.3)',
            }}
            onClick={handleUserClick}
          >
            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0058BC, #60CDFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              A
            </div>
            
            {/* Text Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>Admin</div>
              <div style={{ fontSize: 11.5, color: '#717786' }}>Platform Admin</div>
            </div>
            
            {/* Settings Icon */}
            <button 
              className="btn-ghost" 
              style={{ padding: 4, minWidth: 24, minHeight: 24 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717786" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          {/* Help Circle - removed according to new prototype */}
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={handleSettingsClose} 
        navigateTo={navigateTo}
      />
    </>
  );
}
