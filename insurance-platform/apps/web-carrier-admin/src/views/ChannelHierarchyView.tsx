import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Plus, Search, RefreshCw, ChevronRight, ChevronDown, Building2 } from 'lucide-react';

interface ChannelNode {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  parentId: string | null;
  children?: ChannelNode[];
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock tree data
const mockChannelTree: ChannelNode[] = [
  {
    id: 'c1',
    name: '总部渠道',
    code: 'HQ-001',
    type: 'MGA',
    status: 'active',
    parentId: null,
    children: [
      {
        id: 'c1-1',
        name: '华东区域中心',
        code: 'EAST-001',
        type: 'MG',
        status: 'active',
        parentId: 'c1',
        children: [
          {
            id: 'c1-1-1',
            name: '上海代理点',
            code: 'SH-001',
            type: 'Agent',
            status: 'active',
            parentId: 'c1-1',
          },
          {
            id: 'c1-1-2',
            name: '北京代理点',
            code: 'BJ-001',
            type: 'Agent',
            status: 'pending',
            parentId: 'c1-1',
          },
        ],
      },
      {
        id: 'c1-2',
        name: '华南区域中心',
        code: 'SOUTH-001',
        type: 'MG',
        status: 'active',
        parentId: 'c1',
      },
    ],
  },
  {
    id: 'c2',
    name: '西部渠道',
    code: 'WEST-001',
    type: 'Broker',
    status: 'active',
    parentId: null,
    children: [
      {
        id: 'c2-1',
        name: '四川代理中心',
        code: 'SC-001',
        type: 'Agent',
        status: 'inactive',
        parentId: 'c2',
      },
    ],
  },
];

export default function ChannelHierarchyView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['c1', 'c1-1']));
  const [treeData, setTreeData] = useState(mockChannelTree);

  // 切换节点展开/折叠
  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 递归过滤树节点（按搜索关键词）
  const filterTree = (nodes: ChannelNode[], search: string): ChannelNode[] => {
    if (!search.trim()) return nodes;
    
    return nodes.reduce<ChannelNode[]>((acc, node) => {
      const matchesSearch = 
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.code.toLowerCase().includes(search.toLowerCase());
      
      const filteredChildren = node.children ? filterTree(node.children, search) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        });
      }
      
      return acc;
    }, []);
  };

  const filteredTree = filterTree(treeData, searchTerm);

  // 递归渲染树节点
  const renderTreeNode = (node: ChannelNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        {/* Tree Node Row */}
        <div 
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 transition-colors rounded-lg"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/Collapse Toggle */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Channel Icon */}
          <Building2 size={16} className="text-blue-500" />

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm">{node.name}</div>
            <div className="text-xs text-gray-500">{node.code}</div>
          </div>

          {/* Type Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            node.type === 'MGA' ? 'bg-purple-100 text-purple-700' :
            node.type === 'MG' ? 'bg-blue-100 text-blue-700' :
            node.type === 'Agent' ? 'bg-green-100 text-green-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {t(`type.${node.type}`) || node.type}
          </span>

          {/* Status Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            node.status === 'active' ? 'bg-green-100 text-green-700' :
            node.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {t(`status.${node.status}`) || node.status}
          </span>
        </div>

        {/* Recursive Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 刷新树缓存
  const handleRefresh = () => {
    setTreeData([...mockChannelTree]);
    alert(t('refreshSuccess') || '树数据已刷新！');
  };

  // 新增根节点
  const handleAddRoot = () => {
    navigateTo('channel-onboarding');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('channelHierarchy')}</h2>
            
            <div className="flex gap-3">
              <button 
                className="btn-secondary flex items-center gap-2"
                onClick={handleRefresh}
              >
                <RefreshCw size={16} />
                {t('refresh')}
              </button>
              
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={handleAddRoot}
              >
                <Plus size={16} />
                {t('addRootNode')}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder') || t('searchChannelsPlaceholder') || '搜索渠道名称或编码...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tree Container */}
        <div className="glass rounded-lg p-6 overflow-hidden">
          {/* Tree Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 mb-2">
            <div className="col-span-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('channelName')}
            </div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('type')}
            </div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('status')}
            </div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
              {t('actions')}
            </div>
          </div>

          {/* Tree Content */}
          <div className="py-4">
            {filteredTree.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{searchTerm ? t('noResultsFound') : t('noChannelsAvailable')}</p>
              </div>
            ) : (
              filteredTree.map(node => renderTreeNode(node))
            )}
          </div>

          {/* Tree Statistics */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">{treeData.length}</span> 根节点 ·{' '}
              <span className="font-medium">
                {treeData.reduce((acc, node) => acc + (node.children?.length || 0), 0)}
              </span> 子节点
            </div>
            <div className="text-gray-500">
              {t('totalChannels')}: {mockChannelTree.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
