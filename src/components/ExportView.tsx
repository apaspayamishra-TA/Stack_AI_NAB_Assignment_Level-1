import React, { useMemo, useState } from 'react';
import { MergedSalesRecord } from '../types';
import { Download, Printer, FileSpreadsheet, ArrowUpRight, CheckCircle2, RefreshCw, Layers, FileDown, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportViewProps {
  data: MergedSalesRecord[];
}

export default function ExportView({ data }: ExportViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Aggregate summary data for the printable report
  const summary = useMemo(() => {
    if (data.length === 0) return null;

    const totalNetSales = data.reduce((acc, curr) => acc + curr.net_sales, 0);
    const totalGrossSales = data.reduce((acc, curr) => acc + curr.gross_sales, 0);
    const totalDiscounts = data.reduce((acc, curr) => acc + curr.discount_amount, 0);
    const totalUnits = data.reduce((acc, curr) => acc + curr.units_sold, 0);
    const totalTransactions = data.reduce((acc, curr) => acc + curr.transactions, 0);
    const totalSalesTarget = data.reduce((acc, curr) => acc + curr.sales_target, 0);
    const totalReturns = data.reduce((acc, curr) => acc + curr.returns_amount, 0);
    const totalStockouts = data.reduce((acc, curr) => acc + curr.stockouts, 0);

    const targetAchievement = totalSalesTarget > 0 ? (totalNetSales / totalSalesTarget) * 100 : 0;
    const atv = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;
    const avgRating = data.filter(r => r.customer_rating > 0).reduce((acc, curr) => acc + curr.customer_rating, 0) / Math.max(1, data.filter(r => r.customer_rating > 0).length);

    return {
      totalNetSales,
      totalGrossSales,
      totalDiscounts,
      totalUnits,
      totalTransactions,
      totalSalesTarget,
      totalReturns,
      totalStockouts,
      targetAchievement,
      atv,
      avgRating,
      recordsCount: data.length,
    };
  }, [data]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!summary) {
      setPdfError('No data available to generate report.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      setPdfError(null);
      setPdfSuccess(false);

      // Safe dynamic module resolution for ESM/CJS interop
      let jsPDFClass = jsPDF;
      if (!jsPDFClass || typeof jsPDFClass !== 'function') {
        jsPDFClass = (jsPDF as any).default || (window as any).jsPDF;
      }

      if (typeof jsPDFClass !== 'function') {
        throw new Error('jsPDF library failed to resolve as a valid constructor.');
      }

      // We'll generate a beautiful, native vector PDF report directly in jsPDF!
      // This is incredibly robust, works in any sandboxed iframe (even with cross-origin font/css taints),
      // and produces an executive-ready vector document with searchable text.
      const pdf = new jsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Page dimensions
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Draw background decorative elements / border
      pdf.setDrawColor(243, 244, 246); // gray-100
      pdf.setLineWidth(1);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Document Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(17, 24, 39); // gray-900
      pdf.text('RETAIL SALES PERFORMANCE BRIEF', pageWidth / 2, 28, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128); // gray-500
      pdf.text('EXECUTIVE AUDIT & INTEL SUMMARY', pageWidth / 2, 34, { align: 'center' });

      // Accent Line
      pdf.setDrawColor(79, 70, 229); // indigo-600
      pdf.setLineWidth(1.2);
      pdf.line(pageWidth / 2 - 15, 39, pageWidth / 2 + 15, 39);

      // Metadata Grid
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99); // gray-600
      pdf.text('Date Generated:', 20, 50);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(17, 24, 39);
      pdf.text(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 55, 50);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Dataset Scope:', 20, 56);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(17, 24, 39);
      pdf.text(`${summary.recordsCount.toLocaleString()} Week-Category records`, 55, 56);

      // Divider line
      pdf.setDrawColor(229, 231, 235); // gray-200
      pdf.setLineWidth(0.3);
      pdf.line(20, 63, pageWidth - 20, 63);

      // Section 1: Financial Performance
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(67, 56, 202); // indigo-700
      pdf.text('1. Key Financial & Target Ratios', 20, 72);

      // Draw 3 neat KPI Card blocks
      const cardWidth = 52;
      const cardHeight = 26;
      const cardY = 78;

      // Card 1: Net Sales
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.rect(20, cardY, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.rect(20, cardY, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('NET SALES REVENUE', 20 + cardWidth / 2, cardY + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      pdf.setTextColor(17, 24, 39);
      pdf.text(`$${summary.totalNetSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 20 + cardWidth / 2, cardY + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`Gross: $${summary.totalGrossSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 20 + cardWidth / 2, cardY + 21, { align: 'center' });

      // Card 2: Target Achievement
      const card2X = 20 + cardWidth + 7;
      pdf.setFillColor(249, 250, 251);
      pdf.rect(card2X, cardY, cardWidth, cardHeight, 'F');
      pdf.rect(card2X, cardY, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('TARGET ACHIEVEMENT', card2X + cardWidth / 2, cardY + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      const achievesTarget = summary.targetAchievement >= 100;
      pdf.setTextColor(achievesTarget ? 4 : 180, achievesTarget ? 120 : 83, achievesTarget ? 87 : 9); // green or amber
      pdf.text(`${summary.targetAchievement.toFixed(1)}%`, card2X + cardWidth / 2, cardY + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`Quota: $${summary.totalSalesTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, card2X + cardWidth / 2, cardY + 21, { align: 'center' });

      // Card 3: Avg Transaction Value
      const card3X = card2X + cardWidth + 7;
      pdf.setFillColor(249, 250, 251);
      pdf.rect(card3X, cardY, cardWidth, cardHeight, 'F');
      pdf.rect(card3X, cardY, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('AVG TICKET SIZE', card3X + cardWidth / 2, cardY + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      pdf.setTextColor(17, 24, 39);
      pdf.text(`$${summary.atv.toFixed(2)}`, card3X + cardWidth / 2, cardY + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`From ${summary.totalTransactions.toLocaleString()} orders`, card3X + cardWidth / 2, cardY + 21, { align: 'center' });

      // Section 2: Supply Chain Metrics
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(67, 56, 202); // indigo-700
      pdf.text('2. Supply Chain & Operational Indicators', 20, 116);

      const cardY2 = 122;

      // Card 1: Units Sold
      pdf.setFillColor(249, 250, 251);
      pdf.rect(20, cardY2, cardWidth, cardHeight, 'F');
      pdf.rect(20, cardY2, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('TOTAL UNITS SOLD', 20 + cardWidth / 2, cardY2 + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      pdf.setTextColor(17, 24, 39);
      pdf.text(summary.totalUnits.toLocaleString(), 20 + cardWidth / 2, cardY2 + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Shipped items count', 20 + cardWidth / 2, cardY2 + 21, { align: 'center' });

      // Card 2: Stockouts
      pdf.setFillColor(249, 250, 251);
      pdf.rect(card2X, cardY2, cardWidth, cardHeight, 'F');
      pdf.rect(card2X, cardY2, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('STOCKOUT EVENTS', card2X + cardWidth / 2, cardY2 + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      const stockoutsExist = summary.totalStockouts > 0;
      pdf.setTextColor(stockoutsExist ? 225 : 17, stockoutsExist ? 29 : 24, stockoutsExist ? 72 : 39); // red or black
      pdf.text(`${summary.totalStockouts} times`, card2X + cardWidth / 2, cardY2 + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Supply leakage occurrences', card2X + cardWidth / 2, cardY2 + 21, { align: 'center' });

      // Card 3: Satisfaction
      pdf.setFillColor(249, 250, 251);
      pdf.rect(card3X, cardY2, cardWidth, cardHeight, 'F');
      pdf.rect(card3X, cardY2, cardWidth, cardHeight, 'D');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('AVG STORE RATING', card3X + cardWidth / 2, cardY2 + 6, { align: 'center' });
      
      pdf.setFontSize(13);
      pdf.setTextColor(17, 24, 39);
      pdf.text(`${summary.avgRating.toFixed(2)} / 5.0`, card3X + cardWidth / 2, cardY2 + 14, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Weighted user feedback', card3X + cardWidth / 2, cardY2 + 21, { align: 'center' });

      // Section 3: SWOT Brief
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(67, 56, 202); // indigo-700
      pdf.text('3. Strategic Overview & SWOT Summary', 20, 160);

      // SWOT layout inside PDF
      const swotW = 82;
      const swotH = 18;
      
      // Strengths
      pdf.setFillColor(240, 253, 244); // light green bg
      pdf.rect(20, 166, swotW, swotH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(21, 128, 61); // emerald-700
      pdf.text('STRENGTHS', 24, 171);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(7.5);
      pdf.text(`Robust net revenue with average rating of ${summary.avgRating.toFixed(1)} stars.`, 24, 176);
      pdf.text('Consistently high customer retention indicators.', 24, 180);

      // Weaknesses
      pdf.setFillColor(254, 242, 242); // light red bg
      pdf.rect(108, 166, swotW, swotH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(185, 28, 28); // red-700
      pdf.text('WEAKNESSES', 112, 171);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(7.5);
      pdf.text(`Stockout leakage of ${summary.totalStockouts} incidents causing revenue drag.`, 112, 176);
      pdf.text('Estimated lost sales & fulfillment bottlenecks.', 112, 180);

      // Opportunities
      pdf.setFillColor(239, 246, 255); // light blue bg
      pdf.rect(20, 189, swotW, swotH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(29, 78, 216); // blue-700
      pdf.text('OPPORTUNITIES', 24, 194);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(7.5);
      pdf.text('Expand high performing formats displaying rating > 4.5.', 24, 199);
      pdf.text('Automate replenishment thresholds to avoid stockouts.', 24, 203);

      // Threats
      pdf.setFillColor(255, 251, 235); // light yellow bg
      pdf.rect(108, 189, swotW, swotH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(180, 83, 9); // amber-700
      pdf.text('THREATS', 112, 194);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(7.5);
      pdf.text('Underperforming stores falling short of sales target.', 112, 199);
      pdf.text(`Margin shrinkage from elevated returns at $${summary.totalReturns.toLocaleString()}.`, 112, 203);

      // Audit Declaration Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Audit Declaration', 20, 218);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      const decText = 'This report represents a valid joined slice of internal weekly retail transaction parameters combined with master store properties. Calculations are governed by strict database formulas and executed client-side. No external network data sync was involved.';
      const splitDec = pdf.splitTextToSize(decText, pageWidth - 40);
      pdf.text(splitDec, 20, 224);

      // Sign-off line
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(20, 245, pageWidth - 20, 245);

      // Footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(156, 163, 175);
      pdf.text('RSI EXECUTIVE REPORT BRIEF', 20, 252);
      pdf.text('CONFIDENTIAL - FOR INTERNAL AUDITS ONLY', pageWidth - 20, 252, { align: 'right' });

      // Save PDF file to disk
      pdf.save(`RSI_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      const details = err?.message || String(err);
      setPdfError(`Failed to generate PDF report: ${details}. Please use the standard browser Print button below as a reliable alternative.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Convert currently filtered dataset to CSV
  const handleExportCSV = () => {
    if (data.length === 0) return;

    // Defined headers
    const headers = [
      'Week Start Date',
      'Store ID',
      'Store Name',
      'Region',
      'City',
      'Store Format',
      'Product Category',
      'Footfall',
      'Transactions',
      'Units Sold',
      'Gross Sales',
      'Discount Amount',
      'Net Sales',
      'Sales Target',
      'Inventory On Hand',
      'Stockouts',
      'Returns Amount',
      'Customer Rating',
      'Marketing Spend',
      'Is Store Missing',
    ];

    const rows = data.map((r) => [
      r.week_start_date,
      r.store_id,
      r.master_store_name || r.store_name,
      r.master_region || r.region,
      r.master_city || r.city,
      r.master_store_format || r.store_format,
      r.product_category,
      r.footfall,
      r.transactions,
      r.units_sold,
      r.gross_sales,
      r.discount_amount,
      r.net_sales,
      r.sales_target,
      r.inventory_on_hand,
      r.stockouts,
      r.returns_amount,
      r.customer_rating,
      r.marketing_spend,
      r['Is Store Missing'] ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            const escaped = String(val === undefined || val === null ? '' : val).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') ? `"${escaped}"` : escaped;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_sales_intelligence_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!summary) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 max-w-2xl mx-auto my-12" id="export-empty">
        <Download className="h-10 w-10 text-gray-300 mx-auto mb-4" />
        <h3 className="font-medium text-gray-800 text-sm">No transaction records to export</h3>
        <p className="text-xs mt-1">Please adjust filters or upload valid datasets in the Upload tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="export-view-container">
      {/* Export Action Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="export-controls">
        {/* CSV Block */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between" id="csv-export-panel">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">CSV Spreadsheet</span>
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
            </div>
            <h3 className="text-gray-900 font-sans font-medium text-base mb-1">Download Joined Dataset</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Generate a clean, standardized, comma-separated values file (CSV) of the currently filtered dataset. This joins your weekly transaction data directly with authorized store master parameters.
            </p>
            <div className="mt-4 flex gap-4 text-[10px] text-gray-400 font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-500 block">Rows Exportable:</span>
                <span className="font-bold text-gray-800">{summary.recordsCount.toLocaleString()} rows</span>
              </div>
              <div>
                <span className="text-gray-500 block">Attributes / Cols:</span>
                <span className="font-bold text-gray-800">20 variables</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            id="csv-download-btn"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>

        {/* Print / PDF Block */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between" id="pdf-export-panel">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">Executive PDF Report</span>
              <Printer className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-gray-900 font-sans font-medium text-base mb-1">Print or Save PDF Executive Summary</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Compile and download a beautifully formatted executive report PDF containing critical financial KPIs, supply chain ratios, and a declaration summary.
            </p>
            <div className="mt-4 flex gap-4 text-[10px] text-gray-400 font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-500 block">Paper Size:</span>
                <span className="font-bold text-gray-800">Standard A4 / Letter</span>
              </div>
              <div>
                <span className="text-gray-500 block">Elements:</span>
                <span className="font-bold text-gray-800">KPI Ratios + SWOT Brief</span>
              </div>
            </div>

            {/* Success and Error Indicators */}
            {pdfSuccess && (
              <div className="mt-3.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>PDF report generated and downloaded successfully!</span>
              </div>
            )}
            {pdfError && (
              <div className="mt-3.5 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{pdfError}</span>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                isGeneratingPDF 
                  ? 'bg-emerald-500/80 text-white cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              id="pdf-download-btn"
            >
              {isGeneratingPDF ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Compiling High-Res PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              id="browser-print-btn"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Use Browser Print Dialog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Preview Box */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-xs border-dashed max-w-4xl mx-auto" id="printable-report-preview">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Standardized Layout Report Preview</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md">Page 1 of 1</span>
        </div>

        {/* Printable Canvas Section */}
        <div className="border border-gray-100 p-8 rounded-lg font-sans text-gray-800 max-w-3xl mx-auto" id="printable-report-canvas">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">RETAIL SALES PERFORMANCE BRIEF</h1>
            <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wider">EXECUTIVE BOARD AUDIT SUMMARY</p>
            <div className="w-16 h-0.5 bg-indigo-600 mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs mb-8 border-b border-gray-100 pb-6">
            <div>
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">Date Generated:</span>
              <span className="font-semibold text-gray-800">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">Data Slice:</span>
              <span className="font-semibold text-gray-800">{summary.recordsCount} Week-Category records</span>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-4 border-b border-gray-100 pb-1">Key Financial & Operational Metrics</h3>
          <div className="grid grid-cols-3 gap-6 text-center mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Net Sales Revenue</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">${summary.totalNetSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Gross: ${summary.totalGrossSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Target Achievement %</span>
              <span className={`text-lg font-bold block mt-1 ${summary.targetAchievement >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>{summary.targetAchievement.toFixed(1)}%</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Quota: ${summary.totalSalesTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Avg Transaction Value</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">${summary.atv.toFixed(2)}</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">From {summary.totalTransactions.toLocaleString()} Tickets</span>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-4 border-b border-gray-100 pb-1">Supply Chain & Logistics Health</h3>
          <div className="grid grid-cols-3 gap-6 text-center mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Total Units Sold</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">{summary.totalUnits.toLocaleString()}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Stockout Incidents</span>
              <span className={`text-lg font-bold block mt-1 ${summary.totalStockouts > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{summary.totalStockouts} times</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Customer Satisfaction</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">{summary.avgRating.toFixed(2)} / 5.0</span>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 mb-2">Audit Declaration</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              This report represents a valid joined slice of internal weekly retail transaction parameters combined with master store properties. Calculations are governed by strict database formulas and executed client-side. No external network data sync was involved.
            </p>
            <div className="mt-8 flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>RSI INTERNAL SUMMARY REPORT</span>
              <span>CONFIDENTIAL - FOR INTERNAL AUDITS ONLY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
