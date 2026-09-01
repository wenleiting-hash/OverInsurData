import { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Plus, Edit2, Trash2, Flag, Settings } from 'lucide-react';
import type { ViewId } from '@/App';
import { COMPLIANCE_RULES, type RuleCategory, type ComplianceRule } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function ComplianceRulesView({ navigateTo }: Props) {
  const { t } = useTranslation('compliance');
  
  // Get rules data
  const [allRules, setAllRules] = useState<ComplianceRule[]>(COMPLIANCE_RULES);
  
  const [activeTab, setActiveTab] = useState<RuleCategory | 'all'>('appointment');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);

  const toggleRuleEnabled = (ruleId: string) => {
    setAllRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    if (confirm('确定要删除此规则吗？')) {
      setAllRules(rules => rules.filter(r => r.id !== ruleId));
    }
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (rule: ComplianceRule) => {
    setEditingRule({ ...rule });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingRule(null);
  };

  const handleSaveRule = () => {
    if (!editingRule || !editingRule.name.trim()) return;
    
    if (editingRule.id) {
      // Update existing
      setAllRules(rules =>
        rules.map(r => r.id === editingRule.id ? editingRule : r)
      );
        const newRule = {
        ...editingRule,
        id: `cr${allRules.length + 1}`,
        triggeredCount: 0,
        lastTriggered: undefined,
      };
      setAllRules(rules => [...rules, newRule]);
    }
    
    handleCloseModal();
    alert(editingRule.id ? '规则已更新' : '规则已创建');
  };

  const filteredRules = activeTab === 'all'
    ? allRules
    : allRules.filter(rule => rule.category === activeTab);

  type TabType = RuleCategory | 'all';

  const categoryLabels: Record<RuleCategory, string> = {
    appointment: 'Appointment',
    license: '牌照 License',
    ofac: 'OFAC',
    channel: '渠道 Channel',
    product: '产品 Product',
  };

  const actionLabels: Record<string, { bg: string; text: string; label: string }> = {
    block: { bg: 'bg-red-100', text: 'text-red-700', label: '拦截 Block' },
    warn: { bg: 'bg-orange-100', text: 'text-orange-700', label: '警告 Warn' },
    'require-review': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '需要审核 Require Review' },
  };

  const getCategoryBadge = (category: RuleCategory) => {
    const colors: Record<RuleCategory, string> = {
      appointment: 'blue',
      license: 'purple',
      ofac: 'red',
      channel: 'green',
      product: 'orange',
    };
    const color = colors[category];
    return (
      <span className={`px-2 py-1 ${color}-100 text-${color}-700 rounded text-xs font-medium capitalize`}>
        {categoryLabels[category]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('appointment')} // Navigate to compliance main page (ViewId needs update)
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回合规模块主页
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          合规规则配置
        </h1>
        <p className="text-gray-600">
          管理出单时的合规校验规则和触发逻辑
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            <span className="text-sm text-gray-600">总规则数</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{allRules.length}</div>
        </div>
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-6 h-6 text-green-600" />
            <span className="text-sm text-gray-600">激活规则</span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {allRules.filter(r => r.enabled).length}
          </div>
        </div>
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Flag className="w-6 h-6 text-red-600" />
            <span className="text-sm text-gray-600">今日拦截</span>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {allRules.reduce((acc, r) => acc + r.triggeredCount, 0)}
          </div>
        </div>
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Settings className="w-6 h-6 text-purple-600" />
            <span className="text-sm text-gray-600">优先级范围</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            1-{Math.max(...allRules.map(r => r.priority))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 glass px-4 py-2 rounded-t-lg inline-flex gap-1 flex-wrap">
        {[
          { key: 'all', label: '全部 All' },
          { key: 'appointment', label: 'Appointment' },
          { key: 'license', label: '牌照 License' },
          { key: 'ofac', label: 'OFAC' },
          { key: 'channel', label: '渠道 Channel' },
          { key: 'product', label: '产品 Product' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 ml-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加规则
        </button>
      </div>

      {/* Rules List */}
      <div className="glass p-6 rounded-xl">
        <div className="space-y-4">
          {filteredRules.map(rule => (
            <div
              key={rule.id}
              className={`p-6 rounded-lg border transition-all ${
                rule.enabled
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  : 'border-gray-100 opacity-60 grayscale'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${actionLabels[rule.action].bg} ${actionLabels[rule.action].text}`}>
                      {actionLabels[rule.action].label}
                    </span>
                    {getCategoryBadge(rule.category)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{rule.condition}</p>
                  
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Flag className="w-4 h-4" />
                      <span>触发:{rule.triggeredCount}</span>
                    </div>
                    {rule.lastTriggered && (
                      <div className="flex items-center gap-1">
                        <span>最后触发:</span>
                        <span className="font-mono text-gray-700">{rule.lastTriggered}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>优先级:</span>
                      <span className="font-semibold text-blue-600">P{rule.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleRuleEnabled(rule.id)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        rule.enabled ? 'left-8 translate-x-4' : 'left-1'
                      }`}
                    />
                  </button>
                  
                  {/* Actions */}
                  <button
                    onClick={() => handleOpenEditModal(rule)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                    title="编辑"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRules.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>暂无规则记录</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加第一条规则
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Rule Modal */}
      {showAddModal && editingRule && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingRule.id ? '编辑规则' : '新建规则'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Rule Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  规则名称 *
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="输入规则中文名称，例如：Appointment 必须有效"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category & Action Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    规则类别 *
                  </label>
                  <select
                    value={editingRule.category}
                    onChange={e => setEditingRule({ ...editingRule, category: e.target.value as RuleCategory })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="appointment">Appointment</option>
                    <option value="license">牌照 License</option>
                    <option value="ofac">OFAC</option>
                    <option value="channel">渠道 Channel</option>
                    <option value="product">产品 Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    执行动作 *
                  </label>
                  <select
                    value={editingRule.action}
                    onChange={e => setEditingRule({ ...editingRule, action: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="block">拦截 (Block)</option>
                    <option value="warn">警告 (Warn)</option>
                    <option value="require-review">需要审核 (Require Review)</option>
                  </select>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  触发条件 *
                </label>
                <textarea
                  rows={4}
                  value={editingRule.condition}
                  onChange={e => setEditingRule({ ...editingRule, condition: e.target.value })}
                  placeholder="用中文描述触发条件，例如：出单时检查 Appointment 状态 = approved"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Priority */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  优先级 (数字越小优先级越高) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editingRule.priority}
                  onChange={e => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  重要规则应设置高优先级（如 1-10），次要规则可设置较低优先级（如 50-100）
                </p>
              </div>

              {/* Enabled Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.enabled}
                    onChange={e => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-blue-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">激活此规则</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
                >
                  保存规则
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Import X icon at top
import { X } from 'lucide-react';
