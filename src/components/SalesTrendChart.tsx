import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

  const totalRevenue = useMemo(() => {
    return data.reduce((acc, r) => acc + r.net_sales, 0);
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
    
    // Parse parts as numbers to represent local time (preventing timezone-shift bugs)
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    
    if (isNaN(date.getTime())) return val;
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

  // Render different Line layers based on selections
  const renderLineLayers = () => {
    switch (groupBy) {
      case 'total':
        return (
          <Line
            type="monotone"
            dataKey="Net Sales"
            name="Net Sales"
            stroke="#0284c7"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 1 }}
            activeDot={{ r: 6 }}
          />
        );

      case 'region':
        return (
          <>
            <Line type="monotone" dataKey="North" name="North Region" stroke="#0369a1" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="East" name="East Region" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="South" name="South Region" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="West" name="West Region" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Unknown" name="Unknown Stores" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 3 }} />
          </>
        );

      case 'category':
        return (
          <>
            <Line type="monotone" dataKey="Grocery" name="Grocery" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Apparel" name="Apparel" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Electronics" name="Electronics" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Home" name="Home Decor & DIY" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
          </>
        );

      case 'format':
        return (
          <>
            <Line type="monotone" dataKey="Flagship" name="Flagship Stores" stroke="#0369a1" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Supercenter" name="Supercenters" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Express" name="Express Hubs" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Mall-Based" name="Mall-Based Boutiques" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
          </>
        );
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center text-slate-500 font-medium mb-6" id="sales-trend-no-data">
        <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        No Weekly Trend Data Available for selected filters
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 mb-6 relative overflow-hidden" id="sales-trend-section">
      <div className="absolute top-0 left-0 w-[4px] h-full bg-sky-500"></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-2">
        <div>
          <h3 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-600" />
            Performance & Revenue Seasonality Trend
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Identify sales spikes, category splits, and store format seasonality curves over time.
            Total Period Net Sales: <span className="font-extrabold text-sky-700 font-mono">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </p>
        </div>

        {/* Group Selector Controls */}
        <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0" id="trend-group-controls">
          <button
            onClick={() => setGroupBy('total')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              groupBy === 'total' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="trend-group-total"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Overall
          </button>
          <button
            onClick={() => setGroupBy('region')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              groupBy === 'region' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="trend-group-region"
          >
            <Layers className="h-3.5 w-3.5" />
            Regions
          </button>
          <button
            onClick={() => setGroupBy('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              groupBy === 'category' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="trend-group-category"
          >
            <Layers className="h-3.5 w-3.5" />
            Categories
          </button>
          <button
            onClick={() => setGroupBy('format')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              groupBy === 'format' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
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
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            {renderLineLayers()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
