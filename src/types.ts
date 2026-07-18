/**
 * Retail Sales Intelligence TypeScript Types
 */

export interface WeeklySalesRecord {
  week_start_date: string;
  region: string;
  store_id: string;
  store_name: string;
  city: string;
  store_format: string;
  product_category: string;
  footfall: number;
  transactions: number;
  units_sold: number;
  gross_sales: number;
  discount_amount: number;
  net_sales: number;
  sales_target: number;
  inventory_on_hand: number;
  stockouts: number;
  returns_amount: number;
  customer_rating: number;
  marketing_spend: number;
}

export interface StoreMasterRecord {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface MergedSalesRecord extends WeeklySalesRecord {
  master_store_name: string;
  master_region: string;
  master_city: string;
  master_store_format: string;
  'Is Store Missing': boolean;
}

export interface DashboardState {
  weeklySales: WeeklySalesRecord[];
  storeMaster: StoreMasterRecord[];
  mergedData: MergedSalesRecord[];
  missingStoreIds: string[];
}

