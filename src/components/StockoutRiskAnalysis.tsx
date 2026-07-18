import React, { useMemo } from 'react';
import { MergedSalesRecord } from '../types';
import { AlertOctagon, TrendingDown, ArrowDownRight, RefreshCw, BarChart, HardDrive } from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';

interface StockoutRiskAnalysisProps {
  data: MergedSalesRecord[];
}

export default function StockoutRiskAnalysis({ data }: StockoutRiskAnalysisProps) {
  // Aggregate logistics metrics by store
  const storeStockoutData = useMemo(() => {
    const storeMap: {
      [key: string]: {
        storeId: string;
        storeName: string;
        region: string;
        totalStockouts: string | number;
        avgInventory: number;
        recordsCount: number;
        unitsSold: number;
        totalNetSales: number;
        estimatedLoss: number;
      };
    } = {};

    data.forEach((r) => {
      const storeId = r.store_id;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          storeId,
          storeName: r.master_store_name || r.store_name || `Store ${storeId}`,
          region: r.master_region || r.region || 'Unknown',
          totalStockouts: 0,
          avgInventory: 0,
          recordsCount: 0,
          unitsSold: 0,
          totalNetSales: 0,
          estimatedLoss: 0,
        };
      }

      const m = storeMap[storeId];
      m.totalStockouts = Number(m.totalStockouts) + r.stockouts;
      m.avgInventory += r.inventory_on_hand;
      m.recordsCount += 1;
      m.unitsSold += r.units_sold;
      m.totalNetSales += r.net_sales;

      // Heuristic for estimated lost revenue:
      // Each stockout instance represents a product being out-of-stock.
      // Average selling price in this row = net_sales / max(1, units_sold).
      // Estimated lost units per stockout incident = 3 units.
      if (r.stockouts > 0 && r.units_sold > 0) {
        const unitPrice = r.net_sales / r.units_sold;
        m.estimatedLoss += r.stockouts * unitPrice * 3;
      }
    });

    return Object.values(storeMap)
      .map((m) => ({
        ...m,
        avgInventory: Math.round(m.avgInventory / m.recordsCount),
        estimatedLoss: Math.round(m.estimatedLoss),
      }))
      .sort((a, b) => Number(b.totalStockouts) - Number(a.totalStockouts));
  }, [data]);

  // Total summary metrics
  const summary = useMemo(() => {
    const totalStockouts = storeStockoutData.reduce((acc, curr) => acc + Number(curr.totalStockouts), 0);
    const totalEstimatedLoss = storeStockoutData.reduce((acc, curr) => acc + curr.estimatedLoss, 0);
    
    // Top stockout store
    const riskStores = storeStockoutData.filter(s => Number(s.totalStockouts) > 0);
    const primaryRiskStore = riskStores.length > 0 ? riskStores[0] : null;

    return {
      totalStockouts,
      totalEstimatedLoss,
      primaryRiskStore,
    };
  }, [storeStockoutData]);

  // Scatter chart data for inventory level vs. stockouts
  const scatterData = useMemo(() => {
    return storeStockoutData.map((s) => ({
      name: s.storeName,
      inventory: s.avgInventory,
      stockouts: Number(s.totalStockouts),
      loss: s.estimatedLoss,
      region: s.region,
    }));
  }, [storeStockoutData]);

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-100 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">{item.region} Region</p>
          <div className="space-y-1 font-sans">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Average Inventory:</span>
              <span className="font-semibold text-gray-800">{item.inventory.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Stockout Incidents:</span>
              <span className="font-semibold text-rose-600">{item.stockouts} times</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Estimated Sales Loss:</span>
              <span className="font-semibold text-indigo-600">${item.loss.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" id="stockout-risk-section">
      {/* Risk Metrics Panel (Col span 4) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs lg:col-span-4 flex flex-col justify-between" id="stockout-metrics-panel">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-medium text-xs mb-3">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            <span>Supply Chain Leakage Report</span>
          </div>
          <h3 className="text-gray-900 font-sans font-medium text-base leading-snug">
            Logistics & Stockout Leakage Analysis
          </h3>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Out-of-stock incidents trigger lost baskets and reduce customer loyalty. Our engine computes potential revenue leaks based on localized weekly sales run-rates.
          </p>

          <div className="mt-6 space-y-4" id="logistics-leak-stats">
            {/* OOS total card */}
            <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-600 block">Stockout Count</span>
                <span className="text-xl font-bold font-sans text-rose-950 mt-0.5 block">{summary.totalStockouts.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-rose-600 font-medium block">Total Incidents</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Across filtered weeks</span>
              </div>
            </div>

            {/* Financial impact card */}
            <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 block">Est. Revenue Leak</span>
                <span className="text-xl font-bold font-sans text-indigo-950 mt-0.5 block">${summary.totalEstimatedLoss.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-indigo-500 font-medium flex items-center gap-0.5 justify-end">
                  <TrendingDown className="h-3 w-3" />
                  Lost Sales
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">3 units per incident</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Risk Store alert */}
        {summary.primaryRiskStore && Number(summary.primaryRiskStore.totalStockouts) > 0 ? (
          <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-3.5 mt-4" id="risk-store-alert">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-800 block">Top High-Risk Store</span>
            <span className="text-xs font-semibold text-gray-800 block truncate mt-0.5">{summary.primaryRiskStore.storeName}</span>
            <span className="text-[10px] text-amber-700 block font-medium mt-1">
              Logged <span className="font-bold">{summary.primaryRiskStore.totalStockouts} stockouts</span> with ${summary.primaryRiskStore.estimatedLoss.toLocaleString()} lost sales. Supply chain review recommended.
            </span>
          </div>
        ) : (
          <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-3.5 mt-4 text-center text-[11px] text-emerald-800" id="risk-store-clean">
            🎉 Supply chain is highly stable. Zero stockouts recorded under current slice.
          </div>
        )}
      </div>

      {/* Stockouts vs. Inventory Scatter Map (Col span 8) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs lg:col-span-8 flex flex-col" id="stockout-scatter-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-gray-900 font-sans font-medium text-base flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-rose-500" />
              Inventory Buffers vs. Stockouts Scatter
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Identify stores with critical safety stocks: low inventory correlated with high stockouts.
            </p>
          </div>
        </div>

        <div className="h-64 w-full" id="stockout-scatter-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number"
                dataKey="inventory"
                name="Inventory Level"
                unit=" units"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                label={{ value: 'Average Inventory On Hand', position: 'bottom', offset: -10, fill: '#9ca3af', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="stockouts"
                name="Stockouts Count"
                unit=" times"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                label={{ value: 'Out of Stock Incidents', angle: -90, position: 'insideLeft', offset: 15, fill: '#9ca3af', fontSize: 10 }}
              />
              <ZAxis type="number" dataKey="loss" range={[40, 200]} name="Financial Loss" unit="$" />
              <Tooltip content={<CustomScatterTooltip />} />
              <Scatter name="Stores Safety Stock" data={scatterData} fill="#f43f5e">
                {scatterData.map((entry, index) => {
                  // Color node by regional boundaries or risk weight
                  const nodeColor = entry.stockouts > 5 ? '#e11d48' : entry.stockouts > 0 ? '#fbbf24' : '#10b981';
                  return <Cell key={`cell-${index}`} fill={nodeColor} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
