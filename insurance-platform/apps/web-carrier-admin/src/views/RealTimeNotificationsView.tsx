import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Filter, 
  Download,
  Eye,
  Star,
  Archive,
  RefreshCw,
  TrendingUp,
  Clock,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'business' | 'compliance' | 'finance' | 'channel';
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  read: boolean;
  starred: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "07:00"
  };
  filters: {
    [key: string]: boolean; // categoryId → enabled
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  highPriority: number;
  todayCount: number;
  weekCount: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const RealTimeNotificationsView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['notification', 'channel']);

  // Mock data - 通知列表
  const [notifications] = useState<Notification[]>([
    {
      id: 'notif001',
      title: '理赔支付完成通知',
      message: '保单 POL-HC-001234 的理赔款项已支付至受益人账户，金额：$12,500.00',
      type: 'success',
      priority: 'high',
      category: 'finance',
      relatedEntity: {
        type: 'policy',
        id: 'POL-HC-001234',
        name: 'John Smith - Essential Health Insurance',
      },
      read: false,
      starred: true,
      createdAt: '2024-08-31T10:30:00Z',
      actionUrl: '/claims/claim-001',
      actionLabel: '查看详情',
    },
    {
      id: 'notif002',
      title: '合规预警：牌照即将过期',
      message: '渠道代理人的执业牌照将在 7 天后到期（有效期截止至 2024-09-07），请及时提醒续期',
      type: 'warning',
      priority: 'critical',
      category: 'compliance',
      relatedEntity: {
        type: 'agent',
        id: 'NPN-12345678',
        name: 'Michael Johnson - NPN License',
      },
      read: false,
      starred: true,
      createdAt: '2024-08-31T09:15:00Z',
      actionUrl: '/appointment/licenses/NPN-12345678',
      actionLabel: '管理牌照',
    },
    {
      id: 'notif003',
      title: 'EDI 835 数据导入成功',
      message: 'Swiss Re 的 EDI 835 交易文件已成功解析并入库，共计 1,250 条理赔记录',
      type: 'success',
      priority: 'medium',
      category: 'system',
      read: true,
      starred: false,
      createdAt: '2024-08-30T22:45:00Z',
      readAt: '2024-08-31T08:30:00Z',
    },
    {
      id: 'notif004',
      title: '佣金方案审批待处理',
      message: '「California 州渠道 A 级合作伙伴 2024Q3 激励计划」已提交审批，请在规定时间内完成审核',
      type: 'info',
      priority: 'high',
      category: 'channel',
      relatedEntity: {
        type: 'scheme',
        id: 'CSM-2024-Q3',
        name: 'CA Partner A Incentive Plan Q3',
      },
      read: false,
      starred: false,
      createdAt: '2024-08-30T16:20:00Z',
      actionUrl: '/commission/schemes/CSM-2024-Q3',
      actionLabel: '立即审批',
    },
    {
      id: 'notif005',
      title: '系统安全告警',
      message: '检测到异常登录尝试：IP 地址 192.168.1.100 连续 5 次失败认证，可能为暴力破解攻击',
      type: 'error',
      priority: 'critical',
      category: 'system',
      read: false,
      starred: true,
      createdAt: '2024-08-30T14:10:00Z',
      actionUrl: '/permission/logs/login',
      actionLabel: '查看日志',
    },
    {
      id: 'notif006',
      title: '精算模型更新完成',
      message: 'US Mortality 2024 Premium Table 已更新版本至 v2024.1，准确率从 96.8% 提升至 97.5%',
      type: 'success',
      priority: 'medium',
      category: 'system',
      read: true,
      starred: false,
      createdAt: '2024-08-30T11:30:00Z',
      readAt: '2024-08-30T15:00:00Z',
    },
    {
      id: 'notif007',
      title: '产品定价策略生效',
      message: '「大湾区健康险定价调整」已于今日零点自动生效，影响覆盖范围：3 款医疗险 + 2 款重疾险',
      type: 'info',
      priority: 'low',
      category: 'business',
      relatedEntity: {
        type: 'product_bundle',
        id: 'PRD-CN-BAY-2024',
        name: 'Bay Area Health Products Bundle',
      },
      read: false,
      starred: false,
      createdAt: '2024-08-30T00:01:00Z',
    },
    {
      id: 'notif008',
      title: 'OFAC 制裁名单命中警报',
      message: '新增渠道申请「Global Trade Insurance LLC」与 OFAC SDN 名单疑似匹配，已自动暂停流程并转人工复核',
      type: 'error',
      priority: 'critical',
      category: 'compliance',
      read: false,
      starred: true,
      createdAt: '2024-08-29T18:45:00Z',
      actionUrl: '/appointment/onboarding/apply-005',
      actionLabel: '紧急复核',
    },
    {
      id: 'notif009',
      title: '月度报表生成完成',
      message: '2024 年 8 月业务统计报告已生成，包含保费收入、赔付率、渠道绩效等核心指标',
      type: 'success',
      priority: 'low',
      category: 'system',
      read: true,
      starred: false,
      createdAt: '2024-08-29T08:00:00Z',
      readAt: '2024-08-29T10:30:00Z',
    },
    {
      id: 'notif010',
      title: '批量核保规则调整',
      message: '「50-60 岁年龄段风险系数优化」已应用到所有在产寿险产品，预计影响保费测算效率提升 12%',
      type: 'info',
      priority: 'medium',
      category: 'business',
      read: false,
      starred: false,
      createdAt: '2024-08-28T15:20:00Z',
    },
  ]);

  // Mock data - 通知设置
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
    },
    filters: {
      system: true,
      business: true,
      compliance: true,
      finance: true,
      channel: true,
    },
  });

  // 计算统计数据
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    critical: notifications.filter(n => n.priority === 'critical' && !n.read).length,
    highPriority: notifications.filter(n => n.priority === 'high' && !n.read).length,
    todayCount: notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length,
    weekCount: notifications.filter(n => {
      const notificationDate = new Date(n.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return notificationDate >= oneWeekAgo;
    }).length,
  };

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter(notif => {
    const matchesCategory = filterCategory === 'all' || notif.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || notif.priority === filterPriority;
    const matchesRead = !showUnreadOnly || !notif.read;
    const matchesSearch = searchKeyword === '' || 
      notif.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesCategory && matchesPriority && matchesRead && matchesSearch;
  });

  const markAsRead = (id: string) => {
    alert(`已将通知 "${notifications.find(n => n.id === id)?.title}" 标记为已读`);
  };

  const markAllAsRead = () => {
    alert('已将所有通知标记为已读');
  };

  const toggleStarred = (id: string) => {
    alert(`已${notifications.find(n => n.id === id)?.starred ? '取消收藏' : '收藏'}通知`);
  };

  const dismissNotification = (id: string) => {
    alert(`已移除通知 ${id}`);
  };

  const markAllCriticalAsRead = () => {
    alert('已将所有高优先级未读通知标记为已读');
  };

  const exportNotifications = () => {
    alert('正在导出通知历史记录...');
  };

  const configureSettings = () => {
    alert('正在打开通知设置对话框...');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'error':
        return <XCircle className="text-red-600" size={20} />;
      case 'info':
        return <MessageSquare className="text-blue-600" size={20} />;
      case 'system':
        return <ShieldCheck className="text-purple-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-purple-100 text-purple-700';
      case 'business':
        return 'bg-blue-100 text-blue-700';
      case 'compliance':
        return 'bg-red-100 text-red-700';
      case 'finance':
        return 'bg-green-100 text-green-700';
      case 'channel':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const mins = Math.floor(diffInHours * 60);
      return `${mins}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 48) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg relative">
              <Bell className="text-white" size={32} />
              {stats.unread > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">
                  {stats.unread}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                实时通知中心
              </h1>
              <p className="text-gray-600">Real-time Notifications Center & Alert Management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={configureSettings}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Settings size={18} />
              配置通知
            </button>
            <button
              onClick={markAllAsRead}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <CheckCircle size={18} />
              全部已读
            </button>
            <button
              onClick={exportNotifications}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出数据
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Bell className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">总通知数</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <RefreshCw className="text-orange-600" size={24} />
            </div>
            <span className="text-xs text-orange-600 font-semibold">{stats.todayCount}个今天</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.unread}</div>
          <div className="text-sm text-gray-600">未读通知</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.critical}</div>
          <div className="text-sm text-gray-600">危急待处理</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.highPriority}</div>
          <div className="text-sm text-gray-600">高优待处理</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.todayCount}</div>
          <div className="text-sm text-gray-600">今日新增</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.weekCount}</div>
          <div className="text-sm text-gray-600">本周累计</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-4 rounded-2xl shadow-xl border border-white/50 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">仅显示未读</span>
            </label>
            <button
              onClick={markAllCriticalAsRead}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              ⚡ 一键处理危急
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">共{stats.unread}条未读通知</span>
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {formatDate(notifications[0]?.createdAt || '')}前最新
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">筛选器</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索标题或内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            <option value="all">所有类别</option>
            <option value="system">系统通知</option>
            <option value="business">业务通知</option>
            <option value="compliance">合规通知</option>
            <option value="finance">财务通知</option>
            <option value="channel">渠道通知</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            <option value="all">所有优先级</option>
            <option value="critical">危急</option>
            <option value="high">高优</option>
            <option value="medium">中等</option>
            <option value="low">低</option>
          </select>

          {/* Sort by */}
          <select className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
            <option value="newest"> newest first</option>
            <option value="oldest"> oldest first</option>
            <option value="priority"> priority first</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`group bg-white backdrop-blur-xl bg-opacity-70 p-5 rounded-2xl shadow-lg border-l-4 transition-all hover:shadow-xl ${
              !notif.read ? 'border-indigo-500 bg-indigo-50/30' :
              notif.priority === 'critical' ? 'border-red-500 bg-red-50/20' :
              notif.priority === 'high' ? 'border-orange-500 bg-orange-50/20' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Left: Icon & Priority */}
              <div className="flex-shrink-0 pt-1">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      {notif.title}
                      {notif.starred && <Star className="text-yellow-500" size={14} fill="currentColor" />}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    
                    {notif.relatedEntity && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {notif.relatedEntity.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Badges & Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(notif.priority)}`}>
                        {notif.priority === 'critical' && '危急'}
                        {notif.priority === 'high' && '高优'}
                        {notif.priority === 'medium' && '中等'}
                        {notif.priority === 'low' && '低'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeClass(notif.category)}`}>
                        {notif.category === 'system' && '系统'}
                        {notif.category === 'business' && '业务'}
                        {notif.category === 'compliance' && '合规'}
                        {notif.category === 'finance' && '财务'}
                        {notif.category === 'channel' && '渠道'}
                      </span>
                    </div>
                    
                    {!notif.read && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold">
                        新消息
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Timestamp & Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(notif.createdAt)}
                    </span>
                    {notif.readAt && (
                      <span>已读：{formatDate(notif.readAt)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="标记为已读"
                      >
                        <CheckCircle size={16} className="text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleStarred(notif.id)}
                      className={`p-2 hover:bg-yellow-50 rounded-lg transition-colors ${
                        notif.starred ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                      title={notif.starred ? '取消收藏' : '收藏'}
                    >
                      <Star size={16} fill={notif.starred ? 'currentColor' : 'none'} />
                    </button>
                    {notif.actionUrl && (
                      <button
                        onClick={() => alert(`跳转至：${notif.actionLabel}`)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {notif.actionLabel}
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="移除"
                    >
                      <Archive size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="text-center py-16 bg-white backdrop-blur-xl bg-opacity-70 rounded-2xl shadow-xl border border-white/50">
          <Bell className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无符合条件的通知</h3>
          <p className="text-gray-500">请尝试调整筛选条件</p>
        </div>
      )}

      {/* Notification Statistics & Insights */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Chart Placeholder */}
        <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">最近通知趋势</h3>
          <div className="space-y-3">
            {['Today', 'Yesterday', '7 Days Ago'].map((period, index) => {
              const counts = [12, 8, 23];
              return (
                <div key={period} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600">{period}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${(counts[index] / 23) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-900">{counts[index]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">分类占比</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '系统通知', count: 25, color: 'bg-purple-500' },
              { label: '业务通知', count: 30, color: 'bg-blue-500' },
              { label: '合规通知', count: 20, color: 'bg-red-500' },
              { label: '财务通知', count: 15, color: 'bg-green-500' },
              { label: '渠道通知', count: 10, color: 'bg-orange-500' },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                <div className="flex-1 text-sm text-gray-700">{cat.label}</div>
                <div className="text-sm font-semibold text-gray-900">{cat.count}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-xl border border-indigo-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-indigo-900 mb-2">AI 通知优化与效率建议</div>
            <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
              <li>{stats.unread}条未读通知中，{stats.critical}条为危急级别，建议优先处理牌照续期与 OFAC 合规警报</li>
              <li>本周平均每日接收{Math.round(stats.weekCount / 7)}条通知，峰值出现在周二上午 10-11 点（理赔高峰期）</li>
              <li>检测到 5 条高优先级通知已收藏，这些是您的关键工作项，建议设为每日晨会检查项目</li>
              <li>当前静音时段设置为 22:00-07:00，如需在非工作时间接收紧急警报，可开启 VIP 通道白名单功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNotificationsView;
