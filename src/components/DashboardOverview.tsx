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

  return (
    <div className="space-y-5 mb-6" id="dashboard-overview-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="kpi-grid">
        {/* Net Sales Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4.5 shadow-xs flex items-center justify-between" id="kpi-card-net-sales">
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate">Net Sales</span>
            <span className="text-xl font-sans font-bold text-gray-900 block truncate">
              {formatCurrency(totalNetSales)}
            </span>
            <span className="text-[9px] text-gray-400 block font-mono truncate">
              Gross: {formatCurrency(totalGrossSales)}
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Target Achievement Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4.5 shadow-xs flex items-center justify-between" id="kpi-card-target-achievement">
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate">Target Achievement</span>
            <span className={`text-xl font-sans font-bold block truncate ${targetAchievement >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {targetAchievement.toFixed(1)}%
            </span>
            <span className="text-[9px] text-gray-400 block font-mono truncate">
              Target: {formatCurrency(totalSalesTarget)}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        {/* Average Transaction Value Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4.5 shadow-xs flex items-center justify-between" id="kpi-card-atv">
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate">Avg Ticket Size</span>
            <span className="text-xl font-sans font-bold text-gray-900 block truncate">
              ${atv.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-400 block font-mono truncate">
              Tickets: {formatNumber(totalTransactions)}
            </span>
          </div>
          <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600 shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* Return Rate Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4.5 shadow-xs flex items-center justify-between" id="kpi-card-return-rate">
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate">Return Rate</span>
            <span className="text-xl font-sans font-bold text-rose-700 block truncate">
              {returnsRatio.toFixed(2)}%
            </span>
            <span className="text-[9px] text-gray-400 block font-mono truncate">
              Returns: {formatCurrency(totalReturns)}
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Discount Rate Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4.5 shadow-xs flex items-center justify-between" id="kpi-card-discount-rate">
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate">Discount Rate</span>
            <span className="text-xl font-sans font-bold text-amber-700 block truncate">
              {avgDiscountRate.toFixed(2)}%
            </span>
            <span className="text-[9px] text-gray-400 block font-mono truncate">
              Promo saved: {formatCurrency(totalDiscounts)}
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Advanced performance & efficiency sub-panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="performance-insights-grid">
        {/* Marketing ROI insight */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center gap-3 shadow-xs" id="marketing-efficiency-panel">
          <div className="flex gap-2.5 items-center">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-emerald-950 font-medium text-xs">Marketing Investment Efficiency</p>
              <p className="text-emerald-700 text-[10px] leading-relaxed">
                Total advertising and marketing spend of <span className="font-semibold">{formatCurrency(totalMarketing)}</span> yielded <span className="font-semibold">{formatCurrency(totalNetSales)}</span> in net retail sales.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-center shadow-xs">
            <span className="text-emerald-900 font-sans font-bold text-sm block">{marketingRoi.toFixed(1)}x</span>
            <span className="text-[9px] text-emerald-500 block uppercase tracking-wider font-semibold">Spend ROI</span>
          </div>
        </div>

        {/* CSAT / Quality rating impact */}
        <div className="bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center gap-3 shadow-xs" id="csat-summary-panel">
          <div className="flex gap-2.5 items-center">
            <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <p className="text-indigo-950 font-medium text-xs">Customer Satisfaction Rating</p>
              <p className="text-indigo-700 text-[10px] leading-relaxed">
                Overall customer satisfaction is rated at <span className="font-semibold">{avgRating.toFixed(2)} ★</span> based on transactions, with {totalStockouts.toLocaleString()} total stockouts recorded.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-center shadow-xs">
            <span className="text-amber-600 font-sans font-bold text-sm block">{avgRating.toFixed(2)}★</span>
            <span className="text-[9px] text-indigo-500 block uppercase tracking-wider font-semibold">Avg Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
}
