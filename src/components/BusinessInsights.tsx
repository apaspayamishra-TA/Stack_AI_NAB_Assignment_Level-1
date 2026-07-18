import React, { useMemo } from 'react';
import { MergedSalesRecord } from '../types';
import {
  Brain,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle,
  HelpCircle,
  Activity,
  DollarSign,
  Award,
  ShoppingBag,
  Target
} from 'lucide-react';

interface BusinessInsightsProps {
  data: MergedSalesRecord[];
}

export default function BusinessInsights({ data }: BusinessInsightsProps) {
  // Aggregate stats from filtered data
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const totalNetSales = data.reduce((acc, curr) => acc + curr.net_sales, 0);
    const totalGrossSales = data.reduce((acc, curr) => acc + curr.gross_sales, 0);
    const totalDiscounts = data.reduce((acc, curr) => acc + curr.discount_amount, 0);
    const totalUnits = data.reduce((acc, curr) => acc + curr.units_sold, 0);
    const totalMarketing = data.reduce((acc, curr) => acc + curr.marketing_spend, 0);
    const totalReturns = data.reduce((acc, curr) => acc + curr.returns_amount, 0);
    const totalStockouts = data.reduce((acc, curr) => acc + curr.stockouts, 0);
    const totalTransactions = data.reduce((acc, curr) => acc + curr.transactions, 0);
    const totalSalesTarget = data.reduce((acc, curr) => acc + curr.sales_target, 0);

    // Regions, categories, formats, and store-level mappings
    const regionSales: { [key: string]: number } = {};
    const categorySales: { [key: string]: number } = {};
    const categoryReturns: { [key: string]: number } = {};
    const formatSales: { [key: string]: number } = {};
    const storeSales: { [key: string]: { name: string; sales: number; target: number; stockouts: number; rating: number; count: number } } = {};

    data.forEach((r) => {
      const reg = r.master_region !== 'Unknown' ? r.master_region : r.region;
      if (reg) regionSales[reg] = (regionSales[reg] || 0) + r.net_sales;

      const cat = r.product_category || 'General';
      categorySales[cat] = (categorySales[cat] || 0) + r.net_sales;
      categoryReturns[cat] = (categoryReturns[cat] || 0) + r.returns_amount;

      const fmt = r.master_store_format !== 'Unknown' ? r.master_store_format : r.store_format;
      if (fmt) formatSales[fmt] = (formatSales[fmt] || 0) + r.net_sales;

      const sId = r.store_id;
      if (!storeSales[sId]) {
        storeSales[sId] = {
          name: r.master_store_name || r.store_name || `Store ${sId}`,
          sales: 0,
          target: 0,
          stockouts: 0,
          rating: 0,
          count: 0
        };
      }
      storeSales[sId].sales += r.net_sales;
      storeSales[sId].target += r.sales_target;
      storeSales[sId].stockouts += r.stockouts;
      if (r.customer_rating > 0) {
        storeSales[sId].rating += r.customer_rating;
        storeSales[sId].count += 1;
      }
    });

    const regionSalesSorted = Object.entries(regionSales).sort((a, b) => b[1] - a[1]);
    const bestRegion = regionSalesSorted[0] || ['Unknown', 0];
    const worstRegion = regionSalesSorted[regionSalesSorted.length - 1] || ['Unknown', 0];

    const topCategory = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0] || ['Unknown', 0];
    const topFormat = Object.entries(formatSales).sort((a, b) => b[1] - a[1])[0] || ['Unknown', 0];
    
    const storePerformanceList = Object.entries(storeSales).map(([id, s]) => ({
      id,
      ...s,
      avgRating: s.count > 0 ? s.rating / s.count : 0,
      achievement: s.target > 0 ? (s.sales / s.target) * 100 : 0
    }));

    const sortedStoresBySales = [...storePerformanceList].sort((a, b) => b.sales - a.sales);
    const highestStore = sortedStoresBySales[0] || null;
    const lowestStore = sortedStoresBySales[sortedStoresBySales.length - 1] || null;

    // Categories with highest returns rates and volumes
    const categoryReturnsRates = Object.entries(categoryReturns).map(([cat, retAmount]) => {
      const sales = categorySales[cat] || 1;
      return {
        category: cat,
        returnsAmount: retAmount,
        returnRate: (retAmount / sales) * 100
      };
    });
    const highestReturnCategory = [...categoryReturnsRates].sort((a, b) => b.returnRate - a.returnRate)[0] || null;

    // Stores below target
    const storesBelowTarget = storePerformanceList.filter((s) => s.sales < s.target);

    // Financial rates
    const markdownPct = totalGrossSales > 0 ? (totalDiscounts / totalGrossSales) * 100 : 0;
    const targetAchievement = totalSalesTarget > 0 ? (totalNetSales / totalSalesTarget) * 100 : 0;
    const atv = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;
    const marketingRoi = totalMarketing > 0 ? totalNetSales / totalMarketing : 0;
    const returnsPct = totalNetSales > 0 ? (totalReturns / totalNetSales) * 100 : 0;

    // Estimated lost sales from stockouts: $45 per incident average
    const estimatedOosLoss = totalStockouts * 45;

    const top5Stores = sortedStoresBySales.slice(0, 5);
    const highestStockoutStores = [...storePerformanceList].sort((a, b) => b.stockouts - a.stockouts).slice(0, 5);

    return {
      totalNetSales,
      totalGrossSales,
      totalDiscounts,
      totalUnits,
      totalMarketing,
      totalReturns,
      totalStockouts,
      totalTransactions,
      totalSalesTarget,
      markdownPct,
      targetAchievement,
      atv,
      marketingRoi,
      returnsPct,
      estimatedOosLoss,
      topRegion: bestRegion,
      topCategory,
      topFormat,
      topStore: highestStore,
      lowestStore,
      bestRegion,
      worstRegion,
      highestReturnCategory,
      storesBelowTarget,
      top5Stores,
      highestStockoutStores,
      mostStockoutsStore: [...storePerformanceList].sort((a, b) => b.stockouts - a.stockouts)[0] || null,
      storeCount: storePerformanceList.length
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 max-w-2xl mx-auto my-12" id="insights-empty">
        <Brain className="h-10 w-10 text-gray-300 mx-auto mb-4" />
        <h3 className="font-medium text-gray-800 text-sm">No transaction records to analyze</h3>
        <p className="text-xs mt-1">Please adjust filters or load valid datasets in the Upload tab.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6" id="business-insights-container">
      {/* Top Welcome Executive Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden" id="insights-hero">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Brain className="h-4 w-4" />
            <span>Operational Diagnostic Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-medium tracking-tight">Executive Business Briefing</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Real-time heuristic auditing across physical stores and digital stockrooms. Select custom filters to refresh regional, category, and marketing multipliers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-slate-800 pt-6 text-xs" id="insights-hero-kpi-subgrid">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Net Sales Revenue</span>
              <span className="text-xl font-bold text-white block">{formatCurrency(stats.totalNetSales)}</span>
              <span className="text-[10px] text-emerald-400 font-mono">Quota met: {stats.targetAchievement.toFixed(1)}%</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Ad-Spend Efficiency</span>
              <span className="text-xl font-bold text-white block">{stats.marketingRoi.toFixed(1)}x</span>
              <span className="text-[10px] text-slate-400 block">Net sales to budget ratio</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Markdown Ratio</span>
              <span className="text-xl font-bold text-white block">{stats.markdownPct.toFixed(1)}%</span>
              <span className="text-[10px] text-amber-400 block font-mono">Total Discount: {formatCurrency(stats.totalDiscounts)}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Returns Shrinkage</span>
              <span className="text-xl font-bold text-white block">{stats.returnsPct.toFixed(1)}%</span>
              <span className="text-[10px] text-rose-400 block font-mono">Est Loss: {formatCurrency(stats.totalReturns)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Diagnostic Highlights Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs" id="strategic-highlights-section">
        <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
          <Award className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="text-gray-900 font-sans font-semibold text-base">Operational SWOT Summary Highlights</h3>
            <p className="text-[11px] text-gray-500">Instant business indicators recalculated on the fly based on current parameters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="highlights-bento-grid">
          {/* 1. Best Performing Region */}
          <div className="bg-emerald-50/30 rounded-xl border border-emerald-100/70 p-4 flex flex-col justify-between" id="highlight-best-region">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Best Performing Region</span>
              <span className="text-base font-bold text-gray-950 block">{stats.bestRegion[0]} Region</span>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Led with total net sales of <strong className="text-gray-800">{formatCurrency(stats.bestRegion[1])}</strong>, making up <strong className="text-gray-800">{((stats.bestRegion[1] / (stats.totalNetSales || 1)) * 100).toFixed(1)}%</strong> of overall revenue.
              </p>
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-2 pt-2 border-t border-emerald-100/40">★ Top Regional Market</div>
          </div>

          {/* 2. Worst Performing Region */}
          <div className="bg-rose-50/30 rounded-xl border border-rose-100/70 p-4 flex flex-col justify-between" id="highlight-worst-region">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">Worst Performing Region</span>
              <span className="text-base font-bold text-gray-950 block">{stats.worstRegion[0]} Region</span>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Lowest net revenue generator at <strong className="text-gray-800">{formatCurrency(stats.worstRegion[1])}</strong>, accounting for <strong className="text-gray-800">{((stats.worstRegion[1] / (stats.totalNetSales || 1)) * 100).toFixed(1)}%</strong> of overall revenue.
              </p>
            </div>
            <div className="text-[10px] text-rose-700 font-bold mt-2 pt-2 border-t border-rose-100/40">⚠ Needs Local Re-investment</div>
          </div>

          {/* 3. Highest Performing Store */}
          <div className="bg-indigo-50/30 rounded-xl border border-indigo-100/70 p-4 flex flex-col justify-between" id="highlight-highest-store">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-indigo-800 uppercase tracking-wider block">Highest Performing Store</span>
              {stats.topStore ? (
                <>
                  <span className="text-base font-bold text-gray-950 block truncate">{stats.topStore.name} <span className="text-xs text-indigo-600 font-mono">({stats.topStore.id})</span></span>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Closed net sales of <strong className="text-gray-800">{formatCurrency(stats.topStore.sales)}</strong>, representing <strong className="text-indigo-700">{stats.topStore.achievement.toFixed(1)}%</strong> target achievement.
                  </p>
                </>
              ) : (
                <span className="text-xs text-gray-400">N/A</span>
              )}
            </div>
            <div className="text-[10px] text-indigo-700 font-bold mt-2 pt-2 border-t border-indigo-100/40">🏆 Leading Retail Node</div>
          </div>

          {/* 4. Lowest Performing Store */}
          <div className="bg-amber-50/30 rounded-xl border border-amber-100/70 p-4 flex flex-col justify-between" id="highlight-lowest-store">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">Lowest Performing Store</span>
              {stats.lowestStore ? (
                <>
                  <span className="text-base font-bold text-gray-950 block truncate">{stats.lowestStore.name} <span className="text-xs text-amber-700 font-mono font-bold">({stats.lowestStore.id})</span></span>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Struggled at <strong className="text-gray-800">{formatCurrency(stats.lowestStore.sales)}</strong>, representing only <strong className="text-amber-800 font-bold">{stats.lowestStore.achievement.toFixed(1)}%</strong> of set target.
                  </p>
                </>
              ) : (
                <span className="text-xs text-gray-400">N/A</span>
              )}
            </div>
            <div className="text-[10px] text-amber-700 font-bold mt-2 pt-2 border-t border-amber-100/40">⚠ Action Plan Triggered</div>
          </div>

          {/* 5. Category with Highest Returns */}
          <div className="bg-purple-50/30 rounded-xl border border-purple-100/70 p-4 flex flex-col justify-between" id="highlight-return-category">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block">Highest Return Category</span>
              {stats.highestReturnCategory ? (
                <>
                  <span className="text-base font-bold text-gray-950 block">{stats.highestReturnCategory.category}</span>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Highest return value of <strong className="text-gray-800">{formatCurrency(stats.highestReturnCategory.returnsAmount)}</strong>, representing a return rate of <strong className="text-purple-700 font-bold">{stats.highestReturnCategory.returnRate.toFixed(1)}%</strong>.
                  </p>
                </>
              ) : (
                <span className="text-xs text-gray-400">N/A</span>
              )}
            </div>
            <div className="text-[10px] text-purple-700 font-bold mt-2 pt-2 border-t border-purple-100/40">↩ Return logistics warning</div>
          </div>

          {/* 6. Stores Below Target */}
          <div className="bg-orange-50/30 rounded-xl border border-orange-100/70 p-4 flex flex-col justify-between" id="highlight-stores-below-target">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-orange-800 uppercase tracking-wider block">Stores Below Quota Target</span>
              <span className="text-base font-bold text-gray-950 block">
                {stats.storesBelowTarget.length} <span className="text-xs text-gray-500">/ {stats.storeCount} Stores</span>
              </span>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                {stats.storesBelowTarget.length > 0 ? (
                  <>
                    Deficits observed in stores: <strong className="text-orange-950 font-mono text-[10px]">{stats.storesBelowTarget.map((s) => s.id).slice(0, 3).join(', ')}{stats.storesBelowTarget.length > 3 ? '...' : ''}</strong>
                  </>
                ) : (
                  'All active store targets successfully reached!'
                )}
              </p>
            </div>
            <div className="text-[10px] text-orange-700 font-bold mt-2 pt-2 border-t border-orange-100/40">⚠ Operational quota warning</div>
          </div>
        </div>
      </div>

      {/* Dynamic Store Intelligence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dynamic-store-intelligence-panels">
        {/* Top 5 Performing Stores */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs" id="top-5-performing-stores">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="text-gray-900 font-sans font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              🏆 Top 5 Performing Stores
            </h4>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">By Net Sales</span>
          </div>
          <div className="space-y-3.5">
            {stats.top5Stores.map((s, idx) => (
              <div key={s.id} className="flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-1">
                    <span>{idx + 1}. {s.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({s.id})</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Target Met: <span className={s.achievement >= 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-medium'}>{s.achievement.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 font-mono">{formatCurrency(s.sales)}</span>
                  <div className="text-[9px] text-amber-500 font-semibold">{s.avgRating.toFixed(1)} ★</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Stockout Risk Stores */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs" id="highest-stockout-risk-stores">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="text-gray-900 font-sans font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              🚨 Highest Stockout Risk Stores
            </h4>
            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">By Incidents</span>
          </div>
          <div className="space-y-3.5">
            {stats.highestStockoutStores.map((s, idx) => {
              const riskLevel = s.stockouts > 5 ? 'High Risk' : s.stockouts > 2 ? 'Medium Risk' : 'Low Risk';
              const riskColor = riskLevel === 'High Risk' ? 'text-rose-700 font-bold bg-rose-50' : riskLevel === 'Medium Risk' ? 'text-amber-700 font-semibold bg-amber-50' : 'text-emerald-700 font-medium bg-emerald-50';
              return (
                <div key={s.id} className="flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      <span>{idx + 1}. {s.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({s.id})</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Stockouts: <strong className="text-rose-700 font-mono">{s.stockouts}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block ${riskColor}`}>{riskLevel}</span>
                    {s.stockouts > 0 && (
                      <div className="text-[9px] text-gray-400 font-mono mt-0.5">Est. Loss: ${s.stockouts * 45}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stores Missing Sales Target */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between" id="stores-missing-target-panel">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-gray-900 font-sans font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                📉 Stores Missing Target
              </h4>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Deficit</span>
            </div>
            <div className="space-y-3.5 overflow-y-auto max-h-[180px] pr-1 scrollbar-thin">
              {stats.storesBelowTarget.length > 0 ? (
                stats.storesBelowTarget.map((s, idx) => {
                  const gap = s.target - s.sales;
                  return (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                          <span>{idx + 1}. {s.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({s.id})</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Target: {formatCurrency(s.target)} | Met: <span className="text-rose-600 font-bold">{s.achievement.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right text-rose-600 font-semibold font-mono">
                        -{formatCurrency(gap)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  🎉 All active stores met or exceeded target!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="swot-analysis-matrix">
        {/* STRENGTHS */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between" id="swot-strengths">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider mb-3">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Core Strengths</span>
            </div>
            <h4 className="text-gray-900 font-medium text-sm mb-2">Category Dominance & High Basket Values</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              Our analysis flags strong volume retention in high margin areas.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600 list-disc pl-4">
              <li>
                <strong className="text-gray-800">Department Anchor:</strong> The leading category under this filter selection is <span className="font-semibold text-emerald-700">{stats.topCategory[0]}</span>, contributing <span className="font-semibold">{formatCurrency(stats.topCategory[1])}</span> in overall sales.
              </li>
              <li>
                <strong className="text-gray-800">Format Performance:</strong> Store format class <span className="font-semibold text-indigo-700">{stats.topFormat[0]}</span> leads in consumer preference, generating a volume of <span className="font-semibold">{formatCurrency(stats.topFormat[1])}</span>.
              </li>
              {stats.topStore && (
                <li>
                  <strong className="text-gray-800">Flagship Location:</strong> <span className="font-semibold">{stats.topStore.name}</span> represents the crown jewel, producing <span className="font-semibold">{formatCurrency(stats.topStore.sales)}</span> with a satisfaction rating of <span className="font-semibold">{stats.topStore.avgRating.toFixed(1)}★</span>.
                </li>
              )}
            </ul>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Maximize regional allocations for {stats.topCategory[0]} products.</span>
          </div>
        </div>

        {/* WEAKNESSES */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between" id="swot-weaknesses">
          <div>
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase tracking-wider mb-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Operational Weaknesses</span>
            </div>
            <h4 className="text-gray-900 font-medium text-sm mb-2">Markdown Leakage & Return Logistics</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              Effective margins are reduced by deep discounting and regional returns.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600 list-disc pl-4">
              <li>
                <strong className="text-gray-800">Promo Elasticity:</strong> High markdown ratios (averaging <span className="font-semibold text-amber-700">{stats.markdownPct.toFixed(1)}%</span>) indicate potential over-reliance on promotional pricing.
              </li>
              <li>
                <strong className="text-gray-800">Return Drag:</strong> Customers returned <span className="font-semibold">{formatCurrency(stats.totalReturns)}</span> worth of products under these weeks, dragging net sales down by <span className="font-semibold">{stats.returnsPct.toFixed(1)}%</span>.
              </li>
              {stats.mostStockoutsStore && Number(stats.mostStockoutsStore.stockouts) > 0 && (
                <li>
                  <strong className="text-gray-800">Supply Chain Leaks:</strong> <span className="font-semibold">{stats.mostStockoutsStore.name}</span> logged <span className="font-semibold text-rose-600">{stats.mostStockoutsStore.stockouts} stockout incidents</span>, creating localized customer friction.
                </li>
              )}
            </ul>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Promotional thresholds should be capped below 12% to protect gross margin.</span>
          </div>
        </div>

        {/* OPPORTUNITIES */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between" id="swot-opportunities">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
              <Lightbulb className="h-4 w-4 shrink-0" />
              <span>Tactical Opportunities</span>
            </div>
            <h4 className="text-gray-900 font-medium text-sm mb-2">Cross-Format Rebalancing & Safe Stocking</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              Leverage stockout analytics to execute dynamic geographic inventory routing.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600 list-disc pl-4">
              <li>
                <strong className="text-gray-800">Replenishment Gains:</strong> Capping the {stats.totalStockouts} stockout incidents would reclaim an estimated <span className="font-semibold text-emerald-700">{formatCurrency(stats.estimatedOosLoss)}</span> in lost revenue opportunities.
              </li>
              <li>
                <strong className="text-gray-800">Marketing Reallocation:</strong> Reallocating marketing capital ({formatCurrency(stats.totalMarketing)}) toward under-performing store format clusters could boost conversions.
              </li>
              <li>
                <strong className="text-gray-800">Ticket Size Expansion:</strong> A 5% increase in Average Transaction Value (currently <span className="font-semibold text-indigo-600">${stats.atv.toFixed(2)}</span>) would add <span className="font-semibold">{formatCurrency(stats.totalNetSales * 0.05)}</span> directly to EBITDA.
              </li>
            </ul>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            <span>Initiate automated inventory buffers in the {stats.topRegion[0]} region.</span>
          </div>
        </div>

        {/* THREATS */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between" id="swot-threats">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider mb-3">
              <Activity className="h-4 w-4 shrink-0" />
              <span>External Risks</span>
            </div>
            <h4 className="text-gray-900 font-medium text-sm mb-2">Margin Contraction & Regional Supply Deficits</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              Competitive actions and inflation factors threatening bottom-line metrics.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600 list-disc pl-4">
              <li>
                <strong className="text-gray-800">Target Achievement Cap:</strong> Current achievement is <span className="font-semibold text-amber-600">{stats.targetAchievement.toFixed(1)}%</span>. Failure to close this {stats.targetAchievement < 100 ? (100 - stats.targetAchievement).toFixed(1) : 0}% gap could lead to year-end budget revisions.
              </li>
              <li>
                <strong className="text-gray-800">Supply Inflow:</strong> High returns rates in apparel are diluting cash flows. Return rates exceeding 5% in specific weeks warrant QC inspections.
              </li>
              <li>
                <strong className="text-gray-800">Loyalty Drainage:</strong> Continued stockouts drag CSAT. Every stockout lowers regional repeat footfall indexes by an estimated 1.8 points.
              </li>
            </ul>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            <span>Monitor supplier SLAs in Express Hub formats.</span>
          </div>
        </div>
      </div>

      {/* Advanced Action Items / Recommendations Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs" id="strategic-roadmap">
        <h3 className="text-gray-900 font-sans font-medium text-base mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-indigo-500" />
          Retail Management Action Roadmap
        </h3>
        <div className="space-y-4 text-xs text-gray-600" id="roadmap-items">
          <div className="flex gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <span className="h-6 w-6 bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <h5 className="font-semibold text-gray-900 mb-1">Audit Promotion Pricing Thresholds</h5>
              <p className="leading-relaxed text-gray-500">
                With a promo discount rate of <span className="font-semibold text-amber-700">{stats.markdownPct.toFixed(1)}%</span>, gross margins are taking a considerable hit. Transition from flat markdowns to volume-based bundles (e.g. "Buy 2 Get 15% Off") to preserve basket size while boosting absolute dollar margins.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <span className="h-6 w-6 bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <h5 className="font-semibold text-gray-900 mb-1">Deploy Safe-Stock Buffers for High-Velocity Departments</h5>
              <p className="leading-relaxed text-gray-500">
                The leading category is <span className="font-semibold text-emerald-700">{stats.topCategory[0]}</span>, representing the highest customer pull. Ensure safety inventory thresholds are increased by 15% for flagship nodes during seasonal surges to prevent stockout leakages that have already cost the firm an estimated <span className="font-semibold text-rose-600">{formatCurrency(stats.estimatedOosLoss)}</span> in lost opportunities.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <span className="h-6 w-6 bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <h5 className="font-semibold text-gray-900 mb-1">QC Returns Investigation</h5>
              <p className="leading-relaxed text-gray-500">
                Customer returns representing <span className="font-semibold text-rose-700">{stats.returnsPct.toFixed(1)}%</span> of net sales (amounting to <span className="font-semibold">{formatCurrency(stats.totalReturns)}</span>) indicate structural quality or sizing issues. Coordinate a comprehensive batch review of returns particularly in high-frequency apparel products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
