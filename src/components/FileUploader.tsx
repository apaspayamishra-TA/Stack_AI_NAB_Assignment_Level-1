import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  CheckCircle2,
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Info, 
  Sparkles, 
  Workflow, 
  TrendingUp, 
  BookOpen, 
  Activity,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { WeeklySalesRecord, StoreMasterRecord } from '../types';
import { downloadStoreMasterExcel, downloadWeeklySalesExcel } from '../sampleDataGenerator';

function parseAndNormalizeDate(val: any): string {
  if (val === undefined || val === null) return '';

  // 1. If it's a JS Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  // 2. If it's a number (Excel date code, e.g., 46034)
  if (typeof val === 'number') {
    const utcDays = Math.floor(val - 25569);
    const date = new Date(1970, 0, 1 + utcDays);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 3. If it's a string, clean it up
  const str = String(val).trim();
  if (!str) return '';

  // Case 3a: Check for dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
  const matchDmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (matchDmy) {
    const d = matchDmy[1].padStart(2, '0');
    const m = matchDmy[2].padStart(2, '0');
    const y = matchDmy[3];
    return `${y}-${m}-${d}`;
  }

  // Case 3b: Check for dd-mm-yy or dd/mm/yy (2 digit year)
  const matchDmy2Digit = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (matchDmy2Digit) {
    const d = matchDmy2Digit[1].padStart(2, '0');
    const m = matchDmy2Digit[2].padStart(2, '0');
    const yy = parseInt(matchDmy2Digit[3], 10);
    const y = yy > 50 ? `19${yy}` : `20${yy}`;
    return `${y}-${m}-${d}`;
  }

  // Case 3c: Check for yyyy-mm-dd or yyyy/mm/dd or yyyy.mm.dd
  const matchYmd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (matchYmd) {
    const y = matchYmd[1];
    const m = matchYmd[2].padStart(2, '0');
    const d = matchYmd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Case 3d: Check if it's purely numeric string (like "46034")
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    const utcDays = Math.floor(num - 25569);
    const date = new Date(1970, 0, 1 + utcDays);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Case 3e: Try JS generic Date parsing as fallback
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

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
      week_start_date: parseAndNormalizeDate(row['week_start_date']),
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
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
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
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Polished Hero Banner & Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-4 shadow-2xs font-mono">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span>Application Version 2.5.0-PRO</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-gray-900 mb-4" id="app-title">
          Retail Sales Intelligence
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" id="app-subtitle">
          Accelerate strategic retail decisions through automated offline data synchronization. Securely merge granular, weekly transactional registers with master store directory databases to map profitability, seasonal curves, and logistical leakages instantly.
        </p>
      </div>

      {/* Structured Visual Instructions Section */}
      <div className="mb-12" id="onboarding-steps-container">
        <h2 className="text-gray-900 text-xs font-bold uppercase tracking-wider text-center mb-6 text-indigo-900">How to Ingest & Align Your Datasets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col items-start relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50/50 rounded-bl-2xl text-indigo-600 font-mono text-sm font-bold">01</div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-gray-900 font-sans font-semibold text-sm mb-1.5">Download Schema Blueprints</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Retrieve our pre-formatted Microsoft Excel templates containing the authorized layout columns to guarantee 100% parsing accuracy.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col items-start relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50/50 rounded-bl-2xl text-indigo-600 font-mono text-sm font-bold">02</div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="text-gray-900 font-sans font-semibold text-sm mb-1.5">Drop & Validate Excel Sheets</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Drag-and-drop or browse your local files. Our client-side workbook engine parses headers, normalizes date strings, and checks data types.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col items-start relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50/50 rounded-bl-2xl text-indigo-600 font-mono text-sm font-bold">03</div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
              <Workflow className="h-5 w-5" />
            </div>
            <h3 className="text-gray-900 font-sans font-semibold text-sm mb-1.5">Launch Live BI Sandboxes</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Execute dynamic, local relational joins based on matching Store IDs. Detect data discrepancies, track metrics, and export executive reports.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Starter Kit Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-sm" id="demo-banner">
        <div className="flex gap-3.5">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-amber-950 font-bold text-sm">Need demonstration-ready spreadsheet data?</h4>
            <p className="text-amber-800 text-xs mt-0.5 max-w-xl leading-relaxed">
              Download our generated master catalogs. The Store Master purposefully excludes identifiers <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ST019</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ST020</code> to showcase relational warning triggers and safety alerts.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={downloadStoreMasterExcel}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors cursor-pointer w-full sm:w-auto shadow-2xs"
            id="download-master-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Store Master (.xlsx)</span>
          </button>
          <button
            onClick={downloadWeeklySalesExcel}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-xs"
            id="download-sales-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Weekly Sales (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Dual File Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" id="uploader-container">
        {/* Weekly Sales Uploader */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col" id="weekly-sales-upload-card">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-gray-900 font-sans font-semibold text-sm">1. Weekly Sales Ledger</h3>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md uppercase">retail_weekly_sales.xlsx</span>
          </div>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            Upload transaction logs, departmental net values, unit volume registers, weekly footfall traffic, and client satisfaction metrics.
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
                  <span className="text-gray-600 text-xs">Parsing transaction logs...</span>
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
                  <span className="text-gray-900 font-semibold text-xs truncate max-w-[200px]">{salesFile.name}</span>
                  <span className="text-emerald-700 text-[11px] font-bold mt-1">Successfully Uploaded</span>
                  <span className="text-gray-400 text-[10px] mt-1">{salesFile.size} • {salesFile.rows.toLocaleString()} records</span>
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
                  <span className="text-gray-700 text-xs font-semibold">Drag Excel here or click to browse</span>
                  <span className="text-gray-400 text-[10px] mt-1">Supports standard weekly sales schema</span>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col" id="store-master-upload-card">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-gray-900 font-sans font-semibold text-sm">2. Store Master Reference Catalog</h3>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md uppercase">store_master.xlsx</span>
          </div>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            Upload physical branch files registering store name tags, geographic region bounds (North/South/East/West), cities, and sizes.
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
                  <span className="text-gray-600 text-xs">Parsing master directory...</span>
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
                  <span className="text-gray-900 font-semibold text-xs truncate max-w-[200px]">{storesFile.name}</span>
                  <span className="text-emerald-700 text-[11px] font-bold mt-1">Successfully Uploaded</span>
                  <span className="text-gray-400 text-[10px] mt-1">{storesFile.size} • {storesFile.rows.toLocaleString()} store profiles</span>
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
                  <span className="text-gray-700 text-xs font-semibold">Drag Excel here or click to browse</span>
                  <span className="text-gray-400 text-[10px] mt-1">Supports master directories directory</span>
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

      {/* Interactive Action Launcher Panel */}
      <div className="flex flex-col items-center justify-center mt-10 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" id="launch-panel">
        <h4 className="text-gray-900 font-sans font-semibold text-sm mb-1.5">Are both databases mapped and verified?</h4>
        <p className="text-gray-500 text-xs text-center max-w-md mb-4 leading-relaxed">
          Once both data rows are fully uploaded, the activation button below will unlock. Click it to align key-value rows and generate retail intelligence metrics.
        </p>
        <button
          onClick={handleLaunchDashboard}
          disabled={!salesData || !storesData}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
            salesData && storesData
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer hover:shadow-lg scale-100 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95 border border-gray-150'
          }`}
          id="launch-dashboard-btn"
        >
          <span>Generate Insights & Launch Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Comprehensive Schema specifications */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8" id="upload-spec-guide">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <h4 className="text-gray-900 font-sans font-semibold text-sm">Ingestion Schema specifications & Requirements</h4>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-[11px] text-gray-500">
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-2xs">
            <span className="font-bold text-gray-800 block border-b border-gray-100 pb-2 mb-3">Weekly Sales Ledger Fields</span>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">store_id</strong> <span className="text-gray-400">• string</span> - Uniquely registers matching target keys.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">week_start_date</strong> <span className="text-gray-400">• date/string</span> - Ingests weekly timestamps.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">product_category</strong> <span className="text-gray-400">• string</span> - (Grocery, Apparel, Electronics, Home).</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">gross_sales</strong> <span className="text-gray-400">• numeric</span> - Raw currency metrics.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">discount_amount, net_sales</strong> <span className="text-gray-400">• numeric</span> - Finance parameters.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">stockouts, inventory_on_hand</strong> <span className="text-gray-400">• numeric</span> - Supply chain indicators.</div></li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-2xs">
            <span className="font-bold text-gray-800 block border-b border-gray-100 pb-2 mb-3">Store Master Directory Fields</span>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">store_id</strong> <span className="text-gray-400">• string</span> - Matching primary key identifier.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">store_name</strong> <span className="text-gray-400">• string</span> - Fully authorized physical store tag.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">region</strong> <span className="text-gray-400">• string</span> - East, West, North, or South territory labels.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">city</strong> <span className="text-gray-400">• string</span> - Physical municipal store coordinate.</div></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" /> <div><strong className="text-gray-700">store_format</strong> <span className="text-gray-400">• string</span> - (Supercenter, flagship, express, etc.).</div></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
