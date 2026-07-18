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
  PieChart,
  Pie,
} from 'recharts';
import { MergedSalesRecord } from '../types';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

interface StorePerformanceChartProps {
  data: MergedSalesRecord[];
}

type StoreMetricOption = 'revenue' | 'units' | 'rating' | 'stockouts' | 'returns';
type DistributionOption = 'region' | 'format';

export default function StorePerformanceChart({ data }: StorePerformanceChartProps) {
  const [metric, setMetric] = useState<StoreMetricOption>('revenue');
  const [distribution, setDistribution] = useState<DistributionOption>('region');

  // 1. Process Store Comparison Data
  const storeMetrics = useMemo(() => {
    const storeMap: { [key: string]: { id: string; name: string; revenue: number; units: number; ratingSum: number; ratingCount: number; stockouts: number; returns: number } } = {};

    data.forEach((r) => {
      const storeId = r.store_id;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          id: storeId,
          name: r.master_store_name || r.store_name || `Unknown (${storeId})`,
          revenue: 0,
          units: 0,
          ratingSum: 0,
          ratingCount: 0,
          stockouts: 0,
          returns: 0,
        };
      }

      storeMap[storeId].revenue += r.net_sales;
      storeMap[storeId].units += r.units_sold;
      storeMap[storeId].stockouts += r.stockouts;
      storeMap[storeId].returns += r.returns_amount;

      if (r.customer_rating > 0) {
        storeMap[storeId].ratingSum += r.customer_rating;
        storeMap[storeId].ratingCount += 1;
      }
    });

    // Format metrics
    return Object.values(storeMap).map((s) => ({
      id: s.id,
      name: s.name,
      revenue: s.revenue,
      units: s.units,
      rating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0,
      stockouts: s.stockouts,
      returns: s.returns,
    }));
  }, [data]);

  // Sort and take top 10 based on selected metric
  const sortedStoreData = useMemo(() => {
    return [...storeMetrics]
      .sort((a, b) => {
        if (metric === 'stockouts' || metric === 'returns') {
          // Sorting descending (highest issues first)
          return b[metric] - a[metric];
        }
        return b[metric] - a[metric];
      })
      .slice(0, 10);
  }, [storeMetrics, metric]);

  // 2. Process Distribution Shares (Region or Store Format)
  const distributionData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    let totalValue = 0;

    data.forEach((r) => {
      const key = distribution === 'region' 
        ? (r.master_region !== 'Unknown' ? r.master_region : r.region)
        : (r.master_store_format !== 'Unknown' ? r.master_store_format : r.store_format);
      
      const valKey = key || 'Unknown';
      counts[valKey] = (counts[valKey] || 0) + r.net_sales;
      totalValue += r.net_sales;
    });

    const colors = ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#9ca3af'];

    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: colors[i % colors.length],
    }));
  }, [data, distribution]);

  // Leaders / Flags statistics
  const leaders = useMemo(() => {
    if (storeMetrics.length === 0) return null;
    const sortedRev = [...storeMetrics].sort((a, b) => b.revenue - a.revenue);
    const sortedRating = [...storeMetrics].sort((a, b) => b.rating - a.rating);

    return {
      topPerformer: sortedRev[0],
      topRating: sortedRating[0],
    };
  }, [storeMetrics]);

  // Label Formatter for Store metrics
  const formatMetricValue = (val: number) => {
    switch (metric) {
      case 'revenue':
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
        return `$${val.toFixed(0)}`;
      case 'units':
        if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
        return val.toLocaleString();
      case 'rating':
        return `${val.toFixed(2)} ★`;
      case 'stockouts':
        return `${val.toLocaleString()} oos`;
      case 'returns':
        if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
        return `$${val.toFixed(0)}`;
    }
  };

  // Custom Bar Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-100 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
          <p className="text-gray-400 text-[10px] mb-2 font-mono">ID: {item.id}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Net Sales:</span>
              <span className="font-semibold text-gray-800">${item.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Units Sold:</span>
              <span className="font-semibold text-gray-800">{item.units.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Avg Rating:</span>
              <span className="font-semibold text-gray-800">{item.rating.toFixed(2)} / 5.0</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Total Stockouts:</span>
              <span className="font-semibold text-rose-600">{item.stockouts}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Returned Value:</span>
              <span className="font-semibold text-amber-600">${item.returns.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Donut Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white border border-gray-100 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Revenue:</span>
            <span className="font-semibold text-gray-900">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Share:</span>
            <span className="font-semibold text-indigo-600">{item.payload.percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" id="store-performance-grid">
      
      {/* 1. Comparison Bar Chart (Col span 7) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs lg:col-span-7 flex flex-col" id="store-comparison-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-gray-900 font-sans font-medium text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Store Leaderboard Benchmarking
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Rank physical locations by key performance and supply chain stability dimensions.
            </p>
          </div>

          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as StoreMetricOption)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
            id="store-metric-selector"
          >
            <option value="revenue">Net Sales Revenue</option>
            <option value="units">Units Sold</option>
            <option value="rating">Customer Rating</option>
            <option value="stockouts">Logistics Stockouts</option>
            <option value="returns">Returns Amount</option>
          </select>
        </div>

        <div className="h-72 w-full" id="store-bar-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedStoreData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={formatMetricValue}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#4b5563', fontSize: 9 }}
                width={120}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey={metric} fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {sortedStoreData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={metric === 'stockouts' ? (entry.stockouts > 5 ? '#f43f5e' : '#10b981') : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Share Donut Chart (Col span 5) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs lg:col-span-5 flex flex-col justify-between" id="share-breakdown-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-gray-900 font-sans font-medium text-base flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-indigo-500" />
              Net Revenue Contribution
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Analyze total sales partition across geographical and organizational bounds.
            </p>
          </div>

          <div className="flex bg-gray-50 border border-gray-100 p-0.5 rounded-lg shrink-0" id="distribution-controls">
            <button
              onClick={() => setDistribution('region')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                distribution === 'region' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500'
              }`}
              id="dist-control-region"
            >
              Regions
            </button>
            <button
              onClick={() => setDistribution('format')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                distribution === 'format' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500'
              }`}
              id="dist-control-format"
            >
              Formats
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 py-2" id="distribution-donut-container">
          {/* Pie Chart element */}
          <div className="h-44 w-44 shrink-0" id="donut-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legends list */}
          <div className="space-y-2 w-full text-xs" id="distribution-legend">
            {distributionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-gray-800 font-semibold">{item.percentage.toFixed(1)}%</span>
                  <span className="text-gray-400 text-[10px] block">${(item.value / 1e3).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Highlights panel */}
        {leaders && (
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 mt-4 border border-gray-100" id="store-highlights">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Top Revenue Producer</span>
              <span className="text-xs font-semibold text-gray-800 block truncate">{leaders.topPerformer?.name}</span>
              <span className="text-[10px] text-emerald-600 block font-semibold font-mono">
                ${(leaders.topPerformer?.revenue / 1e3).toFixed(0)}K Sales
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Top Quality Rating</span>
              <span className="text-xs font-semibold text-gray-800 block truncate">{leaders.topRating?.name}</span>
              <span className="text-[10px] text-indigo-600 block font-semibold font-mono">
                {leaders.topRating?.rating.toFixed(2)} ★ Rating
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
