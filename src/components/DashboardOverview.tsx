import React from 'react';
import { DollarSign, Landmark, Receipt, Percent, ShieldAlert, TrendingUp } from 'lucide-react';
import { MergedSalesRecord } from '../types';

interface DashboardOverviewProps {
  data: MergedSalesRecord[];
}

export default function DashboardOverview({ data }: DashboardOverviewProps) {
  // Compute metrics
  const totalNetSales = data.reduce((acc, curr) => acc + curr.net_sales, 0);
  const totalGrossSales = data.reduce((acc, curr) => acc + curr.gross_sales, 0);
  const totalDiscounts = data.reduce((acc, curr) => acc + curr.discount_amount, 0);
  const totalUnits = data.reduce((acc, curr) => acc + curr.units_sold, 0);
  const totalMarketing = data.reduce((acc, curr) => acc + curr.marketing_spend, 0);
  const totalReturns = data.reduce((acc, curr) => acc + curr.returns_amount, 0);
  const totalStockouts = data.reduce((acc, curr) => acc + curr.stockouts, 0);
  const totalTransactions = data.reduce((acc, curr) => acc + curr.transactions, 0);
  const totalSalesTarget = data.reduce((acc, curr) => acc + curr.sales_target, 0);
  
  const avgDiscountRate = totalGrossSales > 0 ? (totalDiscounts / totalGrossSales) * 100 : 0;
  
  // Required Formula: Target Achievement % = (Total Net Sales / Total Sales Target) * 100
  const targetAchievement = totalSalesTarget > 0 ? (totalNetSales / totalSalesTarget) * 100 : 0;

  // Required Formula: Average Transaction Value (ATV) = Total Net Sales / Total Transactions
  const atv = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;

  const validRatingRows = data.filter((r) => r.customer_rating > 0);
  const avgRating = validRatingRows.length > 0 
    ? validRatingRows.reduce((acc, curr) => acc + curr.customer_rating, 0) / validRatingRows.length
    : 0;

  // Marketing ROI (Sales / Marketing Spend)
  const marketingRoi = totalMarketing > 0 ? totalNetSales / totalMarketing : 0;

  // Returns Ratio to Net Sales (Return Rate)
  const returnsRatio = totalNetSales > 0 ? (totalReturns / totalNetSales) * 100 : 0;

  // Format Helpers
  const formatCurrency = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 font-medium mb-6" id="dashboard-overview-no-data">
        No KPI Data Available for selected filters
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8" id="dashboard-overview-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5" id="kpi-grid">
        {/* Net Sales Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden" id="kpi-card-net-sales">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-sky-500"></div>
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Net Revenue Sales</span>
            <span className="text-2xl font-extrabold font-sans text-slate-900 block truncate leading-none">
              {formatCurrency(totalNetSales)}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              Gross sales: {formatCurrency(totalGrossSales)}
            </span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Target Achievement Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden" id="kpi-card-target-achievement">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500"></div>
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Quota Achievement</span>
            <span className={`text-2xl font-extrabold font-sans block truncate leading-none ${targetAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {targetAchievement.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              Quota cap: {formatCurrency(totalSalesTarget)}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        {/* Average Transaction Value Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden" id="kpi-card-atv">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500"></div>
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Avg Ticket Value (ATV)</span>
            <span className="text-2xl font-extrabold font-sans text-slate-900 block truncate leading-none">
              ${atv.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              Transactions: {formatNumber(totalTransactions)}
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* Return Rate Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden" id="kpi-card-return-rate">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500"></div>
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Merchandise Return Rate</span>
            <span className="text-2xl font-extrabold font-sans text-rose-600 block truncate leading-none">
              {returnsRatio.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              Refund sum: {formatCurrency(totalReturns)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Discount Rate Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden" id="kpi-card-discount-rate">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500"></div>
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Effective Promo Rate</span>
            <span className="text-2xl font-extrabold font-sans text-amber-600 block truncate leading-none">
              {avgDiscountRate.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              Discounts: {formatCurrency(totalDiscounts)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Advanced performance & efficiency sub-panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="performance-insights-grid">
        {/* Marketing ROI insight */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-100/80 rounded-2xl p-5 flex justify-between items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow" id="marketing-efficiency-panel">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-emerald-500 rounded-xl text-white mt-0.5">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-emerald-950 font-sans font-bold text-sm">Marketing Investment Effectiveness (MROI)</p>
              <p className="text-emerald-800 text-xs mt-1 leading-relaxed max-w-md">
                An aggregated advertising campaign spend of <span className="font-semibold">{formatCurrency(totalMarketing)}</span> successfully generated <span className="font-semibold">{formatCurrency(totalNetSales)}</span> in net retail sales, providing strong return signals.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white border border-emerald-200/80 rounded-2xl px-4 py-2.5 text-center shadow-2xs">
            <span className="text-emerald-700 font-sans font-extrabold text-base block leading-none">{marketingRoi.toFixed(1)}x</span>
            <span className="text-[9px] text-emerald-500 block uppercase tracking-wider font-bold mt-1 font-mono">Spend ROI</span>
          </div>
        </div>

        {/* CSAT / Quality rating impact */}
        <div className="bg-gradient-to-br from-sky-50/70 to-indigo-50/70 border border-sky-100/80 rounded-2xl p-5 flex justify-between items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow" id="csat-summary-panel">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-sky-600 rounded-xl text-white mt-0.5">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-slate-950 font-sans font-bold text-sm">Customer Satisfaction & Loyalty Impact</p>
              <p className="text-sky-900 text-xs mt-1 leading-relaxed max-w-md">
                Active customer satisfaction is validated at <span className="font-semibold">{avgRating.toFixed(2)} ★</span>. Out-of-stocks and logistical delivery bottlenecks remain contained at <span className="font-semibold">{totalStockouts.toLocaleString()} incidents</span>.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white border border-sky-200/80 rounded-2xl px-4 py-2.5 text-center shadow-2xs">
            <span className="text-sky-700 font-sans font-extrabold text-base block leading-none">{avgRating.toFixed(2)}★</span>
            <span className="text-[9px] text-sky-500 block uppercase tracking-wider font-bold mt-1 font-mono">Avg Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
