import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy,
  RefreshCw,
  Settings,
  Shield,
  Search,
  Filter,
  History,
  Archive,
  TrendingUp
} from 'lucide-react';

interface PermissionTemplate {
  id: string;
  templateName: string;
  version: string;
  description: string;
  createdBy: string;
  createdAt: string;
  format: 'json' | 'yaml';
  roleCount: number;
  permissionCount: number;
  lastUsed: string;
  usageCount: number;
}

interface RoleBackup {
  roleName: string;
  roleCode: string;
  permissions: string[]; // permissionIds
  inheritedRoles?: string[];
  metadata: {
    description: string;
    userType: string;
    status: string;
  };
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  duplicatedCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    message: string;
    suggestion?: string;
  }>;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const PermissionTemplateManagerView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['permission', 'channel']);

  // Mock data - 权限模板库
  const [templates] = useState<PermissionTemplate[]>([
    {
      id: 'tmpl001',
      templateName: '超级管理员标准配置',
      version: '1.0.0',
      description: '包含系统所有核心权限，适用于平台管理员账号',
      createdBy: 'admin',
      createdAt: '2024-01-01',
      format: 'json',
      roleCount: 1,
      permissionCount: 156,
      lastUsed: '2024-08-30',
      usageCount: 23,
    },
    {
      id: 'tmpl002',
      templateName: '保险公司经理模板',
      version: '2.1.0',
      description: '保险公司管理模块 + 产品管理模块的核心操作权限',
      createdBy: 'system_admin',
      createdAt: '2024-01-15',
      format: 'json',
      roleCount: 3,
      permissionCount: 67,
      lastUsed: '2024-08-28',
      usageCount: 156,
    },
    {
      id: 'tmpl003',
      templateName: '渠道经理职责范围',
      version: '1.5.0',
      description: '渠道入驻审核、产品授权、佣金方案配置权限',
      createdBy: 'compliance_officer',
      createdAt: '2024-02-01',
      format: 'yaml',
      roleCount: 2,
      permissionCount: 45,
      lastUsed: '2024-08-29',
      usageCount: 89,
    },
    {
      id: 'tmpl004',
      templateName: '只读访客权限集',
      version: '1.0.0',
      description: '仅查看类权限，禁止写入操作的受限角色',
      createdBy: 'security_admin',
      createdAt: '2024-03-01',
      format: 'json',
      roleCount: 5,
      permissionCount: 23,
      lastUsed: '2024-08-31',
      usageCount: 234,
    },
  ]);

  // Mock data - 导入历史
  const [importHistory] = useState<Array<{
    id: string;
    templateName: string;
    format: string;
    importTime: string;
    importedCount: number;
    status: 'success' | 'partial' | 'failed';
    executedBy: string;
  }>>([
    { id: 'hist001', templateName: '保险公司经理模板_v2.1', format: 'JSON', importTime: '2024-08-28 14:30:00', importedCount: 3, status: 'success', executedBy: 'admin' },
    { id: 'hist002', templateName: '合规审计员配置.json', format: 'JSON', importTime: '2024-08-25 10:15:00', importedCount: 1, status: 'success', executedBy: 'compliance_mgr' },
    { id: 'hist003', templateName: '旧版渠道专员.yaml', format: 'YAML', importTime: '2024-08-20 16:45:00', importedCount: 2, status: 'partial', executedBy: 'channel_admin' },
  ]);

  const [selectedFormat, setSelectedFormat] = useState<'all' | 'json' | 'yaml'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileContent, setImportFileContent] = useState('');

  const filteredTemplates = templates.filter(tpl => {
    const matchesFormat = selectedFormat === 'all' || tpl.format === selectedFormat;
    const matchesSearch = searchKeyword === '' || 
      tpl.templateName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesFormat && matchesSearch;
  });

  const handleExportTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const exportData = generateMockExport(template);
    const blob = new Blob([exportData], { type: template.format === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.templateName}_v${template.version}.${template.format}`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`已导出 "${template.templateName}" 模板文件`);
  };

  const handleBulkExport = () => {
    alert('正在批量导出所有模板到 ZIP 压缩包...');
  };

  const handleImportTemplate = () => {
    if (!importFileContent.trim()) {
      alert('请先粘贴或上传模板内容');
      return;
    }

    const result = validateAndParseImport(importFileContent);
    
    if (result.success) {
      alert(`导入成功！\n\n✓ 新增 ${result.importedCount} 个角色配置\n${result.errorCount > 0 ? `⚠ ${result.errorCount} 条错误已记录` : ''}`);
      setShowImportModal(false);
      setImportFileContent('');
    } else {
      const errorMsg = result.errors.map(e => `[行${e.row}] ${e.message}`).join('\n');
      alert(`导入失败：\n${errorMsg}`);
    }
  };

  const validateAndParseImport = (content: string): ImportResult => {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.roles)) {
        return {
          success: false,
          importedCount: 0,
          duplicatedCount: 0,
          errorCount: 1,
          errors: [{ row: 0, message: 'Invalid format: Expected roles array', suggestion: 'Check template structure' }],
        };
      }
      
      const errors: ImportResult['errors'] = [];
      let successCount = 0;
      
      parsed.roles.forEach((role: any, index: number) => {
        if (!role.roleName || !role.roleCode) {
          errors.push({
            row: index + 1,
            message: 'Missing required fields: roleName or roleCode',
            suggestion: 'Ensure all roles have unique name and code',
          });
        } else {
          successCount++;
        }
        
        if (!Array.isArray(role.permissions)) {
          errors.push({
            row: index + 1,
            message: 'Invalid permissions field: Expected array',
            suggestion: 'Provide permission IDs as string array',
          });
        }
      });
      
      return {
        success: errors.length === 0,
        importedCount: successCount,
        duplicatedCount: 0,
        errorCount: errors.length,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        importedCount: 0,
        duplicatedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, message: 'Invalid JSON syntax', suggestion: 'Validate JSON format before importing' }],
      };
    }
  };

  const generateMockExport = (template: PermissionTemplate) => {
    const mockRoles: RoleBackup[] = [
      {
        roleName: template.templateName,
        roleCode: template.templateName.replace(/\s+/g, '_').toUpperCase(),
        permissions: ['perm001', 'perm002', 'perm003', 'perm008'],
        inheritedRoles: [],
        metadata: {
          description: template.description,
          userType: 'business',
          status: 'active',
        },
      },
    ];
    
    return template.format === 'json' 
      ? JSON.stringify({ version: template.version, roles: mockRoles, createdAt: template.createdAt }, null, 2)
      : `# Template: ${template.templateName}\nversion: ${template.version}\nroles:\n  - roleName: ${mockRoles[0].roleName}\n    roleCode: ${mockRoles[0].roleCode}\n    permissions: ${JSON.stringify(mockRoles[0].permissions)}\n`;
  };

  const copyTemplateId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert(`已复制模板 ID: ${id}`);
  };

  const restoreTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      alert(`已应用模板 "${template.templateName}" v${template.version} 到当前选中角色`);
    }
  };

  const duplicateTemplate = (id: string) => {
    alert(`已创建 "${id}" 的副本，请编辑新配置`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                权限模板管理器
              </h1>
              <p className="text-gray-600">Permission Template Manager - JSON/YAML Backup & Restore</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Upload size={18} />
              导入模板
            </button>
            <button
              onClick={handleBulkExport}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              批量导出
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Archive className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{templates.length}</div>
          <div className="text-sm text-gray-600">总模板数</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <FileJson className="text-green-600" size={24} />
            </div>
            <span className="text-xs text-green-600 font-semibold">75%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {templates.filter(t => t.format === 'json').length}
          </div>
          <div className="text-sm text-gray-600">JSON 格式</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <FileText className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-purple-600 font-semibold">25%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {templates.filter(t => t.format === 'yaml').length}
          </div>
          <div className="text-sm text-gray-600">YAML 格式</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <History className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{importHistory.length}</div>
          <div className="text-sm text-gray-600">最近导入次数</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl">
              <RefreshCw className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">快速操作</h2>
              <p className="text-sm text-gray-500">Quick Actions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: '新建模板', desc: '从当前配置创建新模板', icon: Copy, color: 'from-blue-500 to-cyan-500', action: () => alert('打开新建模板对话框') },
            { label: '导出全部', desc: '下载所有模板为 ZIP 包', icon: Download, color: 'from-green-500 to-emerald-500', action: handleBulkExport },
            { label: '导入模板', desc: '从 JSON/YAML 文件恢复配置', icon: Upload, color: 'from-purple-500 to-pink-500', action: () => setShowImportModal(true) },
            { label: '清理无效', desc: '移除未使用的旧版本模板', icon: Settings, color: 'from-orange-500 to-red-500', action: () => alert('扫描并清理无效模板') },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className={`p-6 bg-gradient-to-br ${action.color} rounded-xl hover:shadow-lg transition-all cursor-pointer group`}
            >
              <action.icon className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
              <div className="font-bold text-white mb-1">{action.label}</div>
              <div className="text-sm text-white opacity-90">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Templates List with Filters */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">权限模板库</h2>
            <p className="text-sm text-gray-500">Permission Templates Library</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索模板名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="all">所有格式</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    template.format === 'json' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {template.format === 'json' ? (
                      <FileJson className="text-green-600" size={20} />
                    ) : (
                      <FileText className="text-purple-600" size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 truncate max-w-xs">{template.templateName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      template.format === 'json' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      v{template.version} · {template.format.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">角色数:</span>
                  <strong className="text-gray-900">{template.roleCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">权限数:</span>
                  <strong className="text-gray-900">{template.permissionCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">创建时间:</span>
                  <span className="text-gray-700">{template.createdAt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">使用次数:</span>
                  <strong className="text-blue-600">{template.usageCount}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => copyTemplateId(template.id)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="复制模板 ID"
                >
                  <Copy size={14} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleExportTemplate(template.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download size={14} className="inline mr-1" />
                  导出
                </button>
                <button
                  onClick={() => restoreTemplate(template.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  应用
                </button>
                <button
                  onClick={() => duplicateTemplate(template.id)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Archive className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">暂无符合条件的模板</p>
          </div>
        )}
      </div>

      {/* Import History Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">导入历史记录</h2>
            <p className="text-sm text-gray-500">Import History Log</p>
          </div>
          <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors">
            查看全部
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-zinc-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">模板名称</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">格式</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">导入时间</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">导入数量</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">执行人</th>
              </tr>
            </thead>
            <tbody>
              {importHistory.map((history) => (
                <tr key={history.id} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-900">{history.templateName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg font-semibold text-sm ${
                      history.format === 'JSON' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {history.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{history.importTime}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                    {history.importedCount}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      history.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                      history.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {history.status === 'success' && '✓ 成功'}
                      {history.status === 'partial' && '○ 部分成功'}
                      {history.status === 'failed' && '✗ 失败'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{history.executedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal Overlay */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">导入权限配置模板</h3>
                  <p className="text-sm text-gray-500">粘贴 JSON 或 YAML 格式的配置文件</p>
                </div>
                <button
                  onClick={() => { setShowImportModal(false); setImportFileContent(''); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="text-gray-600" size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">配置文件内容</label>
                <textarea
                  value={importFileContent}
                  onChange={(e) => setImportFileContent(e.target.value)}
                  placeholder='{
  "version": "1.0.0",
  "roles": [
    {
      "roleName": "测试角色",
      "roleCode": "TEST_ROLE",
      "permissions": ["perm001", "perm002"],
      "metadata": {
        "description": "测试描述",
        "userType": "business",
        "status": "active"
      }
    }
  ]
}'
                  className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-blue-600 mt-0.5" size={18} />
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold mb-1">导入注意事项</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>确保文件格式为有效的 JSON 或 YAML</li>
                      <li>角色 Code 必须唯一，重复时会被跳过</li>
                      <li>权限 ID 需存在于系统中，不存在的权限将被忽略</li>
                      <li>建议先在沙箱环境测试导入效果</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowImportModal(false); setImportFileContent(''); }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleImportTemplate}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <Upload size={18} />
                  确认导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2">AI 模板管理优化建议</div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>"只读访客权限集"模板使用频率最高（234 次），建议将其设为新员工入职默认分配模板</li>
              <li>检测到 3 个导入历史记录中出现警告，建议检查旧版本模板的兼容性</li>
              <li>当前模板库中包含 JSON(75%) 和 YAML(25%) 两种格式，建议统一为标准 JSON 格式以提高系统一致性</li>
              <li>最近一次模板导出发生在 2024-08-30，如果超过 30 天未导出，建议启用自动定期备份功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionTemplateManagerView;
