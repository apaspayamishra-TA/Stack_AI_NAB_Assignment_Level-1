import React, { useState, useMemo } from 'react';
import { MergedSalesRecord } from '../types';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface DataGridProps {
  data: MergedSalesRecord[];
}

type SortField = 'week_start_date' | 'store_id' | 'store_name' | 'product_category' | 'net_sales' | 'units_sold' | 'customer_rating' | 'stockouts';
type SortOrder = 'asc' | 'desc';

export default function DataGrid({ data }: DataGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('week_start_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const itemsPerPage = 20;

  // Handles client-side sorting and text searching
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 1. Text Filter (Store ID, Store Name, Region, City, Category, Date)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.store_id.toLowerCase().includes(q) ||
          (r.master_store_name || r.store_name || '').toLowerCase().includes(q) ||
          (r.master_region || r.region || '').toLowerCase().includes(q) ||
          (r.master_city || r.city || '').toLowerCase().includes(q) ||
          (r.product_category || '').toLowerCase().includes(q) ||
          r.week_start_date.includes(q)
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'store_name') {
        valA = a.master_store_name || a.store_name || '';
        valB = b.master_store_name || b.store_name || '';
      } else {
        valA = a[sortField as keyof MergedSalesRecord];
        valB = b[sortField as keyof MergedSalesRecord];
      }

      // Handle String vs Number sorting
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA || 0);
        const numB = Number(valB || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
    });

    return result;
  }, [data, searchQuery, sortField, sortOrder]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    // Define columns to export (rearranging to have merged Store attributes upfront)
    const exportColumns: { key: keyof MergedSalesRecord; label: string }[] = [
      { key: 'store_id', label: 'Store ID' },
      { key: 'master_store_name', label: 'Authorized Store Name' },
      { key: 'store_name', label: 'Sales Sheet Store Name' },
      { key: 'master_region', label: 'Authorized Region' },
      { key: 'region', label: 'Sales Sheet Region' },
      { key: 'master_city', label: 'Authorized City' },
      { key: 'city', label: 'Sales Sheet City' },
      { key: 'master_store_format', label: 'Authorized Format' },
      { key: 'store_format', label: 'Sales Sheet Format' },
      { key: 'week_start_date', label: 'Week Start Date' },
      { key: 'product_category', label: 'Product Category' },
      { key: 'footfall', label: 'Footfall' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'units_sold', label: 'Units Sold' },
      { key: 'gross_sales', label: 'Gross Sales' },
      { key: 'discount_amount', label: 'Discount Amount' },
      { key: 'net_sales', label: 'Net Sales' },
      { key: 'sales_target', label: 'Sales Target' },
      { key: 'inventory_on_hand', label: 'Inventory On Hand' },
      { key: 'stockouts', label: 'Stockouts' },
      { key: 'returns_amount', label: 'Returns Amount' },
      { key: 'customer_rating', label: 'Customer Rating' },
      { key: 'marketing_spend', label: 'Marketing Spend' },
    ];

    const headers = exportColumns.map((col) => col.label).join(',');
    const csvRows = [headers];

    data.forEach((row) => {
      const values = exportColumns.map((col) => {
        const val = row[col.key];
        if (typeof val === 'string') {
          // Escape quotes and double wrap
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== undefined ? val : '';
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `merged_weekly_sales_intelligence_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortIconColor = (field: SortField) => {
    return sortField === field ? 'text-indigo-600' : 'text-gray-300 group-hover:text-gray-400';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6" id="datagrid-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-gray-900 font-sans font-medium text-base">Integrated Transaction Explorer</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Query and filter the combined datasets. Exports include all 19 weekly transaction columns alongside verified master properties.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto" id="table-controls">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search store, region, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="search-input"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 shadow-xs"
            id="export-csv-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Merged CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl" id="table-wrapper">
        <table className="w-full text-left text-xs text-gray-500 border-collapse">
          <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('week_start_date')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Week Start
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('week_start_date')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('store_id')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Store ID
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('store_id')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('store_name')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Store Name
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('store_name')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('product_category')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Category
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('product_category')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('net_sales')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Net Sales
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('net_sales')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('units_sold')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Units Sold
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('units_sold')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('customer_rating')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Rating
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('customer_rating')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                <button onClick={() => handleSort('stockouts')} className="flex items-center gap-1 group font-semibold text-gray-500 hover:text-gray-900 cursor-pointer">
                  Stockouts
                  <ArrowUpDown className={`h-3 w-3 ${getSortIconColor('stockouts')}`} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold text-right">Returns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const storeName = row.master_store_name || row.store_name;
                const format = row.master_store_format || row.store_format;
                const city = row.master_city || row.city;
                const region = row.master_region || row.region;

                return (
                  <tr key={`${row.store_id}-${row.week_start_date}-${row.product_category}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">{row.week_start_date}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-gray-600">{row.store_id}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[150px] truncate">
                      {row['Is Store Missing'] ? (
                        <span className="text-amber-700 italic flex items-center gap-1" title="Missing reference in Store Master.">
                          {row.store_name} ⚠️
                        </span>
                      ) : (
                        <span>{storeName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                        {row.product_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 font-mono">${row.net_sales.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{row.units_sold.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-semibold">{row.customer_rating.toFixed(1)}</span>
                      <span className="text-gray-300 ml-0.5">★</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.stockouts > 0 ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center">
                          {row.stockouts} OOS
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px] font-mono">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">${row.returns_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-xs">
                  No transaction records matched your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 pt-4 border-t border-gray-50" id="pagination-controls">
          <span>
            Showing <strong className="text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
            <strong className="text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}
            </strong> of <strong className="text-gray-800">{filteredAndSortedData.length.toLocaleString()}</strong> results
          </span>

          <div className="flex gap-1.5" id="pagination-buttons">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
              id="pagination-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="flex items-center px-3 font-medium text-gray-700" id="current-page-display">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                currentPage === totalPages
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
              id="pagination-next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
