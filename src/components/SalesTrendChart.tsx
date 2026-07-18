import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MergedSalesRecord } from '../types';
import { TrendingUp, BarChart3, Layers } from 'lucide-react';

interface SalesTrendChartProps {
  data: MergedSalesRecord[];
}

type GroupByOption = 'total' | 'region' | 'category' | 'format';

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('total');

  // Reshape and aggregate data by week Ending
  const chartData = useMemo(() => {
    const weeksMap: { [key: string]: any } = {};

    data.forEach((r) => {
      const week = r.week_start_date;
      if (!weeksMap[week]) {
        weeksMap[week] = {
          week,
          'Net Sales': 0,
          'North': 0,
          'East': 0,
          'South': 0,
          'West': 0,
          'Unknown': 0,
          'Grocery': 0,
          'Apparel': 0,
          'Electronics': 0,
          'Home': 0,
          'Flagship': 0,
          'Supercenter': 0,
          'Express': 0,
          'Mall-Based': 0,
        };
      }

      const rev = r.net_sales;
      weeksMap[week]['Net Sales'] += rev;

      // Group by Region
      const region = r.master_region !== 'Unknown' ? r.master_region : r.region;
      if (region) {
        weeksMap[week][region] = (weeksMap[week][region] || 0) + rev;
      }

      // Group by Store Format
      const format = r.master_store_format !== 'Unknown' ? r.master_store_format : r.store_format;
      if (format) {
        weeksMap[week][format] = (weeksMap[week][format] || 0) + rev;
      }

      // Group by Category
      const cat = r.product_category || 'General';
      weeksMap[week][cat] = (weeksMap[week][cat] || 0) + rev;
    });

    // Convert map to array and sort ascending by date
    return Object.values(weeksMap).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  const formatYAxis = (tick: number) => {
    if (tick >= 1e6) return `$${(tick / 1e6).toFixed(1)}M`;
    if (tick >= 1e3) return `$${(tick / 1e3).toFixed(0)}K`;
    return `$${tick}`;
  };

  const formatDateLabel = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    // Format YYYY-MM-DD to "Mon YY"
    const date = new Date(val);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  // Custom tooltips with sleek styling matching our modern design guidelines
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Sort payload descending by value
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
      return (
        <div className="bg-white border border-gray-100 p-3.5 shadow-lg rounded-xl text-xs max-w-xs font-sans">
          <p className="font-semibold text-gray-800 mb-2 border-b border-gray-50 pb-1 font-mono text-[10px]">
            Week Starting: {label}
          </p>
          <div className="space-y-1.5">
            {sortedPayload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="text-gray-500 font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold text-gray-800 font-mono">
                  ${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render different Area layers based on selections
  const renderAreaLayers = () => {
    switch (groupBy) {
      case 'total':
        return (
          <>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="Net Sales"
              name="Net Sales"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </>
        );

      case 'region':
        return (
          <>
            <Area type="monotone" stackId="1" dataKey="North" name="North Region" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="East" name="East Region" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="South" name="South Region" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="West" name="West Region" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Unknown" name="Unknown Stores" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.15} strokeWidth={1.5} />
          </>
        );

      case 'category':
        return (
          <>
            <Area type="monotone" stackId="1" dataKey="Grocery" name="Grocery" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Apparel" name="Apparel" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Electronics" name="Electronics" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Home" name="Home Decor & DIY" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
          </>
        );

      case 'format':
        return (
          <>
            <Area type="monotone" stackId="1" dataKey="Flagship" name="Flagship Stores" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Supercenter" name="Supercenters" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Express" name="Express Hubs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" stackId="1" dataKey="Mall-Based" name="Mall-Based Boutiques" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={1.5} />
          </>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs mb-6" id="sales-trend-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-gray-900 font-sans font-medium text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Performance & Revenue Seasonality Trend
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Identify sales spikes, category splits, and store format seasonality curves over time.
          </p>
        </div>

        {/* Group Selector Controls */}
        <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl shrink-0" id="trend-group-controls">
          <button
            onClick={() => setGroupBy('total')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              groupBy === 'total' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            id="trend-group-total"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Overall
          </button>
          <button
            onClick={() => setGroupBy('region')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              groupBy === 'region' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            id="trend-group-region"
          >
            <Layers className="h-3.5 w-3.5" />
            Regions
          </button>
          <button
            onClick={() => setGroupBy('category')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              groupBy === 'category' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            id="trend-group-category"
          >
            <Layers className="h-3.5 w-3.5" />
            Categories
          </button>
          <button
            onClick={() => setGroupBy('format')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              groupBy === 'format' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            id="trend-group-format"
          >
            <Layers className="h-3.5 w-3.5" />
            Formats
          </button>
        </div>
      </div>

      <div className="h-80 w-full" id="sales-trend-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={formatDateLabel}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={formatYAxis}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#4b5563' }}
            />
            {renderAreaLayers()}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
