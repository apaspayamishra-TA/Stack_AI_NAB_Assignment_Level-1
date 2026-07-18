import React, { useState, useMemo } from 'react';
import { MergedSalesRecord } from '../types';
import { 
  AlertOctagon, 
  TrendingDown, 
  RefreshCw, 
  ShieldCheck, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  HardDrive,
  AlertTriangle
} from 'lucide-react';

interface StockoutRiskAnalysisProps {
  data: MergedSalesRecord[];
}

type SortField = 'storeName' | 'region' | 'avgInventory' | 'totalStockouts' | 'estimatedLoss' | 'riskLevel';
type SortOrder = 'asc' | 'desc';

export default function StockoutRiskAnalysis({ data }: StockoutRiskAnalysisProps) {
  const [sortField, setSortField] = useState<SortField>('totalStockouts');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Aggregate logistics metrics by store
  const storeStockoutData = useMemo(() => {
    const storeMap: {
      [key: string]: {
        storeId: string;
        storeName: string;
        region: string;
        totalStockouts: number;
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
          region: r.master_region !== 'Unknown' ? r.master_region : r.region || 'Unknown',
          totalStockouts: 0,
          avgInventory: 0,
          recordsCount: 0,
          unitsSold: 0,
          totalNetSales: 0,
          estimatedLoss: 0,
        };
      }

      const m = storeMap[storeId];
      m.totalStockouts += r.stockouts;
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
      .map((m) => {
        const avgInv = m.recordsCount > 0 ? Math.round(m.avgInventory / m.recordsCount) : 0;
        
        // Calculate a risk category
        let riskLevel = 'Low Risk';
        if (m.totalStockouts > 5) {
          riskLevel = 'High Risk';
        } else if (m.totalStockouts > 2) {
          riskLevel = 'Medium Risk';
        } else {
          riskLevel = 'Low Risk';
        }

        return {
          ...m,
          avgInventory: avgInv,
          estimatedLoss: Math.round(m.estimatedLoss),
          riskLevel,
        };
      })
      .sort((a, b) => b.totalStockouts - a.totalStockouts);
  }, [data]);

  // Total summary metrics
  const summary = useMemo(() => {
    const totalStockouts = storeStockoutData.reduce((acc, curr) => acc + curr.totalStockouts, 0);
    const totalEstimatedLoss = storeStockoutData.reduce((acc, curr) => acc + curr.estimatedLoss, 0);
    const avgInventoryAll = storeStockoutData.length > 0 
      ? Math.round(storeStockoutData.reduce((acc, curr) => acc + curr.avgInventory, 0) / storeStockoutData.length)
      : 0;

    // Top stockout store
    const riskStores = storeStockoutData.filter(s => s.totalStockouts > 0);
    const primaryRiskStore = riskStores.length > 0 ? riskStores[0] : null;

    return {
      totalStockouts,
      totalEstimatedLoss,
      avgInventoryAll,
      primaryRiskStore,
    };
  }, [storeStockoutData]);

  // Sort Heatmap Table dynamically
  const sortedStockoutData = useMemo(() => {
    return [...storeStockoutData].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'storeName') {
        comparison = a.storeName.localeCompare(b.storeName);
      } else if (sortField === 'region') {
        comparison = a.region.localeCompare(b.region);
      } else if (sortField === 'riskLevel') {
        comparison = a.riskLevel.localeCompare(b.riskLevel);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [storeStockoutData, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const RenderSortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-50 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-3.5 w-3.5 text-indigo-600" />
      : <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center text-slate-500 font-medium mb-6" id="stockout-no-data">
        <AlertOctagon className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        No Logistics Stockout Data Available for selected filters
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="stockout-risk-section">
      
      {/* 1. Supply Chain Metrics Panel (Col span 4) */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 lg:col-span-4 flex flex-col justify-between relative overflow-hidden" id="stockout-metrics-panel">
        <div className="absolute top-0 left-0 w-[4px] h-full bg-rose-500"></div>
        <div className="pl-2">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-3 font-mono uppercase tracking-widest">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            <span>Supply Chain Leakage Report</span>
          </div>
          <h3 className="text-slate-900 font-sans font-bold text-base leading-snug">
            Logistics & Stockout Leakage
          </h3>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
            Out-of-stock incidents trigger lost baskets and reduce customer loyalty. Our engine computes potential revenue leaks based on localized weekly sales run-rates.
          </p>

          <div className="mt-6 space-y-4" id="logistics-leak-stats">
            {/* OOS total card */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 block font-mono">Stockout Count</span>
                <span className="text-2xl font-extrabold font-sans text-rose-950 mt-1 block leading-none">{summary.totalStockouts.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-rose-600 font-bold block font-mono uppercase">Incidents</span>
                <span className="text-[9px] text-slate-400 block mt-1 font-mono">Across filtered weeks</span>
              </div>
            </div>

            {/* Financial impact card */}
            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 block font-mono">Est. Revenue Leak</span>
                <span className="text-2xl font-extrabold font-sans text-sky-950 mt-1 block leading-none">${summary.totalEstimatedLoss.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-sky-700 font-bold flex items-center gap-0.5 justify-end font-mono uppercase">
                  <TrendingDown className="h-3 w-3" />
                  Lost Sales
                </span>
                <span className="text-[9px] text-slate-400 block mt-1 font-mono">3 units / incident</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Risk Store alert */}
        {summary.primaryRiskStore && summary.primaryRiskStore.totalStockouts > 0 ? (
          <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 mt-5 pl-2" id="risk-store-alert">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block font-mono">Top High-Risk Store</span>
            <span className="text-xs font-bold text-slate-800 block truncate mt-1">{summary.primaryRiskStore.storeName}</span>
            <span className="text-[10px] text-amber-700 block font-medium mt-1.5 leading-relaxed">
              Logged <span className="font-extrabold">{summary.primaryRiskStore.totalStockouts} stockouts</span> with ${summary.primaryRiskStore.estimatedLoss.toLocaleString()} lost sales. Supply chain review recommended.
            </span>
          </div>
        ) : (
          <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 mt-5 text-center text-xs text-emerald-800 pl-2 font-medium" id="risk-store-clean">
            <ShieldCheck className="h-4 w-4 text-emerald-600 inline-block mr-1.5 align-middle" />
            <span className="align-middle">Supply chain is highly stable. Zero stockouts.</span>
          </div>
        )}
      </div>

      {/* 2. Stockout Risk Heatmap / Conditional Table (Col span 8) */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:shadow-sm transition-all duration-300 lg:col-span-8 flex flex-col justify-between relative overflow-hidden" id="stockout-table-panel">
        <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500"></div>
        <div className="pl-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-emerald-600" />
                Safety Stocks & Stockout Risk Matrix
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Conditional heatmap of safety buffers. Red cells indicate low safety stock paired with out-of-stocks.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
              Conditional Heatmap Table
            </span>
          </div>

          {/* Conditional Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl" id="stockout-matrix-container">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th onClick={() => handleSort('storeName')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Store</span>
                      <RenderSortIcon field="storeName" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('region')} className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Region</span>
                      <RenderSortIcon field="region" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('avgInventory')} className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors">
                    <div className="flex items-center justify-end gap-1">
                      <span>Avg Inventory On-Hand</span>
                      <RenderSortIcon field="avgInventory" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('totalStockouts')} className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors font-bold text-slate-900">
                    <div className="flex items-center justify-end gap-1">
                      <span>Stockout Incidents</span>
                      <RenderSortIcon field="totalStockouts" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('estimatedLoss')} className="px-3 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors">
                    <div className="flex items-center justify-end gap-1">
                      <span>Estimated Sales Loss</span>
                      <RenderSortIcon field="estimatedLoss" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('riskLevel')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/70 select-none group text-right transition-colors">
                    <div className="flex items-center justify-end gap-1">
                      <span>Supply Status</span>
                      <RenderSortIcon field="riskLevel" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {sortedStockoutData.map((s) => {
                  // Determine conditional styling classes for heatmapping
                  let stockoutHeatmapClass = 'text-slate-500';
                  if (s.totalStockouts > 5) {
                    stockoutHeatmapClass = 'bg-rose-50 text-rose-800 font-extrabold font-mono';
                  } else if (s.totalStockouts > 2) {
                    stockoutHeatmapClass = 'bg-amber-50 text-amber-800 font-bold font-mono';
                  } else if (s.totalStockouts > 0) {
                    stockoutHeatmapClass = 'bg-amber-50/50 text-amber-700 font-semibold font-mono';
                  } else {
                    stockoutHeatmapClass = 'bg-emerald-50/50 text-emerald-800 font-bold font-mono';
                  }

                  let inventoryHeatmapClass = 'text-slate-900';
                  if (s.avgInventory < 200) {
                    inventoryHeatmapClass = 'bg-red-50 text-red-700 font-extrabold font-mono';
                  } else if (s.avgInventory < 400) {
                    inventoryHeatmapClass = 'bg-orange-50/40 text-orange-800 font-semibold font-mono';
                  } else {
                    inventoryHeatmapClass = 'text-slate-700 font-mono font-medium';
                  }

                  let riskBadgeClass = 'bg-slate-50 text-slate-500';
                  if (s.riskLevel === 'High Risk') {
                    riskBadgeClass = 'bg-rose-600 text-white font-bold shadow-2xs';
                  } else if (s.riskLevel === 'Medium Risk') {
                    riskBadgeClass = 'bg-amber-500 text-white font-bold shadow-2xs';
                  } else {
                    riskBadgeClass = 'bg-emerald-100 text-emerald-800 font-bold';
                  }

                  return (
                    <tr key={s.storeId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.storeName}</div>
                        <div className="text-[9px] text-slate-400 font-mono font-bold mt-0.5">ID: {s.storeId}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                          {s.region}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-right font-mono font-medium ${inventoryHeatmapClass}`}>
                        {s.avgInventory.toLocaleString()} units
                      </td>
                      <td className={`px-3 py-3 text-right ${stockoutHeatmapClass}`}>
                        {s.totalStockouts > 0 ? `${s.totalStockouts} times` : '0 (Stable)'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-extrabold text-slate-950">
                        {s.estimatedLoss > 0 ? `$${s.estimatedLoss.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full ${riskBadgeClass}`}>
                          {s.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Aggregated Totals and Averages Legend */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50/60 rounded-xl p-4 border border-slate-100 mt-5 text-xs font-sans pl-2" id="stockout-table-totals">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Avg Inventory</span>
            <p className="font-extrabold text-slate-800 mt-1">{summary.avgInventoryAll.toLocaleString()} units</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Stockouts</span>
            <p className="font-extrabold text-rose-600 mt-1">{summary.totalStockouts} incidents</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Estimated Leakage</span>
            <p className="font-extrabold text-sky-700 mt-1">${summary.totalEstimatedLoss.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
