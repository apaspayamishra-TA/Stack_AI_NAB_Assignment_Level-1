import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight, Download, Info } from 'lucide-react';
import { WeeklySalesRecord, StoreMasterRecord } from '../types';
import { downloadStoreMasterExcel, downloadWeeklySalesExcel } from '../sampleDataGenerator';

interface FileUploaderProps {
  onDataLoaded: (sales: WeeklySalesRecord[], stores: StoreMasterRecord[]) => void;
}

export default function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [salesFile, setSalesFile] = useState<{ name: string; size: string; rows: number } | null>(null);
  const [storesFile, setStoresFile] = useState<{ name: string; size: string; rows: number } | null>(null);

  const [salesData, setSalesData] = useState<WeeklySalesRecord[] | null>(null);
  const [storesData, setStoresData] = useState<StoreMasterRecord[] | null>(null);

  const [salesError, setSalesError] = useState<string | null>(null);
  const [storesError, setStoresError] = useState<string | null>(null);

  const [isDraggingSales, setIsDraggingSales] = useState(false);
  const [isDraggingStores, setIsDraggingStores] = useState(false);

  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  const salesInputRef = useRef<HTMLInputElement>(null);
  const storesInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSalesFileParsed = (file: File, parsedData: any[]) => {
    // Validate headers
    if (parsedData.length === 0) {
      setSalesError('The Weekly Sales file appears to be empty.');
      return;
    }

    const firstRowKeys = Object.keys(parsedData[0]);
    const required = ['store_id', 'week_start_date', 'gross_sales'];
    const missing = required.filter((req) => !firstRowKeys.includes(req));

    if (missing.length > 0) {
      setSalesError(`Missing columns: ${missing.join(', ')}. Please ensure this is the Weekly Sales file.`);
      return;
    }

    // Process and cast types
    const sanitized: WeeklySalesRecord[] = parsedData.map((row) => ({
      week_start_date: String(row['week_start_date'] || ''),
      region: String(row['region'] || 'Unknown').trim(),
      store_id: String(row['store_id'] || '').trim(),
      store_name: String(row['store_name'] || '').trim(),
      city: String(row['city'] || 'Unknown').trim(),
      store_format: String(row['store_format'] || 'Unknown').trim(),
      product_category: String(row['product_category'] || 'General').trim(),
      footfall: Number(row['footfall'] || 0),
      transactions: Number(row['transactions'] || 0),
      units_sold: Number(row['units_sold'] || 0),
      gross_sales: Number(row['gross_sales'] || 0),
      discount_amount: Number(row['discount_amount'] || 0),
      net_sales: Number(row['net_sales'] || 0),
      sales_target: Number(row['sales_target'] || 0),
      inventory_on_hand: Number(row['inventory_on_hand'] || 0),
      stockouts: Number(row['stockouts'] || 0),
      returns_amount: Number(row['returns_amount'] || 0),
      customer_rating: Number(row['customer_rating'] || 0),
      marketing_spend: Number(row['marketing_spend'] || 0),
    }));

    setSalesData(sanitized);
    setSalesFile({
      name: file.name,
      size: formatBytes(file.size),
      rows: sanitized.length,
    });
    setSalesError(null);
  };

  const handleStoresFileParsed = (file: File, parsedData: any[]) => {
    if (parsedData.length === 0) {
      setStoresError('The Store Master file appears to be empty.');
      return;
    }

    const firstRowKeys = Object.keys(parsedData[0]);
    const required = ['store_id', 'store_name', 'region', 'city', 'store_format'];
    const missing = required.filter((req) => !firstRowKeys.includes(req));

    if (missing.length > 0) {
      setStoresError(`Missing columns: ${missing.join(', ')}. Please ensure this is the Store Master file.`);
      return;
    }

    const sanitized: StoreMasterRecord[] = parsedData.map((row) => ({
      store_id: String(row['store_id'] || '').trim(),
      store_name: String(row['store_name'] || '').trim(),
      region: String(row['region'] || 'Unknown').trim(),
      city: String(row['city'] || 'Unknown').trim(),
      store_format: String(row['store_format'] || 'Unknown').trim(),
    }));

    setStoresData(sanitized);
    setStoresFile({
      name: file.name,
      size: formatBytes(file.size),
      rows: sanitized.length,
    });
    setStoresError(null);
  };

  const processExcel = (file: File, onComplete: (data: any[]) => void, onError: (err: string) => void, loadingSetter: (loading: boolean) => void) => {
    if (!file.name.endsWith('.xlsx')) {
      onError('Only Excel files (.xlsx) are supported.');
      return;
    }

    loadingSetter(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Could not read file data.');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        onComplete(json);
      } catch (err: any) {
        onError(`Error parsing file: ${err.message || 'Unknown error'}`);
      } finally {
        loadingSetter(false);
      }
    };

    reader.onerror = () => {
      onError('File reading failed.');
      loadingSetter(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleDragOverSales = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSales(true);
  };

  const handleDragLeaveSales = () => {
    setIsDraggingSales(false);
  };

  const handleDropSales = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSales(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcel(e.dataTransfer.files[0], (data) => handleSalesFileParsed(e.dataTransfer.files[0], data), setSalesError, setIsLoadingSales);
    }
  };

  const handleDragOverStores = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStores(true);
  };

  const handleDragLeaveStores = () => {
    setIsDraggingStores(false);
  };

  const handleDropStores = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStores(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcel(e.dataTransfer.files[0], (data) => handleStoresFileParsed(e.dataTransfer.files[0], data), setStoresError, setIsLoadingStores);
    }
  };

  const handleSalesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcel(e.target.files[0], (data) => handleSalesFileParsed(e.target.files![0], data), setSalesError, setIsLoadingSales);
    }
  };

  const handleStoresSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcel(e.target.files[0], (data) => handleStoresFileParsed(e.target.files![0], data), setStoresError, setIsLoadingStores);
    }
  };

  const handleLaunchDashboard = () => {
    if (salesData && storesData) {
      onDataLoaded(salesData, storesData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-sans font-medium tracking-tight text-gray-900 mb-3" id="app-title">
          Retail Sales Intelligence
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed" id="app-subtitle">
          Upload weekly sales and store master sheets to power instant business diagnostics, seasonality curves, region analysis, and metrics.
        </p>
      </div>

      {/* Demo Starter Kit banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs" id="demo-banner">
        <div className="flex gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-amber-900 font-medium text-sm">Need sample datasets to try it out?</h4>
            <p className="text-amber-700 text-xs mt-0.5 max-w-lg">
              Download our generated demo datasets with realistic retail metrics. Store master excludes stores ST019 and ST020 to showcase warning triggers.
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={downloadStoreMasterExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors cursor-pointer w-full md:w-auto shadow-xs"
            id="download-master-btn"
          >
            <Download className="h-3.5 w-3.5" />
            Store Master (.xlsx)
          </button>
          <button
            onClick={downloadWeeklySalesExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors cursor-pointer w-full md:w-auto shadow-xs"
            id="download-sales-btn"
          >
            <Download className="h-3.5 w-3.5" />
            Weekly Sales (.xlsx)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" id="uploader-container">
        {/* Weekly Sales Uploader */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col" id="weekly-sales-upload-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-sans font-medium text-base">1. Weekly Sales Transactions</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md">retail_weekly_sales.xlsx</span>
          </div>
          <p className="text-gray-500 text-xs mb-4">
            Contains transaction values, units sold, margins, footfall, CSAT ratings, stock indices, and department details.
          </p>

          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            ref={salesInputRef}
            onChange={handleSalesSelect}
          />

          <div
            onDragOver={handleDragOverSales}
            onDragLeave={handleDragLeaveSales}
            onDrop={handleDropSales}
            onClick={() => salesInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-52 ${
              isDraggingSales ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50'
            }`}
            id="drag-drop-weekly-sales"
          >
            <AnimatePresence mode="wait">
              {isLoadingSales ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                  <span className="text-gray-600 text-xs">Parsing weekly sales...</span>
                </motion.div>
              ) : salesFile ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <span className="text-gray-900 font-medium text-xs truncate max-w-[200px]">{salesFile.name}</span>
                  <span className="text-emerald-700 text-[11px] font-semibold mt-1">Successfully Uploaded</span>
                  <span className="text-gray-400 text-[10px] mt-1">{salesFile.size} • {salesFile.rows.toLocaleString()} rows</span>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-3 bg-gray-50 rounded-full text-gray-400 mb-3 group-hover:text-indigo-500 transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-gray-700 text-xs font-medium">Drag Excel here or click to browse</span>
                  <span className="text-gray-400 text-[11px] mt-1">Supports .xlsx up to ~10MB</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {salesError && (
            <div className="mt-3 flex gap-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px]" id="weekly-sales-error">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{salesError}</span>
            </div>
          )}
        </div>

        {/* Store Master Uploader */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col" id="store-master-upload-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-sans font-medium text-base">2. Store Master Reference</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md">store_master.xlsx</span>
          </div>
          <p className="text-gray-500 text-xs mb-4">
            Contains store name labels, regional territories (North/South/East/West), and physical dimensions.
          </p>

          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            ref={storesInputRef}
            onChange={handleStoresSelect}
          />

          <div
            onDragOver={handleDragOverStores}
            onDragLeave={handleDragLeaveStores}
            onDrop={handleDropStores}
            onClick={() => storesInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-52 ${
              isDraggingStores ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50'
            }`}
            id="drag-drop-store-master"
          >
            <AnimatePresence mode="wait">
              {isLoadingStores ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                  <span className="text-gray-600 text-xs">Parsing store master...</span>
                </motion.div>
              ) : storesFile ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <span className="text-gray-900 font-medium text-xs truncate max-w-[200px]">{storesFile.name}</span>
                  <span className="text-emerald-700 text-[11px] font-semibold mt-1">Successfully Uploaded</span>
                  <span className="text-gray-400 text-[10px] mt-1">{storesFile.size} • {storesFile.rows.toLocaleString()} stores</span>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-3 bg-gray-50 rounded-full text-gray-400 mb-3 group-hover:text-indigo-500 transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-gray-700 text-xs font-medium">Drag Excel here or click to browse</span>
                  <span className="text-gray-400 text-[11px] mt-1">Supports .xlsx up to ~10MB</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {storesError && (
            <div className="mt-3 flex gap-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px]" id="store-master-error">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{storesError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Launcher Button */}
      <div className="flex justify-center mt-8" id="launch-panel">
        <button
          onClick={handleLaunchDashboard}
          disabled={!salesData || !storesData}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-md ${
            salesData && storesData
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer scale-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95'
          }`}
          id="launch-dashboard-btn"
        >
          <span>Generate Insights & Launch Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Guide details */}
      <div className="mt-12 bg-gray-50 border border-gray-100 rounded-xl p-6" id="upload-spec-guide">
        <h4 className="text-gray-800 font-medium text-sm mb-3">Expected Dataset Schema Specs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-gray-500">
          <div>
            <span className="font-semibold text-gray-700 block mb-1">Weekly Sales Transactions (retail_weekly_sales.xlsx)</span>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-gray-600">store_id, week_start_date</strong> (Key identifiers)</li>
              <li><strong className="text-gray-600">store_name, region, city, store_format</strong> (Store metadata fallback)</li>
              <li><strong className="text-gray-600">product_category</strong> (Grocery, Apparel, Electronics, Home)</li>
              <li><strong className="text-gray-600">footfall, transactions, units_sold</strong> (Traffic metrics)</li>
              <li><strong className="text-gray-600">gross_sales, discount_amount, net_sales, sales_target</strong> (Finance metrics)</li>
              <li><strong className="text-gray-600">inventory_on_hand, stockouts, returns_amount</strong> (Logistics metrics)</li>
              <li><strong className="text-gray-600">customer_rating, marketing_spend</strong> (Feedback & Marketing)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-gray-700 block mb-1">Store Master Reference (store_master.xlsx)</span>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-gray-600">store_id</strong> (Unique primary key to join on)</li>
              <li><strong className="text-gray-600">store_name</strong> (Authorized store label)</li>
              <li><strong className="text-gray-600">region</strong> (Authorized region: North, East, South, West)</li>
              <li><strong className="text-gray-600">city</strong> (Authorized city location)</li>
              <li><strong className="text-gray-600">store_format</strong> (Format: Flagship, Supercenter, Express, Mall-Based)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
