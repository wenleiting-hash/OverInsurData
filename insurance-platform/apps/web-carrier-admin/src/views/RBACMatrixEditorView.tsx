import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Upload,
  RefreshCw,
  Settings,
  User,
  Eye,
  Edit,
  Save,
  Copy,
  Filter
} from 'lucide-react';

interface PermissionItem {
  id: string;
  moduleName: string;
  permissionName: string;
  action: string; // CRUD + custom actions
  category: 'read' | 'write' | 'delete' | 'manage' | 'admin';
}

interface Role {
  id: string;
  roleName: string;
  roleCode: string;
  description: string;
  userType: 'system' | 'business' | 'guest';
  status: 'active' | 'inactive' | 'testing';
  createdAt: string;
  lastModifiedBy: string;
}

interface RolePermissionMatrix {
  roleId: string;
  roleCode: string;
  permissions: {
    [key: string]: boolean; // permissionId → granted or not
  };
  inheritedFrom?: string[];
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const RBACMatrixEditorView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['permission', 'channel']);

  // Mock data - 权限项列表（按模块分组）
  const [permissionItems] = useState<PermissionItem[]>([
    { id: 'perm001', moduleName: '保险公司管理', permissionName: '查看保险公司列表', action: 'READ', category: 'read' },
    { id: 'perm002', moduleName: '保险公司管理', permissionName: '新增保险公司', action: 'CREATE', category: 'write' },
    { id: 'perm003', moduleName: '保险公司管理', permissionName: '编辑保险公司信息', action: 'UPDATE', category: 'write' },
    { id: 'perm004', moduleName: '保险公司管理', permissionName: '删除保险公司', action: 'DELETE', category: 'delete' },
    { id: 'perm005', moduleName: '保险公司管理', permissionName: '导入批量数据', action: 'IMPORT', category: 'write' },
    { id: 'perm006', moduleName: '保险公司管理', permissionName: '导出全部数据', action: 'EXPORT', category: 'write' },
    { id: 'perm007', moduleName: '保险公司管理', permissionName: '配置合作流程', action: 'CONFIGURE', category: 'manage' },
    { id: 'perm008', moduleName: '产品管理', permissionName: '查看产品信息', action: 'READ', category: 'read' },
    { id: 'perm009', moduleName: '产品管理', permissionName: '新增保险产品', action: 'CREATE', category: 'write' },
    { id: 'perm010', moduleName: '产品管理', permissionName: '编辑产品费率', action: 'UPDATE', category: 'write' },
    { id: 'perm011', moduleName: '产品管理', permissionName: '下架保险产品', action: 'DISABLE', category: 'delete' },
    { id: 'perm012', moduleName: '产品管理', permissionName: '配置产品定价策略', action: 'CONFIGURE', category: 'manage' },
    { id: 'perm013', moduleName: '渠道管理', permissionName: '查看渠道列表', action: 'READ', category: 'read' },
    { id: 'perm014', moduleName: '渠道管理', permissionName: '审核渠道入驻申请', action: 'REVIEW', category: 'manage' },
    { id: 'perm015', moduleName: '渠道管理', permissionName: '配置渠道佣金方案', action: 'CONFIGURE', category: 'manage' },
    { id: 'perm016', moduleName: '渠道管理', permissionName: '查看渠道绩效考核', action: 'READ', category: 'read' },
    { id: 'perm017', moduleName: '权限管理', permissionName: '查看角色列表', action: 'READ', category: 'read' },
    { id: 'perm018', moduleName: '权限管理', permissionName: '创建新角色', action: 'CREATE', category: 'write' },
    { id: 'perm019', moduleName: '权限管理', permissionName: '编辑角色权限', action: 'UPDATE', category: 'write' },
    { id: 'perm020', moduleName: '权限管理', permissionName: '删除角色', action: 'DELETE', category: 'delete' },
    { id: 'perm021', moduleName: '权限管理', permissionName: '配置菜单权限', action: 'CONFIGURE', category: 'manage' },
    { id: 'perm022', moduleName: '权限管理', permissionName: '配置数据权限', action: 'CONFIGURE', category: 'manage' },
    { id: 'perm023', moduleName: '系统设置', permissionName: '查看操作日志', action: 'READ', category: 'read' },
    { id: 'perm024', moduleName: '系统设置', permissionName: '管理用户账号', action: 'MANAGE_USERS', category: 'admin' },
    { id: 'perm025', moduleName: '系统设置', permissionName: '修改系统参数', action: 'CONFIGURE_SYSTEM', category: 'admin' },
  ]);

  // Mock data - 角色列表
  const [roles] = useState<Role[]>([
    { id: 'role001', roleName: '超级管理员', roleCode: 'SUPER_ADMIN', description: '拥有系统所有权限，可管理所有模块', userType: 'system', status: 'active', createdAt: '2024-01-01', lastModifiedBy: 'admin' },
    { id: 'role002', roleName: '保险公司经理', roleCode: 'INSURER_MANAGER', description: '管理保险公司及产品相关权限', userType: 'business', status: 'active', createdAt: '2024-01-15', lastModifiedBy: 'admin' },
    { id: 'role003', roleName: '渠道经理', roleCode: 'CHANNEL_MANAGER', description: '管理渠道入驻及合作伙伴关系', userType: 'business', status: 'active', createdAt: '2024-02-01', lastModifiedBy: 'admin' },
    { id: 'role004', roleName: '核保专员', roleCode: 'UNDERWRITER', description: '处理核保规则与风险评估', userType: 'business', status: 'active', createdAt: '2024-02-15', lastModifiedBy: 'admin' },
    { id: 'role005', roleName: '财务专员', roleCode: 'FINANCE_STAFF', description: '处理佣金结算与财务对账', userType: 'business', status: 'active', createdAt: '2024-03-01', lastModifiedBy: 'admin' },
    { id: 'role006', roleName: '合规审计员', roleCode: 'COMPLIANCE_AUDITOR', description: '查看合规报告与操作日志', userType: 'business', status: 'active', createdAt: '2024-03-15', lastModifiedBy: 'admin' },
    { id: 'role007', roleName: '只读访客', roleCode: 'GUEST_READONLY', description: '仅可查看公开信息，无写入权限', userType: 'guest', status: 'active', createdAt: '2024-04-01', lastModifiedBy: 'admin' },
    { id: 'role008', roleName: '测试角色（停用）', roleCode: 'TEST_ROLE', description: '用于临时测试的角色', userType: 'business', status: 'inactive', createdAt: '2024-05-01', lastModifiedBy: 'test_user' },
  ]);

  // 初始化每个角色的权限矩阵（简化版：每个角色有代表性的权限集）
  const [initialPermissionMatrix, setInitialPermissionMatrix] = useState<RolePermissionMatrix[]>([
    {
      roleId: 'role001',
      roleCode: 'SUPER_ADMIN',
      permissions: Object.fromEntries(permissionItems.map(item => [item.id, true])),
      inheritedFrom: [],
    },
    {
      roleId: 'role002',
      roleCode: 'INSURER_MANAGER',
      permissions: {
        'perm001': true, 'perm002': true, 'perm003': true, 'perm004': false,
        'perm005': true, 'perm006': true, 'perm007': true,
        'perm008': true, 'perm009': true, 'perm010': true, 'perm011': false, 'perm012': true,
      },
    },
    {
      roleId: 'role003',
      roleCode: 'CHANNEL_MANAGER',
      permissions: {
        'perm013': true, 'perm014': true, 'perm015': true,
        'perm016': true,
        'perm001': true, 'perm002': false, 'perm008': true, 'perm009': false,
      },
    },
    {
      roleId: 'role004',
      roleCode: 'UNDERWRITER',
      permissions: {
        'perm001': true, 'perm008': true, 'perm009': true, 'perm010': true,
        'perm017': true, 'perm023': true,
      },
    },
    {
      roleId: 'role005',
      roleCode: 'FINANCE_STAFF',
      permissions: {
        'perm016': true, 'perm023': true,
        'perm006': true,
      },
    },
    {
      roleId: 'role006',
      roleCode: 'COMPLIANCE_AUDITOR',
      permissions: {
        'perm017': true, 'perm023': true, 'perm001': true, 'perm008': true,
        'perm013': true, 'perm016': true,
      },
    },
    {
      roleId: 'role007',
      roleCode: 'GUEST_READONLY',
      permissions: {
        'perm001': true, 'perm008': true, 'perm013': true, 'perm016': true,
      },
    },
    {
      roleId: 'role008',
      roleCode: 'TEST_ROLE',
      permissions: {},
    },
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('role001');
  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix[]>(() => initialPermissionMatrix);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const currentMatrix = permissionMatrix.find(m => m.roleId === selectedRoleId);

  // 按模块分组权限项
  const groupedPermissions = permissionItems.reduce((acc, item) => {
    if (!acc[item.moduleName]) {
      acc[item.moduleName] = [];
    }
    acc[item.moduleName].push(item);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  const filteredPermissions = permissionItems.filter(item => {
    const matchesSearch = item.permissionName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                         item.moduleName.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePermission = (permissionId: string) => {
    if (!currentMatrix) return;
    
    setPermissionMatrix(prev => prev.map(matrix => {
      if (matrix.roleId !== selectedRoleId) return matrix;
      
      return {
        ...matrix,
        permissions: {
          ...matrix.permissions,
          [permissionId]: !matrix.permissions[permissionId],
        },
      };
    }));
  };

  const selectAllInModule = (moduleName: string, selected: boolean) => {
    if (!currentMatrix) return;
    
    const modulePermissions = permissionItems.filter(item => item.moduleName === moduleName);
    const permissionIds = modulePermissions.map(p => p.id);
    
    setPermissionMatrix(prev => prev.map(matrix => {
      if (matrix.roleId !== selectedRoleId) return matrix;
      
      const newPermissions = { ...matrix.permissions };
      permissionIds.forEach(id => {
        newPermissions[id] = selected;
      });
      
      return { ...matrix, permissions: newPermissions };
    }));
  };

  const handleExportTemplate = () => {
    alert('正在下载权限配置模板...');
  };

  const handleImportConfig = () => {
    alert('正在导入权限配置...');
  };

  const handleApplyCopyFrom = (fromRoleId: string) => {
    const sourceMatrix = permissionMatrix.find(m => m.roleId === fromRoleId);
    if (!sourceMatrix || !currentMatrix) return;
    
    setPermissionMatrix(prev => prev.map(matrix => {
      if (matrix.roleId !== selectedRoleId) return matrix;
      return { ...matrix, permissions: { ...sourceMatrix.permissions } };
    }));
    alert(`已从 "${roles.find(r => r.id === fromRoleId)?.roleName}" 复制权限配置`);
  };

  const handleSaveChanges = () => {
    alert(`已保存 "${selectedRole?.roleName}" 的权限配置变更`);
  };

  const getPermissionCount = () => {
    if (!currentMatrix) return { total: 0, granted: 0 };
    const total = Object.keys(currentMatrix.permissions).length;
    const granted = Object.values(currentMatrix.permissions).filter(v => v).length;
    return { total, granted };
  };

  const permissionStats = getPermissionCount();
  const coveragePercentage = permissionStats.total > 0 ? (permissionStats.granted / permissionStats.total * 100) : 0;

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
                RBAC 矩阵编辑器
              </h1>
              <p className="text-gray-600">Role-Based Access Control Matrix Editor</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportTemplate}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出模板
            </button>
            <button
              onClick={handleImportConfig}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Upload size={18} />
              导入配置
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Save size={18} />
              保存变更
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <User className="text-blue-600" size={24} />
            </div>
            <span className="text-xs text-blue-600 font-semibold">{roles.length}个角色</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{roles.length}</div>
          <div className="text-sm text-gray-600">总角色数</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{permissionStats.granted}</div>
          <div className="text-sm text-gray-600">已授权权限</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <XCircle className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{permissionStats.total - permissionStats.granted}</div>
          <div className="text-sm text-gray-600">未授权权限</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <Settings className="text-orange-600" size={24} />
            </div>
            <span className="text-xs text-orange-600 font-semibold">{coveragePercentage.toFixed(0)}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{coveragePercentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">权限覆盖率</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Role Selection & Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Role List Card */}
          <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">角色选择器</h2>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                {roles.length}角色
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRoleId(role.id);
                    const matrix = permissionMatrix.find(m => m.roleId === role.id);
                    if (matrix) {
                      setPermissionMatrix(prev => {
                        const updated = [...prev];
                        const index = updated.findIndex(m => m.roleId === role.id);
                        updated[index] = { ...matrix, permissions: { ...matrix.permissions } };
                        return updated;
                      });
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedRoleId === role.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900 truncate">{role.roleName}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      role.status === 'active' ? 'bg-green-100 text-green-700' :
                      role.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {role.status === 'active' ? '✓ 启用' : '○ 停用'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1 truncate">{role.roleCode}</div>
                  <div className="text-xs text-gray-500 truncate">{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Role Details */}
          {selectedRole && (
            <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">当前角色详情</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-600">角色代码:</span>
                  <strong className="text-gray-900">{selectedRole.roleCode}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-600">用户类型:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedRole.userType === 'system' ? 'bg-red-100 text-red-700' :
                    selectedRole.userType === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedRole.userType === 'system' && '系统'}
                    {selectedRole.userType === 'business' && '业务'}
                    {selectedRole.userType === 'guest' && '访客'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-600">创建时间:</span>
                  <span className="text-gray-900">{selectedRole.createdAt}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-600">最后修改:</span>
                  <span className="text-gray-900">{selectedRole.lastModifiedBy}</span>
                </div>
                <div className="pt-3">
                  <div className="text-xs text-gray-500 mb-2">权限覆盖进度条</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          coveragePercentage >= 80 ? 'bg-green-500' :
                          coveragePercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${coveragePercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{coveragePercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Copy className="text-white" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">快速操作</h2>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => handleApplyCopyFrom('role001')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 rounded-lg font-medium transition-colors text-sm"
              >
                ← 复制自「超级管理员」
              </button>
              <button
                onClick={() => handleApplyCopyFrom('role007')}
                className="w-full px-4 py-2 bg-gradient-to-r from-gray-50 to-zinc-50 hover:from-gray-100 hover:to-zinc-100 text-gray-700 rounded-lg font-medium transition-colors text-sm"
              >
                ← 复制自「只读访客」
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Permission Matrix Table */}
        <div className="lg:col-span-2">
          <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">权限配置矩阵</h2>
                <p className="text-sm text-gray-500">Select permissions for "{selectedRole?.roleName}"</p>
              </div>
              
              {/* Search & Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="搜索权限..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="all">所有类别</option>
                  <option value="read">读取</option>
                  <option value="write">写入</option>
                  <option value="delete">删除</option>
                  <option value="manage">管理</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>

            {/* Module Grouped Permissions */}
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const moduleFilteredPerms = perms.filter(p => 
                  filterCategory === 'all' || p.category === filterCategory
                );
                
                if (moduleFilteredPerms.length === 0) return null;

                return (
                  <div key={moduleName} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                          <Eye className="text-white" size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{moduleName}</div>
                          <div className="text-xs text-gray-500">
                            {moduleFilteredPerms.length}项权限 · 
                            {moduleFilteredPerms.filter(p => currentMatrix?.permissions[p.id]).length}已授权
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => selectAllInModule(moduleName, !moduleFilteredPerms.every(p => currentMatrix?.permissions[p.id]))}
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {moduleFilteredPerms.every(p => currentMatrix?.permissions[p.id]) ? '取消全选' : '全选'}
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {moduleFilteredPerms.map(permission => {
                        const isGranted = currentMatrix?.permissions[permission.id] || false;
                        
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isGranted ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isGranted}
                                onChange={() => togglePermission(permission.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{permission.permissionName}</div>
                                <div className="text-xs text-gray-500">
                                  {permission.action} · <span className="capitalize">{permission.category}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isGranted ? (
                                <CheckCircle className="text-green-600" size={20} />
                              ) : (
                                <XCircle className="text-gray-300" size={20} />
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mt-0.5">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2">AI 权限配置优化建议</div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>当前角色「{selectedRole?.roleName}」的权限覆盖率为{coveragePercentage.toFixed(1)}%，低于该用户类型的平均水平（{
                selectedRole?.userType === 'business' ? '75%' :
                selectedRole?.userType === 'system' ? '95%' : '25%'
              }），建议补充缺失的关键权限</li>
              <li>检测到未授权的「{permissionItems.find(p => p.id === 'perm019')?.permissionName}」可能导致无法完成角色职责</li>
              <li>如果此角色需要访问多个模块，建议考虑创建继承角色模板以提高一致性</li>
              <li>注意：删除「超级管理员」权限中的系统管理权限可能导致权限降级风险</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACMatrixEditorView;
