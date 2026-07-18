import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeeklySalesRecord, StoreMasterRecord, MergedSalesRecord } from './types';
import FileUploader from './components/FileUploader';
import MissingStoresWarning from './components/MissingStoresWarning';
import DashboardOverview from './components/DashboardOverview';
import SalesTrendChart from './components/SalesTrendChart';
import StorePerformanceChart from './components/StorePerformanceChart';
import CategoryPerformanceChart from './components/CategoryPerformanceChart';
import StockoutRiskAnalysis from './components/StockoutRiskAnalysis';
import BusinessInsights from './components/BusinessInsights';
import ExportView from './components/ExportView';
import DataGrid from './components/DataGrid';
import { generateStoreMaster, generateWeeklySales } from './sampleDataGenerator';
import {
  Filter,
  RotateCcw,
  BarChart3,
  Database,
  Info,
  Brain,
  Download,
  LayoutDashboard,
  Upload,
  AlertTriangle,
  FlameKindling
} from 'lucide-react';

export default function App() {
  // Datasets State
  const [weeklySales, setWeeklySales] = useState<WeeklySalesRecord[] | null>(null);
  const [storeMaster, setStoreMaster] = useState<StoreMasterRecord[] | null>(null);
  const [mergedData, setMergedData] = useState<MergedSalesRecord[] | null>(null);
  const [missingStoreIds, setMissingStoreIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Active Tab State (Upload, Dashboard, Insights, Export)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights' | 'export' | 'upload'>('upload');

  // Global Filters State
  const [selectedWeek, setSelectedWeek] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedStoreFormat, setSelectedStoreFormat] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchStoreId, setSearchStoreId] = useState<string>('All');

  // Load and merge files
  const handleDataLoaded = (sales: WeeklySalesRecord[], stores: StoreMasterRecord[]) => {
    setIsSimulatingLoad(true);
    setLoadingMessage('Parsing Microsoft Excel workbook assets...');

    setTimeout(() => {
      setLoadingMessage('Executing relational joins on matching Store IDs...');

      setTimeout(() => {
        setLoadingMessage('Calibrating logistics stockout risks & margin metrics...');

        setTimeout(() => {
          setWeeklySales(sales);
          setStoreMaster(stores);

          // Create quick lookup for store master data
          const storesMap = new Map<string, StoreMasterRecord>();
          stores.forEach((s) => storesMap.set(s.store_id, s));

          // Identify missing store IDs
          const missingIdsSet = new Set<string>();
          const merged: MergedSalesRecord[] = sales.map((sale) => {
            const storeId = sale.store_id;
            const store = storesMap.get(storeId);

            if (!store) {
              missingIdsSet.add(storeId);
              return {
                ...sale,
                master_store_name: `Unknown Store (${storeId})`,
                master_region: 'Unknown',
                master_city: 'Unknown',
                master_store_format: 'Unknown',
                'Is Store Missing': true,
              };
            }

            return {
              ...sale,
              master_store_name: store.store_name,
              master_region: store.region,
              master_city: store.city,
              master_store_format: store.store_format,
              'Is Store Missing': false,
            };
          });

          setMergedData(merged);
          setMissingStoreIds(Array.from(missingIdsSet).sort());
          setIsLoaded(true);
          setIsSimulatingLoad(false);
          setActiveTab('dashboard'); // Automatically switch to dashboard view
        }, 400);
      }, 400);
    }, 400);
  };

  // Instant demo dataset loader
  const handleLoadDemoData = () => {
    const demoSales = generateWeeklySales();
    const demoStores = generateStoreMaster();
    handleDataLoaded(demoSales, demoStores);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedWeek('All');
    setSelectedRegion('All');
    setSelectedStoreFormat('All');
    setSelectedCategory('All');
    setSearchStoreId('All');
  };

  // Back to upload screen / Clear current session storage
  const handleResetSession = () => {
    setWeeklySales(null);
    setStoreMaster(null);
    setMergedData(null);
    setMissingStoreIds([]);
    setIsLoaded(false);
    setActiveTab('upload');
    handleResetFilters();
  };

  // Get filter dimensions for selector menus
  const filterDimensions = useMemo(() => {
    if (!mergedData) return { weeks: [], regions: [], storeFormats: [], categories: [], storesList: [] };

    const weeks = Array.from(new Set(mergedData.map((r) => r.week_start_date))).filter(Boolean).sort();
    const regions = Array.from(new Set(mergedData.map((r) => r.master_region || r.region || 'Unknown'))).filter(Boolean).sort();
    const storeFormats = Array.from(new Set(mergedData.map((r) => r.master_store_format || r.store_format || 'Unknown'))).filter(Boolean).sort();
    const categories = Array.from(new Set(mergedData.map((r) => r.product_category || 'General'))).filter(Boolean).sort();
    
    // List of distinct stores (ST001 - Name)
    const storesMap = new Map<string, string>();
    mergedData.forEach((r) => {
      storesMap.set(r.store_id, `${r.store_id} - ${(r.master_store_name || r.store_name)}`);
    });
    const storesList = Array.from(storesMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return { weeks, regions, storeFormats, categories, storesList };
  }, [mergedData]);

  // Apply filters to active dataset
  const filteredData = useMemo(() => {
    if (!mergedData) return [];

    return mergedData.filter((r) => {
      const region = r.master_region !== 'Unknown' ? r.master_region : r.region;
      const storeFormat = r.master_store_format !== 'Unknown' ? r.master_store_format : r.store_format;

      if (selectedWeek !== 'All' && r.week_start_date !== selectedWeek) return false;
      if (selectedRegion !== 'All' && region !== selectedRegion) return false;
      if (selectedStoreFormat !== 'All' && storeFormat !== selectedStoreFormat) return false;
      if (selectedCategory !== 'All' && r.product_category !== selectedCategory) return false;
      if (searchStoreId !== 'All' && r.store_id !== searchStoreId) return false;
      return true;
    });
  }, [mergedData, selectedWeek, selectedRegion, selectedStoreFormat, selectedCategory, searchStoreId]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans relative" id="app-root">
      {/* Dynamic Header */}
      <AnimatePresence>
        {isSimulatingLoad && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            id="executive-loader-portal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-slate-900 font-sans font-extrabold text-base mb-1 tracking-tight">
                Retail Sales Intelligence
              </h3>
              <span className="text-[10px] font-mono font-bold tracking-widest text-sky-600 uppercase mb-4 block">
                Enterprise Analytics Sandbox
              </span>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                />
              </div>
              <p className="text-gray-500 font-medium font-sans text-xs animate-pulse">
                {loadingMessage || 'Assembling Retail Sandboxes...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-xs" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-emerald-600 rounded-xl text-white shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-sans font-bold text-sm tracking-tight block leading-none">
                  Retail Sales Intelligence
                </span>
                <span className="text-[9px] bg-sky-50 border border-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded-md font-mono leading-none uppercase tracking-wider">
                  v2.5.0-PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-bold mt-1.5 font-mono uppercase tracking-widest leading-none">
                {isLoaded ? 'Dashboard Live' : 'Session Pending'}
              </span>
            </div>
          </div>

          {/* Navigation Menu (Enabled only after data load) */}
          {isLoaded && (
            <nav className="hidden md:flex bg-slate-50 p-1 border border-slate-100 rounded-xl" id="nav-tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'dashboard' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                }`}
                id="tab-btn-dashboard"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'insights' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                }`}
                id="tab-btn-insights"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Business Insights</span>
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'export' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                }`}
                id="tab-btn-export"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'upload' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                }`}
                id="tab-btn-upload"
              >
                <Database className="h-3.5 w-3.5" />
                <span>Manage Data</span>
              </button>
            </nav>
          )}

          {/* Quick Clear Session / Upload New */}
          {isLoaded && (
            <button
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-100 hover:border-rose-200 bg-white text-rose-600 hover:text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              id="reset-session-btn"
            >
              <span>Reset Session</span>
            </button>
          )}
        </div>

        {/* Mobile Navigation Bar */}
        {isLoaded && (
          <div className="md:hidden border-t border-gray-100 px-4 py-2 flex justify-around bg-gray-50 text-[11px] font-semibold" id="mobile-nav-tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'insights' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <Brain className="h-4 w-4" />
              <span>Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'export' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'upload' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <Database className="h-4 w-4" />
              <span>Data</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && !isLoaded ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {/* Demo Starter Quick Launcher Block */}
              <div className="max-w-4xl mx-auto pt-10 px-4 text-center">
                <div className="bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-100 rounded-xl p-6 shadow-xs inline-flex flex-col sm:flex-row items-center gap-4 justify-between w-full max-w-2xl mb-2 text-left" id="instant-demo-quick-launcher">
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                      <FlameKindling className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-indigo-950 font-bold text-sm">Want a live demo immediately?</h4>
                      <p className="text-indigo-800 text-xs mt-0.5 leading-relaxed">
                        Skip manual uploads and instantly boot our dynamic analytical sandbox populated with over 1,920 weekly records.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLoadDemoData}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer w-full sm:w-auto shadow-md shrink-0 scale-100 active:scale-95"
                    id="load-demo-data-btn"
                  >
                    Launch with Demo Data
                  </button>
                </div>
              </div>

              <FileUploader onDataLoaded={handleDataLoaded} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              id="active-tab-root"
            >
              {/* Warnings Row if Mismatches present */}
              <MissingStoresWarning missingIds={missingStoreIds} />

              {/* VIEW 1: DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" id="dashboard-tab-view">
                  {/* Sidebar Filters Column (Desktop Sticky Sidebar) */}
                  <div className="lg:col-span-1" id="sidebar-filters-container">
                    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col gap-4 sticky top-24 relative overflow-hidden" id="filters-panel">
                      <div className="absolute top-0 left-0 w-[4px] h-full bg-sky-500"></div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 pl-2">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-sans uppercase tracking-wider">
                          <Filter className="h-4 w-4 text-sky-600" />
                          <span>Sidebar Filters</span>
                        </div>
                        <button
                          onClick={handleResetFilters}
                          className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-xs font-bold cursor-pointer transition-colors"
                          id="reset-filters-btn"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-xs pl-2" id="filters-row">
                        {/* Filter: Week selector */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-bold block">Reporting Week</label>
                          <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs font-sans text-xs font-medium"
                            id="filter-week-select"
                          >
                            <option value="All">All Weeks ({filterDimensions.weeks.length})</option>
                            {filterDimensions.weeks.map((wk) => (
                              <option key={wk} value={wk}>
                                Week of {wk}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter: Region Selector */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-bold block">Territory Region</label>
                          <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs font-sans text-xs font-medium"
                            id="filter-region-select"
                          >
                            <option value="All">All Regions ({filterDimensions.regions.length})</option>
                            {filterDimensions.regions.map((reg) => (
                              <option key={reg} value={reg}>
                                {reg} Region
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter: Store Selector */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-bold block">Retail Store Node</label>
                          <select
                            value={searchStoreId}
                            onChange={(e) => setSearchStoreId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs font-sans text-xs font-medium"
                            id="filter-store-select"
                          >
                            <option value="All">All Stores ({filterDimensions.storesList.length})</option>
                            {filterDimensions.storesList.map((store) => (
                              <option key={store.id} value={store.id}>
                                {store.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter: Store Format Selector */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-bold block">Store Format</label>
                          <select
                            value={selectedStoreFormat}
                            onChange={(e) => setSelectedStoreFormat(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs font-sans text-xs font-medium"
                            id="filter-store-format-select"
                          >
                            <option value="All">All Formats ({filterDimensions.storeFormats.length})</option>
                            {filterDimensions.storeFormats.map((fmt) => (
                              <option key={fmt} value={fmt}>
                                {fmt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter: Product Category Selector */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-bold block">Product Category</label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs font-sans text-xs font-medium"
                            id="filter-category-select"
                          >
                            <option value="All">All Categories ({filterDimensions.categories.length})</option>
                            {filterDimensions.categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Filter statistics indicator */}
                      <div className="flex items-start gap-2 text-slate-400 text-[10px] mt-1 pt-3 border-t border-slate-100 pl-2" id="filter-state-summary">
                        <Info className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          Filtered to <span className="font-extrabold text-slate-700">{filteredData.length.toLocaleString()}</span> metrics out of <span className="font-bold text-slate-500">{mergedData?.length.toLocaleString()}</span> entries.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Content & Charts */}
                  <div className="lg:col-span-3 space-y-6" id="main-dashboard-content">
                    {/* KPI metrics panel */}
                    <DashboardOverview data={filteredData} />

                    {/* Line & Area Weekly Trend Analysis */}
                    <SalesTrendChart data={filteredData} />

                    {/* Category Performance & Markdown */}
                    <CategoryPerformanceChart data={filteredData} />

                    {/* Stockout Leakage Analysis */}
                    <StockoutRiskAnalysis data={filteredData} />

                    {/* Store & Regional performance bento analysis */}
                    <StorePerformanceChart data={filteredData} />

                    {/* Tabular Data Grid */}
                    <DataGrid data={filteredData} />
                  </div>
                </div>
              )}

              {/* VIEW 2: BUSINESS INSIGHTS TAB */}
              {activeTab === 'insights' && (
                <div id="insights-tab-view">
                  <BusinessInsights data={filteredData} />
                </div>
              )}

              {/* VIEW 3: EXPORT TAB */}
              {activeTab === 'export' && (
                <div id="export-tab-view">
                  <ExportView data={filteredData} />
                </div>
              )}

              {/* VIEW 4: MANAGE DATA TAB (Manage files/Re-upload) */}
              {activeTab === 'upload' && isLoaded && (
                <div className="space-y-6" id="manage-data-tab-view">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto">
                    <h3 className="text-gray-900 font-sans font-medium text-base mb-2">Active Database Session Status</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-4">
                      You currently have an active cache containing <span className="font-semibold text-indigo-600">{mergedData?.length.toLocaleString()} joined sales rows</span> across <span className="font-semibold text-indigo-600">{filterDimensions.storesList.length} physical stores</span>.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                      <div>
                        <span className="text-gray-400 block">Weekly Sales Records:</span>
                        <span className="font-bold text-gray-800">{weeklySales?.length.toLocaleString()} rows</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Master Store Records:</span>
                        <span className="font-bold text-gray-800">{storeMaster?.length.toLocaleString()} stores</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Missing Join IDs Count:</span>
                        <span className={`font-bold ${missingStoreIds.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {missingStoreIds.length} identifiers
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Overdrive Data Refresh</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Want to replace the current workspace scope? Simply drop in your revised sheets below. This clears the transient browser cache instantly.
                      </p>
                    </div>
                  </div>

                  <FileUploader onDataLoaded={handleDataLoaded} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] text-gray-400 font-medium space-y-1">
          <p>© 2026 Retail Sales Intelligence System. Local Client-Side Execution Sandbox.</p>
          <p className="font-mono">Active User Session Storage Only • All Excel parsing runs in-browser securely.</p>
        </div>
      </footer>
    </div>
  );
}
