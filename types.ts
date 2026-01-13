
export enum UserRole {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER'
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
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

export interface Transaction {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'CASH' | 'QRIS';
  amountPaid: number;
  change: number;
  timestamp: any; // Firebase Timestamp
  cashierId: string;
  cashierName: string;
}
