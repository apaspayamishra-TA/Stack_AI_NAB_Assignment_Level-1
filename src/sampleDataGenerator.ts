import * as XLSX from 'xlsx';
import { WeeklySalesRecord, StoreMasterRecord } from './types';

// Define the 20 Store IDs
const STORE_IDS = Array.from({ length: 20 }, (_, i) => `ST${String(i + 1).padStart(3, '0')}`);

const REGIONS = ['North', 'East', 'South', 'West'];
const STORE_FORMATS = ['Flagship', 'Supercenter', 'Express', 'Mall-Based'];
const CITIES = [
  'New York', 'Chicago', 'Atlanta', 'Los Angeles',
  'Boston', 'Philadelphia', 'Miami', 'San Francisco',
  'Seattle', 'Dallas', 'Houston', 'Denver',
  'Charlotte', 'Detroit', 'Orlando', 'Phoenix',
  'Austin', 'Minneapolis', 'Nashville', 'Portland'
];

// Generate Store Master Data (omitting ST019 and ST020 to test the warning)
export const generateStoreMaster = (): StoreMasterRecord[] => {
  const storeNames = [
    'Downtown Metro Flagship',
    'Suburban Supercenter',
    'Northside Express Hub',
    'Westside Galleria Mall',
    'Eastgate Plaza',
    'Southside Retail Park',
    'Central Square',
    'High Street Boutique',
    'Riverfront Express',
    'West End Superstore',
    'Summit Ridge Mall',
    'Valley Center',
    'Lakeview Pavilion',
    'Harbor View Outlet',
    'Coastal Town Center',
    'Metro Station Express',
    'Corporate Park Hub',
    'Greenfield Supercenter',
    'Pine Hills Depot', // ST019 - omitted in master
    'Oakridge Village'  // ST020 - omitted in master
  ];

  // We only return the first 18 stores in the master list so ST019 and ST020 trigger the warning
  const records: StoreMasterRecord[] = [];
  for (let i = 0; i < 18; i++) {
    records.push({
      store_id: STORE_IDS[i],
      store_name: storeNames[i],
      region: REGIONS[i % 4],
      city: CITIES[i],
      store_format: STORE_FORMATS[i % 4],
    });
  }

  return records;
};

// Generate Weekly Sales (1920 rows = 20 stores * 24 weeks * 4 product categories)
export const generateWeeklySales = (): WeeklySalesRecord[] => {
  const records: WeeklySalesRecord[] = [];
  const baseDate = new Date('2026-01-04'); // Starting first Sunday of 2026

  const storeNames = [
    'Downtown Metro Flagship',
    'Suburban Supercenter',
    'Northside Express Hub',
    'Westside Galleria Mall',
    'Eastgate Plaza',
    'Southside Retail Park',
    'Central Square',
    'High Street Boutique',
    'Riverfront Express',
    'West End Superstore',
    'Summit Ridge Mall',
    'Valley Center',
    'Lakeview Pavilion',
    'Harbor View Outlet',
    'Coastal Town Center',
    'Metro Station Express',
    'Corporate Park Hub',
    'Greenfield Supercenter',
    'Pine Hills Depot',
    'Oakridge Village'
  ];

  const categories = ['Grocery', 'Apparel', 'Electronics', 'Home'];

  // Loop through 24 weeks
  for (let weekIdx = 0; weekIdx < 24; weekIdx++) {
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + (weekIdx * 7));
    const dateStr = weekStart.toISOString().split('T')[0];

    // Seasonality factors
    let seasonalMultiplier = 1.0;
    const month = weekStart.getMonth();
    if (month === 4 || month === 5) seasonalMultiplier = 1.15; // Summer sales boost (May/June)
    if (month === 10 || month === 11) seasonalMultiplier = 1.35; // Holiday rush boost (Nov/Dec)
    if (month === 0 || month === 1) seasonalMultiplier = 0.85; // Post-holiday winter lull

    STORE_IDS.forEach((storeId, storeIndex) => {
      const storeName = storeNames[storeIndex];
      const region = REGIONS[storeIndex % 4];
      const city = CITIES[storeIndex];
      const storeFormat = STORE_FORMATS[storeIndex % 4];

      // Base metrics per store format
      let baseFootfall = 4000;
      let baseTarget = 24000;

      if (storeFormat === 'Flagship') {
        baseFootfall = 9000;
        baseTarget = 55000;
      } else if (storeFormat === 'Supercenter') {
        baseFootfall = 14000;
        baseTarget = 85000;
      } else if (storeFormat === 'Express') {
        baseFootfall = 18000; // high frequency low basket size
        baseTarget = 12000;
      }

      // Store-level footfall/transactions with noise
      const footfall = Math.round(baseFootfall * seasonalMultiplier * (0.88 + Math.random() * 0.24));
      const transactions = Math.round(footfall * (0.35 + Math.random() * 0.12));

      categories.forEach((category) => {
        // Apportion transaction metrics per department
        let categoryShare = 0.25;
        if (category === 'Grocery' && storeFormat === 'Supercenter') categoryShare = 0.45;
        if (category === 'Apparel' && storeFormat === 'Mall-Based') categoryShare = 0.40;
        if (category === 'Electronics' && storeFormat === 'Flagship') categoryShare = 0.35;

        const catTransactions = Math.round(transactions * categoryShare);
        const avgBasketSize = 1.4 + Math.random() * 1.8;
        const unitsSold = Math.round(catTransactions * avgBasketSize);

        // Average prices by product category
        let avgPrice = 15; // Grocery
        if (category === 'Apparel') avgPrice = 32;
        if (category === 'Electronics') avgPrice = 140;
        if (category === 'Home') avgPrice = 48;

        // Apply discount rate (promos)
        const isPromoActive = Math.random() > 0.75;
        const discountPct = isPromoActive ? 0.08 + (Math.random() * 0.12) : 0.01 + (Math.random() * 0.03);

        const grossSales = Math.round(unitsSold * avgPrice * (0.92 + Math.random() * 0.16) * 100) / 100;
        const discountAmount = Math.round(grossSales * discountPct * 100) / 100;
        const netSales = Math.round((grossSales - discountAmount) * 100) / 100;

        // Targets and margins
        const salesTarget = Math.round((baseTarget / 4) * seasonalMultiplier * (0.85 + Math.random() * 0.3) * 100) / 100;
        const inventoryOnHand = Math.round(unitsSold * (3.5 + Math.random() * 4.5));
        const stockouts = Math.random() > 0.88 ? Math.floor(Math.random() * 10) + 1 : 0;
        const returnsAmount = Math.round(netSales * (category === 'Apparel' ? 0.04 + Math.random() * 0.05 : 0.005 + Math.random() * 0.02) * 100) / 100;
        const customerRating = Math.round((4.1 + Math.random() * 0.9) * 10) / 10;
        const marketingSpend = Math.round((150 + Math.random() * 650) * 100) / 100;

        records.push({
          week_start_date: dateStr,
          region,
          store_id: storeId,
          store_name: storeName,
          city,
          store_format: storeFormat,
          product_category: category,
          footfall,
          transactions,
          units_sold: unitsSold,
          gross_sales: grossSales,
          discount_amount: discountAmount,
          net_sales: netSales,
          sales_target: salesTarget,
          inventory_on_hand: inventoryOnHand,
          stockouts,
          returns_amount: returnsAmount,
          customer_rating: customerRating,
          marketing_spend: marketingSpend,
        });
      });
    });
  }

  return records;
};

// Download Trigger Helpers
export const downloadStoreMasterExcel = () => {
  const data = generateStoreMaster();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Store Master');
  XLSX.writeFile(workbook, 'store_master.xlsx');
};

export const downloadWeeklySalesExcel = () => {
  const data = generateWeeklySales();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Sales');
  XLSX.writeFile(workbook, 'retail_weekly_sales.xlsx');
};
