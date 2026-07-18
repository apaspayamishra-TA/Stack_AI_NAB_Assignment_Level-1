import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { MergedSalesRecord } from '../types';
import { Tags, Percent, ShoppingBag, ArrowUpRight } from 'lucide-react';

interface CategoryPerformanceChartProps {
  data: MergedSalesRecord[];
}

export default function CategoryPerformanceChart({ data }: CategoryPerformanceChartProps) {
  const [activeMetric, setActiveMetric] = useState<'sales' | 'units' | 'markdown'>('sales');

  const categoryMetrics = useMemo(() => {
    const catMap: { [key: string]: { name: string; sales: number; gross: number; units: number; discounts: number; transactions: number } } = {};

    data.forEach((r) => {
      const cat = r.product_category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, sales: 0, gross: 0, units: 0, discounts: 0, transactions: 0 };
      }
      catMap[cat].sales += r.net_sales;
      catMap[cat].gross += r.gross_sales;
      catMap[cat].units += r.units_sold;
      catMap[cat].discounts += r.discount_amount;
      catMap[cat].transactions += r.transactions;
    });

    return Object.values(catMap).map((c) => {
      const markdownRate = c.gross > 0 ? (c.discounts / c.gross) * 100 : 0;
      const atv = c.transactions > 0 ? c.sales / c.transactions : 0;
      return {
        ...c,
        markdownRate,
        atv,
      };
    });
  }, [data]);

  // Styling and colors matching the elegant dashboard palette
  const colors: { [key: string]: string } = {
    Grocery: '#059669', // Emerald
    Apparel: '#0ea5e9', // Sky blue
    Electronics: '#0f766e', // Deep Teal
    Home: '#3b82f6', // Corporate Blue
    General: '#64748b', // Slate Gray
  };

  const formatYAxis = (val: number) => {
    if (activeMetric === 'markdown') return `${val.toFixed(1)}%`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return val.toLocaleString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-100 p-3.5 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-semibold text-slate-900 mb-2 border-b border-gray-50 pb-1 uppercase tracking-wider text-[10px] text-sky-600">
            {item.name} Segment
          </p>
          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between gap-5">
              <span className="text-slate-500">Net Sales:</span>
              <span className="font-semibold text-slate-800">${item.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-5">
              <span className="text-slate-500">Units Sold:</span>
              <span className="font-semibold text-slate-800">{item.units.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-5">
              <span className="text-slate-500">Effective Discount:</span>
              <span className="font-semibold text-amber-600">{item.markdownRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between gap-5">
              <span className="text-slate-500">Avg Ticket Size (ATV):</span>
              <span className="font-semibold text-sky-600">${item.atv.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center text-slate-500 font-medium" id="category-performance-no-data">
        <Tags className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        No Category Performance Data Available for selected filters
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 relative overflow-hidden" id="category-performance-section">
      <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500"></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-2">
        <div>
          <h3 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
            <Tags className="h-5 w-5 text-emerald-600" />
            Category Performance & Markdown Efficiency
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Evaluate gross margin splits and promo discount rate impacts by inventory division.
          </p>
        </div>

        {/* Metric selection controls */}
        <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0" id="category-metric-controls">
          <button
            onClick={() => setActiveMetric('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeMetric === 'sales' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="cat-metric-sales"
          >
            Net Sales
          </button>
          <button
            onClick={() => setActiveMetric('units')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeMetric === 'units' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="cat-metric-units"
          >
            Units Sold
          </button>
          <button
            onClick={() => setActiveMetric('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeMetric === 'markdown' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            id="cat-metric-markdown"
          >
            Discount Rate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Column (Horizontal Bar Chart) */}
        <div className="lg:col-span-8 h-64 w-full" id="category-bar-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMetrics} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={formatYAxis}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#4b5563', fontSize: 11 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={activeMetric === 'sales' ? 'sales' : activeMetric === 'units' ? 'units' : 'markdownRate'}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              >
                {categoryMetrics.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[entry.name] || '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Insights cards Column */}
        <div className="lg:col-span-4 space-y-3" id="category-summary-cards">
          {categoryMetrics.map((cat, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: colors[cat.name] }}></span>
                <div>
                  <p className="font-medium text-xs text-gray-800">{cat.name}</p>
                  <p className="text-[10px] text-gray-400">Basket ATV: ${cat.atv.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-xs text-gray-900">
                  {activeMetric === 'sales'
                    ? `$${(cat.sales / 1e3).toFixed(0)}K`
                    : activeMetric === 'units'
                    ? cat.units.toLocaleString()
                    : `${cat.markdownRate.toFixed(1)}%`}
                </p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                  {activeMetric === 'sales' ? 'Net Sales' : activeMetric === 'units' ? 'Units' : 'Markdown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
