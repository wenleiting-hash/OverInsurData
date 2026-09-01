import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Filter,
  Settings,
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  channels: ('email' | 'sms' | 'push' | 'in-app')[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  isActive: boolean;
  lastUsed?: string;
}

interface NotificationLog {
  id: string;
  templateName: string;
  recipientType: 'channel' | 'agent' | 'admin';
  recipientName: string;
  channel: 'email' | 'sms' | 'push' | 'in-app';
  status: 'sent' | 'delivered' | 'opened' | 'failed' | 'bounced';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  failureReason?: string;
  actionCount: number; // Number of actions triggered
}

interface NotificationMetrics {
  totalSentToday: number;
  deliveryRate: number;
  openRate: number;
  failedToday: number;
  queuedNotifications: number;
  thisMonthTotal: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Notification templates
const mockTemplates: NotificationTemplate[] = [
  {
    id: 'tpl001',
    name: 'Appointment 审批通知',
    description: '当代理人 Appointment 申请被批准或拒绝时发送通知',
    triggers: ['appointment_approved', 'application_rejected'],
    channels: ['email', 'in-app', 'push'],
    priority: 'high',
    isActive: true,
    lastUsed: '2026-08-31 14:30:00',
  },
  {
    id: 'tpl002',
    name: '许可证到期预警',
    description: '许可证即将到期前自动发送提醒通知（30/15/7/1 天）',
    triggers: ['license_expiry_30days', 'license_expiry_7days', 'license_expired'],
    channels: ['email', 'sms', 'in-app'],
    priority: 'critical',
    isActive: true,
    lastUsed: '2026-08-31 09:00:00',
  },
  {
    id: 'tpl003',
    name: '佣金结算完成通知',
    description: '渠道佣金支付完成后发送邮件和站内信',
    triggers: ['commission_paid', 'settlement_completed'],
    channels: ['email', 'in-app'],
    priority: 'normal',
    isActive: true,
    lastUsed: '2026-08-30 16:00:00',
  },
  {
    id: 'tpl004',
    name: '合规拦截警告',
    description: '触发合规拦截规则时立即发送紧急警告',
    triggers: ['compliance_violation', 'ofac_match', 'state_violation'],
    channels: ['email', 'sms', 'push', 'in-app'],
    priority: 'critical',
    isActive: true,
    lastUsed: '2026-08-29 11:20:00',
  },
  {
    id: 'tpl005',
    name: '培训认证过期提醒',
    description: '渠道培训认证即将过期时发送续费通知',
    triggers: ['certification_expiring', 'certification_expired'],
    channels: ['email', 'in-app'],
    priority: 'high',
    isActive: true,
    lastUsed: '2026-08-28 10:00:00',
  },
  {
    id: 'tpl006',
    name: '系统维护公告',
    description: '计划性维护前的通知和停机公告',
    triggers: ['maintenance_scheduled', 'maintenance_started', 'maintenance_completed'],
    channels: ['email', 'sms', 'in-app', 'push'],
    priority: 'normal',
    isActive: false,
    lastUsed: '2026-08-15 08:00:00',
  },
];

// Mock data - Notification logs
const mockLogs: NotificationLog[] = [
  {
    id: 'log001',
    templateName: 'Appointment 审批通知',
    recipientType: 'agent',
    recipientName: '张伟',
    channel: 'email',
    status: 'delivered',
    sentAt: '2026-08-31 14:30:15',
    deliveredAt: '2026-08-31 14:30:22',
    openedAt: '2026-08-31 14:35:00',
    actionCount: 1,
  },
  {
    id: 'log002',
    templateName: '许可证到期预警',
    recipientType: 'channel',
    recipientName: '北京经纪门店',
    channel: 'sms',
    status: 'delivered',
    sentAt: '2026-08-31 09:00:05',
    deliveredAt: '2026-08-31 09:00:12',
    actionCount: 3,
  },
  {
    id: 'log003',
    templateName: '合规拦截警告',
    recipientType: 'admin',
    recipientName: '王芳',
    channel: 'push',
    status: 'opened',
    sentAt: '2026-08-30 18:45:30',
    deliveredAt: '2026-08-30 18:45:35',
    openedAt: '2026-08-30 18:46:00',
    actionCount: 2,
  },
  {
    id: 'log004',
    templateName: '佣金结算完成通知',
    recipientType: 'channel',
    recipientName: '深圳 MGA 总部',
    channel: 'email',
    status: 'opened',
    sentAt: '2026-08-30 16:00:00',
    deliveredAt: '2026-08-30 16:00:08',
    openedAt: '2026-08-30 16:15:00',
    actionCount: 1,
  },
  {
    id: 'log005',
    templateName: 'Appointment 审批通知',
    recipientType: 'agent',
    recipientName: '李明',
    channel: 'in-app',
    status: 'delivered',
    sentAt: '2026-08-30 15:20:00',
    deliveredAt: '2026-08-30 15:20:03',
    actionCount: 0,
  },
  {
    id: 'log006',
    templateName: '许可证到期预警',
    recipientType: 'channel',
    recipientName: '杭州保险经纪公司',
    channel: 'email',
    status: 'failed',
    sentAt: '2026-08-30 14:00:00',
    failureReason: 'Invalid email address',
    actionCount: 1,
  },
  {
    id: 'log007',
    templateName: '合规拦截警告',
    recipientType: 'admin',
    recipientName: '刘洋',
    channel: 'sms',
    status: 'delivered',
    sentAt: '2026-08-29 11:20:15',
    deliveredAt: '2026-08-29 11:20:22',
    actionCount: 4,
  },
  {
    id: 'log008',
    templateName: '培训认证过期提醒',
    recipientType: 'channel',
    recipientName: '上海代理点',
    channel: 'email',
    status: 'bounced',
    sentAt: '2026-08-29 10:00:00',
    failureReason: 'Mailbox full',
    actionCount: 1,
  },
];

// Mock metrics
const mockMetrics: NotificationMetrics = {
  totalSentToday: 234,
  deliveryRate: 96.5,
  openRate: 78.3,
  failedToday: 8,
  queuedNotifications: 45,
  thisMonthTotal: 5678,
};

const channelColors = {
  email: 'bg-blue-100 text-blue-800 border-blue-200',
  sms: 'bg-green-100 text-green-800 border-green-200',
  push: 'bg-purple-100 text-purple-800 border-purple-200',
  'in-app': 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const statusColors = {
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  opened: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  bounced: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function IntelligentNotificationView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesChannel = selectedChannelFilter === 'all' || log.channel === selectedChannelFilter;
    const matchesStatus = selectedStatusFilter === 'all' || log.status === selectedStatusFilter;
    return matchesChannel && matchesStatus;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString('en-US');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <Smartphone size={16} />;
      case 'push': return <Bell size={16} />;
      case 'in-app': return <MessageSquare size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              智能通知中心
            </h1>
            <p className="text-gray-600">
              多渠道通知模板管理、发送追踪与效果分析
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`btn-secondary ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw 
              size={18} 
              className={`${isRefreshing ? 'animate-spin' : ''} mr-2`}
            />
            刷新数据
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Bell size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">今日发送</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.totalSentToday}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +23 笔 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">送达率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.deliveryRate}%
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +2.1% 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Eye size={24} className="text-yellow-600" />
              <span className="text-xs text-gray-500 font-medium">打开率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.openRate}%
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +5.3% 环比
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <XCircle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">今日失败</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.failedToday}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              -3 笔 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">待发送队列</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.queuedNotifications}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              处理中
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">本月累计</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.thisMonthTotal}
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              +456 条 上月
            </div>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">通知模板库</h2>
          <button className="btn-primary">
            <Bell size={16} className="mr-2" />
            新建模板
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTemplates.map((template) => (
            <div
              key={template.id}
              className="glass p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                </div>
                {template.isActive ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <BellOff size={20} className="text-gray-400" />
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex flex-wrap gap-1">
                  {template.channels.map(channel => (
                    <span
                      key={channel}
                      className={`px-2 py-1 rounded-full text-xs border ${channelColors[channel]}`}
                    >
                      {getChannelIcon(channel)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    template.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    template.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    template.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.priority === 'critical' && '⚡ 紧急'}
                    {template.priority === 'high' && '🔥 高优先级'}
                    {template.priority === 'normal' && '• 普通'}
                    {template.priority === 'low' && '○ 低优先级'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <ArrowRight size={12} />
                    <span>{template.triggers.length} 个触发器</span>
                  </div>
                  {template.lastUsed && (
                    <div className="text-gray-500">
                      最后使用：{template.lastUsed.split(' ')[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="btn-secondary text-sm flex-1">
                  编辑模板
                </button>
                <button className="btn-secondary text-sm flex-1">
                  测试发送
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Channel Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">通知渠道:</label>
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部渠道</option>
              <option value="email">邮件 Email</option>
              <option value="sms">短信 SMS</option>
              <option value="push">推送 Push</option>
              <option value="in-app">站内信 In-App</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">发送状态:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="sent">已发送</option>
              <option value="delivered">已送达</option>
              <option value="opened">已打开</option>
              <option value="failed">已失败</option>
              <option value="bounced">已退回</option>
            </select>
          </div>

          {/* Settings Button */}
          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Settings size={16} className="mr-2" />
              通知设置
            </button>
            <button className="btn-secondary">
              <Filter size={16} className="mr-2" />
              高级筛选
            </button>
          </div>
        </div>
      </div>

      {/* Notification Logs */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">通知发送日志</h2>
          <span className="text-sm text-gray-600">{filteredLogs.length} 条记录</span>
        </div>

        <div className="overflow-x-auto space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-6 rounded-lg border transition-colors hover:shadow-md ${
                log.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : log.status === 'bounced'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Section - Basic Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">通知类型</div>
                    <div className="font-semibold text-sm text-gray-900">{log.templateName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">接收对象</div>
                    <div className="text-sm text-gray-700">{log.recipientName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">发送时间</div>
                    <div className="text-sm text-gray-700">{formatTime(log.sentAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">触发动作数</div>
                    <div className="text-sm font-semibold text-blue-600">{log.actionCount} 次</div>
                  </div>
                </div>

                {/* Middle Section - Channel & Status */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">通知渠道</div>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${channelColors[log.channel]}`}>
                      {getChannelIcon(log.channel)}
                      <span className="font-semibold text-sm capitalize">
                        {log.channel === 'in-app' ? '站内信' : 
                         log.channel === 'sms' ? '短信' :
                         log.channel === 'push' ? '推送' : '邮件'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">发送状态</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${statusColors[log.status]}`}>
                      {log.status === 'sent' && '✓ 已发送'}
                      {log.status === 'delivered' && '✓ 已送达'}
                      {log.status === 'opened' && '✓ 已打开'}
                      {log.status === 'failed' && '✗ 已失败'}
                      {log.status === 'bounced' && '⚠ 已退回'}
                    </span>
                  </div>
                </div>

                {/* Right Section - Timeline & Actions */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm">
                    {log.deliveredAt && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={14} />
                        <span>送达：{formatTime(log.deliveredAt!)}</span>
                      </div>
                    )}
                    {log.openedAt && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Eye size={14} />
                        <span>打开：{formatTime(log.openedAt!)}</span>
                      </div>
                    )}
                    {log.failureReason && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle size={14} />
                        <span className="line-clamp-1">{log.failureReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Bell size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无通知记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的通知数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(8, filteredLogs.length)} 共 {filteredLogs.length} 条
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled>
              上一页
            </button>
            <button className="btn-secondary">
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Settings size={16} className="text-blue-600" />
          <div>
            <strong>提示：</strong>可配置通知频率限制避免打扰，紧急级别通知支持电话语音兜底
          </div>
        </div>
      </div>
    </div>
  );
}
