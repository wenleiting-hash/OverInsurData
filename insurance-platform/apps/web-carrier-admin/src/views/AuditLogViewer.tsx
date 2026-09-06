import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, CheckCircle, XCircle, Download, Filter } from 'lucide-react';

export function AuditLogViewer() {
  const { t } = useTranslation('audit');
  
  // Mock data for demo (TODO: Replace with real API call)
  const mockLoginHistory = [
    {
      id: 'log1',
      timestamp: '2026-09-04T10:30:00Z',
      username: 'admin',
      ipAddr: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0',
      status: 'success' as const,
      reason: null,
    },
    {
      id: 'log2',
      timestamp: '2026-09-04T09:15:00Z',
      username: 'john.doe',
      ipAddr: '203.45.67.89',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      status: 'failure' as const,
      reason: 'Invalid password',
    },
    {
      id: 'log3',
      timestamp: '2026-09-04T08:45:00Z',
      username: 'jane.smith',
      ipAddr: '172.16.0.50',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
      status: 'success' as const,
      reason: null,
    },
  ];

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(mockLoginHistory);

  // Filter data based on criteria
  const filteredData = data.filter(log => {
    if (dateRange.from && log.timestamp < dateRange.from) return false;
    if (dateRange.to && log.timestamp > dateRange.to) return false;
    if (searchKeyword && !log.username.includes(searchKeyword) && !log.ipAddr.includes(searchKeyword)) {
      return false;
    }
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Username', 'IP Address', 'User Agent', 'Status', 'Reason'];
    const rows = filteredData.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.username,
      log.ipAddr,
      log.userAgent.replace(/,/g, ';'),
      log.status,
      log.reason || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="text-green-600" size={18} />
    ) : (
      <XCircle className="text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#181C23]">{t('title')}</h2>
        <button
          onClick={handleExportCSV}
          disabled={filteredData.length === 0}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#0058BC] bg-white px-4 py-2.5 font-medium text-[#0058BC] hover:bg-blue-50 transition-all"
          style={{ opacity: filteredData.length === 0 ? 0.5 : 1 }}
        >
          <Download size={18} />
          {t('actions.exportCSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Filter className="text-[#0058BC]" size={18} />
          <span className="font-medium text-[#414755]">{t('filters.title')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#717786]">{t('filters.dateRange')}</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0058BC]"
              />
              <span className="text-[#717786]">→</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0058BC]"
              />
            </div>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#717786]">{t('filters.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717786]" size={16} />
              <input
                type="text"
                placeholder="用户名/IP..."
                value={searchKeyword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm outline-none focus:border-[#0058BC]"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#717786]">{t('filters.status')}</label>
            <select
              value={statusFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0058BC]"
            >
              <option value="all">{t('filtersAll')}</option>
              <option value="success">{t('status.success')}</option>
              <option value="failure">{t('status.failure')}</option>
            </select>
          </div>

          {/* Clear Actions */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateRange({ from: '', to: '' });
                setSearchKeyword('');
                setStatusFilter('all');
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-[#414755] hover:bg-gray-50"
            >
              {t('actions.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.timestamp')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.username')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.ipAddr')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.userAgent')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#414755]">
                {t('columns.reason')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-[#717786]">
                  {t('emptyState')}
                </td>
              </tr>
            ) : (
              paginatedData.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-[#414755] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#181C23]">
                    {log.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#717786]">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#9EA6B4]" />
                      {log.ipAddr}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#717786] max-w-xs truncate" title={log.userAgent}>
                    {log.userAgent}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(log.status)}
                      <span className="text-xs text-[#414755]">
                        {log.status === 'success' ? t('status.success') : t('status.failure')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#BA1A1A]">
                    {log.reason || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#717786]">
            {t('pagination.info', { 
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, filteredData.length),
              total: filteredData.length
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← {t('pagination.prev')}
            </button>
            <span className="text-sm font-medium text-[#414755]">
              {t('pagination.page', { page: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.next')} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
