/**
 * OFAC Screening View - Glassmorphism Design
 * Part of the Compliance Module for Overseas Insurance Digital Platform
 * 
 * Features:
 * - Full list page with advanced filtering and sorting
 * - Real-time screening interface
 * - History tracking and audit trail
 */

import { useState, useMemo } from 'react';
import { ArrowLeft, Search, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Eye, Clock, FileText, Filter, Download, RefreshCw, PlusCircle } from 'lucide-react';
import type { ViewId } from '@/App';
import { OFAC_SCREENINGS, type OFACScreening } from '@/views/data/mockComplianceData';
import { useTranslation } from 'react-i18next';
import { formatOFACResult, getMatchScoreLevel, type SanctionListSource } from '@/types/compliance/ofac-screening';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function OFACScreeningView({ navigateTo }: Props) {
  const { t } = useTranslation('ofac');
  
  // State management
  const [searchKey, setSearchKey] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'entityName' | 'result' | 'matchScore'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get all screenings data
  const allScreenings: OFACScreening[] = useMemo(() => OFAC_SCREENINGS, []);

  // Extract unique countries for filter dropdown
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    allScreenings.forEach(screening => {
      if (screening.country && Array.isArray(screening.country)) {
        screening.country.forEach(c => countries.add(c));
      }
    });
    return Array.from(countries).sort();
  }, [allScreenings]);

  // Filter screenings
  const filteredScreenings = useMemo(() => {
    let result = [...allScreenings];

    // Search filter
    if (searchKey.trim()) {
      const key = searchKey.toLowerCase();
      result = result.filter(screening => 
        screening.entityName.toLowerCase().includes(key) ||
        screening.policyId?.toLowerCase().includes(key)
      );
    }

    // Result filter
    if (selectedResult !== 'all') {
      result = result.filter(s => s.result === selectedResult);
    }

    // Entity type filter
    if (selectedEntityType !== 'all') {
      result = result.filter(s => s.entityType === selectedEntityType);
    }

    // Country filter
    if (selectedCountry !== 'all') {
      result = result.filter(s => s.country?.includes(selectedCountry));
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(s => s.timestamp >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(s => s.timestamp <= dateTo);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.localeCompare(b.timestamp);
          break;
        case 'entityName':
          comparison = a.entityName.localeCompare(b.entityName);
          break;
        case 'result':
          comparison = a.result.localeCompare(b.result);
          break;
        case 'matchScore':
          comparison = (a.matchScore || 0) - (b.matchScore || 0);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [allScreenings, searchKey, selectedResult, selectedEntityType, selectedCountry, dateFrom, dateTo, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => ({
    total: allScreenings.length,
    clear: allScreenings.filter(s => s.result === 'clear').length,
    watchlist: allScreenings.filter(s => s.result === 'watchlist').length,
    blocked: allScreenings.filter(s => s.result === 'blocked').length,
    pending: allScreenings.filter(s => s.result === 'pending').length,
    avgScore: allScreenings
      .filter(s => s.matchScore)
      .reduce((sum, s) => sum + (s.matchScore || 0), 0) / Math.max(allScreenings.filter(s => s.matchScore).length, 1)
  }), [allScreenings]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusBadge = (result: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      clear: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
      watchlist: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
      blocked: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
      pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Clock },
    };
    const s = styles[result];
    const Icon = s.icon;
    return (
      <span className={`px-3 py-1.5 border rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-sm shadow-sm ${s.bg} ${s.text} ${s.border}`}>
        <Icon className="w-3.5 h-3.5" />
        {t(`result.${result}`, formatOFACResult(result as any).label)}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-600 font-bold';
    if (score >= 75) return 'text-orange-600 font-semibold';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleScreenNow = () => {
    navigateTo('appointment-new');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => navigateTo('compliance-dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-all duration-200 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">{t('page.backToDashboard')}</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-3">
              {t('page.title')}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              {t('page.description')}
            </p>
          </div>
          <Button
            onClick={handleScreenNow}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            {t('actions.addManualScreening')}
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="mb-8 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/80 to-orange-50/80 backdrop-blur-xl shadow-md">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-lg mb-2">
                ⚠️ {t('warning.mandatory')}
              </h3>
              <p className="text-sm text-red-700 leading-relaxed mb-2">
                {t('warning.message')}
              </p>
              <p className="text-xs text-red-600 italic font-medium">
                {t('warning.legal')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('stats.totalScreenings')}</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border border-emerald-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('stats.clearCount')}</p>
          <p className="text-3xl font-bold text-emerald-700">{stats.clear}</p>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border border-amber-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">{t('stats.watchlistCount')}</p>
          <p className="text-3xl font-bold text-amber-700">{stats.watchlist}</p>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border border-red-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">{t('stats.blockedCount')}</p>
          <p className="text-3xl font-bold text-red-700">{stats.blocked}</p>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border border-blue-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">{t('stats.avgMatchScore')}</p>
          <p className="text-3xl font-bold text-blue-700">{stats.avgScore.toFixed(0)}%</p>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border border-purple-200 shadow-lg hover:shadow-xl transition-shadow p-5">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">{t('stats.reviewRequired')}</p>
          <p className="text-3xl font-bold text-purple-700">{stats.watchlist + stats.blocked}</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column: Quick Screening Form */}
        <div className="xl:col-span-1">
          <Card className="p-6 sticky top-6 glass-effect">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Quick Screening
            </h2>

            {/* Subject Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('form.entityName.label')} *
              </label>
              <Input
                placeholder={t('form.entityName.placeholder')}
                className="w-full px-4 py-3 border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
              />
              <p className="text-xs text-slate-500 mt-1">{t('form.entityName.help')}</p>
            </div>

            {/* Entity Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                {t('form.entityType.label')} *
              </label>
              <div className="space-y-2">
                {['Company', 'Individual', 'Vessel', 'Aircraft'].map(type => (
                  <label
                    key={type}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer transition-all hover:bg-slate-50 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300"
                  >
                    <input
                      type="radio"
                      name="entityType"
                      value={type}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      defaultChecked={type === 'Company'}
                    />
                    <span className="text-sm font-medium text-slate-700">{t(`entityType.${type?.toLowerCase()}`, type)}</span>
                  </label>
                ))}
              </div>
            </div>

              {/* Submit Button */}
            <button
              onClick={handleScreenNow}
              className="w-full px-8 py-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {t('form.submit')}
            </button>
          </Card>
        </div>

        {/* Right Column: Table & Filters */}
        <div className="xl:col-span-3">
          {/* Toolbar */}
          <Card className="p-5 mb-6 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">{t('table.title')}</h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t('actions.downloadCSV')}
                </Button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder={t('table.searchPlaceholder')}
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
                className="pl-12 pr-4 py-3 border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
              />
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-slate-200 animate-fade-in">
                <select
                  value={selectedResult}
                  onChange={e => setSelectedResult(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">{t('filters.byResult')}</option>
                  <option value="clear">Clear</option>
                  <option value="watchlist">Watchlist</option>
                  <option value="blocked">Blocked</option>
                </select>

                <select
                  value={selectedEntityType}
                  onChange={e => setSelectedEntityType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">{t('filters.byEntityType')}</option>
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                  <option value="Vessel">Vessel</option>
                  <option value="Aircraft">Aircraft</option>
                </select>

                <select
                  value={selectedCountry}
                  onChange={e => setSelectedCountry(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">{t('filters.byCountry')}</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    placeholder={t('filters.fromDate')}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    placeholder={t('filters.toDate')}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedResult !== 'all' || selectedEntityType !== 'all' || selectedCountry !== 'all' || dateFrom || dateTo) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-600">Active filters:</span>
                {[selectedResult, selectedEntityType, selectedCountry].filter(Boolean).map((val, i) => (
                  <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {val}
                    <button onClick={() => {
                      if ([selectedResult, selectedEntityType, selectedCountry][i] === val) {
                        [selectedResult, selectedEntityType, selectedCountry][i] = 'all';
                      }
                    }} className="ml-2 hover:text-indigo-900">&times;</button>
                  </Badge>
                ))}
                {dateFrom && <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">From: {dateFrom}</Badge>}
                {dateTo && <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">To: {dateTo}</Badge>}
                <button onClick={() => {
                  setSelectedResult('all');
                  setSelectedEntityType('all');
                  setSelectedCountry('all');
                  setDateFrom('');
                  setDateTo('');
                }} className="text-sm text-slate-500 hover:text-slate-700 underline">
                  {t('filters.resetFilters')}
                </button>
              </div>
            )}
          </Card>

          {/* Data Table */}
          <Card className="overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('entityName')}
                    >
                      <div className="flex items-center gap-2">
                        {t('table.columns.entityName')}
                        {sortBy === 'entityName' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('table.columns.type')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('table.columns.country')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('result')}
                    >
                      <div className="flex items-center gap-2">
                        {t('table.columns.result')}
                        {sortBy === 'result' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('matchScore')}
                    >
                      <div className="flex items-center gap-2">
                        {t('table.columns.matchScore')}
                        {sortBy === 'matchScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center gap-2">
                        {t('table.columns.screeningDate')}
                        {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('table.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredScreenings.map(screening => (
                    <tr key={screening.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{screening.entityName}</div>
                        {screening.policyId && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Policy: {screening.policyId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {t(`entityType.${screening.entityType?.toLowerCase()}`, screening.entityType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {screening.country?.join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(screening.result)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {screening.matchScore ? (
                          <span className={`text-sm ${getScoreColor(screening.matchScore)}`}>
                            {screening.matchScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(screening.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {screening.result === 'watchlist' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-600">
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing<span className="font-semibold text-slate-900"> {filteredScreenings.length} </span>
                {filteredScreenings.length !== allScreenings.length && `of ${allScreenings.length}`} records
              </p>
            </div>

            {/* Empty State */}
            {filteredScreenings.length === 0 && (
              <div className="py-16 text-center text-slate-500">
                <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No screening records found</p>
                <p className="text-sm text-slate-400 mt-2">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
