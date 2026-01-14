
export enum UserRole {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER'
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number; // Harga Normal
  priceGrab: number; // Harga GrabFood
  priceGojek: number; // Harga GojekFood
  category: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderPlatform = 'NORMAL' | 'GRAB' | 'GOJEK';

export interface Transaction {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  platform: OrderPlatform;
  paymentMethod: 'CASH' | 'QRIS';
  amountPaid: number;
  change: number;
  timestamp: any;
  cashierId: string;
  cashierName: string;
}
