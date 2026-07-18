import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { MergedSalesRecord } from '../types';
import { 
  BarChart3, 
  Map, 
  TrendingUp, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Star, 
  Award, 
  ShoppingBag,
  Percent,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface StorePerformanceChartProps {
  data: MergedSalesRecord[];
}

type SortField = 'rank' | 'name' | 'region' | 'format' | 'sales' | 'target' | 'achievement' | 'stockouts' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function StorePerformanceChart({ data }: StorePerformanceChartProps) {
  const [sortField, setSortField] = useState<SortField>('sales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 1. Process Regional Sales Data for the Region Bar Chart
  const regionalMetrics = useMemo(() => {
    const regionMap: { [key: string]: { name: string; sales: number; target: number; transactions: number } } = {};
    let totalSales = 0;

    data.forEach((r) => {
      const reg = r.master_region !== 'Unknown' ? r.master_region : r.region;
      const regionName = reg || 'Unknown';
      if (!regionMap[regionName]) {
        regionMap[regionName] = { name: regionName, sales: 0, target: 0, transactions: 0 };
      }
      regionMap[regionName].sales += r.net_sales;
      regionMap[regionName].target += r.sales_target;
      regionMap[regionName].transactions += r.transactions;
      totalSales += r.net_sales;
    });

    const colors: { [key: string]: string } = {
      North: '#0369a1', // Ocean blue
      East: '#059669',  // Forest green
      South: '#0ea5e9', // Sky blue
      West: '#10b981',  // Bright emerald
      Unknown: '#94a3b8', // Slate gray
    };

    return Object.values(regionMap).map((item) => ({
      ...item,
      achievement: item.target > 0 ? (item.sales / item.target) * 100 : 0,
      share: totalSales > 0 ? (item.sales / totalSales) * 100 : 0,
      color: colors[item.name] || '#6366f1',
    })).sort((a, b) => b.sales - a.sales);
  }, [data]);

  // 2. Process Store Leaderboard Table Data
  const storeLeaderboardData = useMemo(() => {
    const storeMap: { 
      [key: string]: { 
        id: string; 
        name: string; 
        region: string; 
        format: string; 
        sales: number; 
        target: number; 
        stockouts: number; 
        ratingSum: number; 
        ratingCount: number; 
      } 
    } = {};

    data.forEach((r) => {
      const storeId = r.store_id;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          id: storeId,
          name: r.master_store_name || r.store_name || `Store ${storeId}`,
          region: r.master_region !== 'Unknown' ? r.master_region : r.region,
          format: r.master_store_format !== 'Unknown' ? r.master_store_format : r.store_format || 'N/A',
          sales: 0,
          target: 0,
          stockouts: 0,
          ratingSum: 0,
          ratingCount: 0,
        };
      }

      storeMap[storeId].sales += r.net_sales;
      storeMap[storeId].target += r.sales_target;
      storeMap[storeId].stockouts += r.stockouts;
      if (r.customer_rating > 0) {
        storeMap[storeId].ratingSum += r.customer_rating;
        storeMap[storeId].ratingCount += 1;
      }
    });

    // Format metrics and calculate rank based on sales
    const list = Object.values(storeMap).map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      format: s.format,
      sales: s.sales,
      target: s.target,
      achievement: s.target > 0 ? (s.sales / s.target) * 100 : 0,
      stockouts: s.stockouts,
      rating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0,
    })).sort((a, b) => b.sales - a.sales);

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [data]);

  // Sort Leaderboard Table dynamically
  const sortedLeaderboard = useMemo(() => {
    return [...storeLeaderboardData].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'region') {
        comparison = a.region.localeCompare(b.region);
      } else if (sortField === 'format') {
        comparison = a.format.localeCompare(b.format);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [storeLeaderboardData, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-100 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-semibold text-gray-900 mb-1">{item.name} Region</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Net Sales:</span>
              <span className="font-bold text-gray-800">${item.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Sales Quota Target:</span>
              <span className="font-semibold text-gray-600">${item.target.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Quota Achievement:</span>
              <span className={`font-bold ${item.achievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {item.achievement.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-50 pt-1 mt-1 text-[10px]">
              <span className="text-gray-400">Territory Share:</span>
              <span className="font-mono text-indigo-600 font-semibold">{item.share.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center text-slate-500 font-medium mb-6" id="regional-store-no-data">
        <Map className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        No Regional or Leaderboard Data Available for selected filters
      </div>
    );
  }

  const RenderSortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-50 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-3.5 w-3.5 text-sky-600" />
      : <ChevronDown className="h-3.5 w-3.5 text-sky-600" />;
  };

  const totalPeriodSales = regionalMetrics.reduce((sum, r) => sum + r.sales, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="regional-leaderboard-grid">
      
      {/* 1. Regional Performance Bar Chart (Col span 5) */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 lg:col-span-5 flex flex-col justify-between relative overflow-hidden" id="regional-chart-card">
        <div className="absolute top-0 left-0 w-[4px] h-full bg-sky-500"></div>
        <div className="mb-4 pl-2">
          <h3 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
            <Map className="h-5 w-5 text-sky-600" />
            Sales by Region
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Territory contribution breakdown and quota achievements. Total: <span className="font-extrabold text-sky-700">${totalPeriodSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </p>
        </div>

        <div className="h-72 w-full mt-2" id="regional-bar-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalMetrics} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `$${(val / 1e3).toFixed(0)}K`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar 
                dataKey="sales" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={45}
                label={{ 
                  position: 'top', 
                  fill: '#334155', 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  formatter: (val: any) => `$${(val / 1000).toFixed(0)}K`
                }}
              >
                {regionalMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Small geographic stats widget */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 pl-2" id="regional-stat-summary">
          {regionalMetrics.slice(0, 2).map((item, idx) => (
            <div key={idx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{item.name} Share</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-extrabold text-slate-800">{item.share.toFixed(1)}%</span>
                <span className="text-[9px] font-mono font-medium text-slate-400">({formatCurrency(item.sales)})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Store Leaderboard Ranked Table (Col span 7) */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 lg:col-span-7 flex flex-col relative overflow-hidden" id="store-leaderboard-card">
        <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500"></div>
        <div className="flex items-center justify-between gap-4 mb-4 pl-2">
          <div>
            <h3 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Store Leaderboard
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Ranked table of retail node metrics. Click on headers to sort dynamically.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold">
            {sortedLeaderboard.length} Stores Active
          </span>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl pl-2" id="leaderboard-table-container">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                {/* Rank Header */}
                <th 
                  onClick={() => handleSort('rank')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <RenderSortIcon field="rank" />
                  </div>
                </th>
                {/* Store Header */}
                <th 
                  onClick={() => handleSort('name')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Store</span>
                    <RenderSortIcon field="name" />
                  </div>
                </th>
                {/* Region Header */}
                <th 
                  onClick={() => handleSort('region')}
                  className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Region</span>
                    <RenderSortIcon field="region" />
                  </div>
                </th>
                {/* Sales Header */}
                <th 
                  onClick={() => handleSort('sales')}
                  className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Net Sales</span>
                    <RenderSortIcon field="sales" />
                  </div>
                </th>
                {/* Target Achievement % Header */}
                <th 
                  onClick={() => handleSort('achievement')}
                  className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Achievement</span>
                    <RenderSortIcon field="achievement" />
                  </div>
                </th>
                {/* Stockouts Header */}
                <th 
                  onClick={() => handleSort('stockouts')}
                  className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stockouts</span>
                    <RenderSortIcon field="stockouts" />
                  </div>
                </th>
                {/* Rating Header */}
                <th 
                  onClick={() => handleSort('rating')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Rating</span>
                    <RenderSortIcon field="rating" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLeaderboard.map((store) => {
                const achievementVal = store.achievement;
                return (
                  <tr 
                    key={store.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${
                      store.rank === 1 ? 'bg-amber-50/20 font-medium' : ''
                    }`}
                  >
                    {/* Rank Row */}
                    <td className="px-4 py-3.5 font-bold text-slate-500">
                      {store.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          🏆 #{store.rank}
                        </span>
                      ) : (
                        <span>#{store.rank}</span>
                      )}
                    </td>
                    {/* Store Row */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 truncate max-w-[150px]" title={store.name}>
                        {store.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">ID: {store.id} • {store.format}</div>
                    </td>
                    {/* Region Row */}
                    <td className="px-3 py-3.5">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        store.region === 'North' ? 'bg-sky-50 text-sky-700' :
                        store.region === 'East' ? 'bg-emerald-50 text-emerald-700' :
                        store.region === 'South' ? 'bg-teal-50 text-teal-700' :
                        store.region === 'West' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {store.region}
                      </span>
                    </td>
                    {/* Net Sales Row */}
                    <td className="px-3 py-3.5 text-right font-extrabold text-slate-900 font-mono">
                      {formatCurrency(store.sales)}
                    </td>
                    {/* Achievement Progress Row */}
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-mono font-bold ${
                          achievementVal >= 100 ? 'text-emerald-700' : 
                          achievementVal >= 80 ? 'text-sky-700' : 'text-amber-700'
                        }`}>
                          {achievementVal.toFixed(1)}%
                        </span>
                        <div className="w-20 bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              achievementVal >= 100 ? 'bg-emerald-500' : 
                              achievementVal >= 80 ? 'bg-sky-500' : 'bg-amber-500'
                            }`} 
                            style={{ width: `${Math.min(achievementVal, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Stockouts Warning Row */}
                    <td className="px-3 py-3.5 text-right">
                      {store.stockouts > 0 ? (
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          store.stockouts > 5 ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md' : 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md'
                        }`}>
                          <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                          {store.stockouts}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium">-</span>
                      )}
                    </td>
                    {/* Rating Stars Row */}
                    <td className="px-4 py-3.5 text-right">
                      {store.rating > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-bold text-slate-800">{store.rating.toFixed(2)}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
