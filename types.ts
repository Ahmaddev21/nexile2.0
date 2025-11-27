export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string; // For Pharmacists
  assignedBranchIds?: string[]; // For Managers
  subscriptionStatus: 'active' | 'trial' | 'expired';
  trialEndsAt: string;
  password?: string; // Added for auth
  accessCode?: string; // Added for Manager auth
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStockLevel: number;
  expiryDate: string;
  branchId: string;
}

export interface Transaction {
  id: string;
  date: string;
  total: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  branchId: string;
  pharmacistId: string;
}

export interface Insight {
  type: 'prediction' | 'warning' | 'success';
  message: string;
  metric?: string;
}