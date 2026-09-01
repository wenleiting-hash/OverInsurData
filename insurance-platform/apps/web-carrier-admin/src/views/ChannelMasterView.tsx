import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search, Eye, Mail, Phone } from 'lucide-react';
import type { ViewId } from '@/App';

interface Channel {
  id: string;
  name: string;
  code: string;
  type: 'MGA' | 'MG' | 'Agent' | 'Broker';
  status: 'active' | 'inactive' | 'pending';
  email?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  createdAt: string;
}

// Mock data (临时数据源)
const mockChannels: Channel[] = [
  {
    id: 'ch1',
    name: '太平洋保险代理公司',
    code: 'TG_AGENT_001',
    type: 'Agent',
    status: 'active',
    email: 'agent@tg-insurance.com',
    phone: '+1-555-0123',
    address: '北京市朝阳区建国路 88 号',
    licenseNumber: 'LIC-2024-001',
    licenseExpiry: '2026-12-31',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'ch2',
    name: '华泰再保险公司',
    code: 'HT_REINS',
    type: 'MGA',
    status: 'active',
    email: 'contact@huatai-re.com',
    phone: '+1-555-0456',
    address: '上海市浦东新区世纪大道 100 号',
    licenseNumber: 'LIC-2024-002',
    licenseExpiry: '2027-06-30',
    createdAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'ch3',
    name: '平安保险经纪公司',
    code: 'PA_BROKER',
    type: 'Broker',
    status: 'pending',
    licenseNumber: 'LIC-2024-003',
    licenseExpiry: '2027-03-31',
    createdAt: '2024-03-10T00:00:00Z',
  },
];

export default function ChannelMasterView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = mockChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => navigateTo('channel-master')}
        >
          <Plus size={16} />
          {t('createChannel')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{mockChannels.length}</div>
          <div className="text-sm text-gray-600 mt-1">{t('totalChannels')}</div>
        </div>
        <div className="glass rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">
            {mockChannels.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">{t('activeChannels')}</div>
        </div>
        <div className="glass rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-600">
            {mockChannels.filter(c => c.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">{t('pendingApproval')}</div>
        </div>
        <div className="glass rounded-lg p-4">
          <div className="text-3xl font-bold text-red-600">
            {mockChannels.filter(c => c.licenseExpiry && new Date(c.licenseExpiry) < new Date('2026-12-31')).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">{t('expiringLicenses')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('name')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('code')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('type')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('licenseNumber')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('licenseExpiry')}</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredChannels.map(channel => (
              <tr key={channel.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{channel.name}</div>
                  <div className="text-sm text-gray-500">{channel.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {channel.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${
                    channel.type === 'MGA' ? 'bg-purple-100 text-purple-800' :
                    channel.type === 'MG' ? 'bg-blue-100 text-blue-800' :
                    channel.type === 'Agent' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {channel.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    channel.status === 'active' ? 'bg-green-100 text-green-800' :
                    channel.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`status.${channel.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {channel.licenseNumber || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {channel.licenseExpiry || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye size={18} />
                    </button>
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit size={18} />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredChannels.length} / {mockChannels.length} channels
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50" disabled>Previous</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  navigateTo: (view: ViewId) => void;
}
