
export interface User {
  uid: string;
  email: string | null;
  role: 'owner' | 'manager' | 'cashier';
  storeInfo: StoreInfo;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  supplierId?: string;
  lowStockThreshold: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card';
  customerId?: string;
  timestamp: Date;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    loyaltyPoints: number;
}

export interface ActivityLog {
    id: string;
    message: string;
    timestamp: Date;
}