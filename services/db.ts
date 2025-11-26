import { User, Branch, Product, Transaction, UserRole } from '../types';

// Initial Seed Data
const SEED_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Downtown NYC', location: 'New York' },
  { id: 'b2', name: 'Austin Hub', location: 'Austin' },
];

const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Owner',
    email: 'admin@nexile.com',
    role: UserRole.OWNER,
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    password: 'password' 
  },
  {
    id: 'u2',
    name: 'Bob Manager',
    email: 'bob@nexile.com',
    role: UserRole.MANAGER,
    assignedBranchIds: ['b1'],
    subscriptionStatus: 'active',
    trialEndsAt: new Date().toISOString(),
    accessCode: '1234'
  },
  {
    id: 'u3',
    name: 'Charlie Pharm',
    email: 'charlie@nexile.com',
    role: UserRole.PHARMACIST,
    branchId: 'b1',
    subscriptionStatus: 'active',
    trialEndsAt: new Date().toISOString(),
    password: 'password'
  }
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Amoxicillin 500mg', sku: 'AMX500', category: 'Antibiotics', price: 12.50, cost: 5.00, stock: 150, minStockLevel: 50, expiryDate: '2025-12-01', branchId: 'b1' },
  { id: 'p2', name: 'Ibuprofen 200mg', sku: 'IBU200', category: 'Pain Relief', price: 8.00, cost: 2.50, stock: 40, minStockLevel: 100, expiryDate: '2026-01-15', branchId: 'b1' },
  { id: 'p3', name: 'Cetirizine 10mg', sku: 'CET010', category: 'Allergy', price: 15.00, cost: 6.00, stock: 200, minStockLevel: 30, expiryDate: '2024-11-01', branchId: 'b1' },
  { id: 'p4', name: 'Vitamin D3', sku: 'VITD3', category: 'Supplements', price: 25.00, cost: 12.00, stock: 80, minStockLevel: 20, expiryDate: '2025-06-30', branchId: 'b2' },
];

// Mock DB Class
class DB {
  private getStorage<T>(key: string, seed: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(stored);
    } catch (e) {
      return seed;
    }
  }

  private setStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  get branches(): Branch[] { return this.getStorage('nexile_branches', SEED_BRANCHES); }
  get users(): User[] { return this.getStorage('nexile_users', SEED_USERS); }
  get products(): Product[] { return this.getStorage('nexile_products', SEED_PRODUCTS); }
  get transactions(): Transaction[] { return this.getStorage('nexile_transactions', []); }

  // --- Branch Management ---
  createBranch(name: string, location: string) {
    const branches = this.branches;
    const newBranch: Branch = {
      id: `b${Date.now()}`,
      name,
      location
    };
    branches.push(newBranch);
    this.setStorage('nexile_branches', branches);
    return newBranch;
  }

  deleteBranch(branchId: string) {
    // 1. Remove the branch
    const branches = this.branches.filter(b => b.id !== branchId);
    this.setStorage('nexile_branches', branches);
    
    // 2. Cleanup: Remove this branch ID from any managers assigned to it
    const users = this.users.map(u => {
      if (u.role === UserRole.MANAGER && u.assignedBranchIds) {
        return {
          ...u,
          assignedBranchIds: u.assignedBranchIds.filter(id => id !== branchId)
        };
      }
      return u;
    });
    this.setStorage('nexile_users', users);
  }

  getBranchPerformance(branchId: string) {
    const txs = this.transactions.filter(t => t.branchId === branchId);
    const products = this.products.filter(p => p.branchId === branchId);
    
    const revenue = txs.reduce((sum, t) => sum + t.total, 0);
    
    // Calculate Real COGS (Cost of Goods Sold)
    let cogs = 0;
    txs.forEach(tx => {
        tx.items.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                cogs += (product.cost * item.quantity);
            } else {
                // Fallback for deleted products or legacy data (estimate 50% cost)
                cogs += (item.price * item.quantity * 0.5); 
            }
        });
    });

    const grossProfit = revenue - cogs;
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

    return { revenue, cogs, grossProfit, stockValue, lowStockCount, transactionCount: txs.length };
  }

  // --- User Management ---
  addUser(user: User): User {
    const users = this.users;
    if (users.some(u => u.email === user.email)) {
      throw new Error("A user with this email already exists.");
    }
    const newUser = { ...user, id: `u${Date.now()}` };
    users.push(newUser);
    this.setStorage('nexile_users', users);
    return newUser;
  }

  deleteUser(userId: string) {
    const users = this.users.filter(u => u.id !== userId);
    this.setStorage('nexile_users', users);
  }

  authenticateUser(email: string, password?: string, accessCode?: string, role?: UserRole): User | null {
    const users = this.users;
    
    if (role === UserRole.MANAGER) {
      // Manager auth via Access Code
      return users.find(u => u.role === UserRole.MANAGER && u.accessCode === accessCode) || null;
    }

    // Standard auth
    return users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.role === role && 
      u.password === password
    ) || null;
  }

  getManagers(): User[] {
    return this.users.filter(u => u.role === UserRole.MANAGER);
  }

  updateUser(updatedUser: User) {
    const users = this.users;
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.setStorage('nexile_users', users);
    }
  }

  assignManagerToBranch(managerId: string, branchId: string) {
    const users = this.users;
    const manager = users.find(u => u.id === managerId);
    if (manager && manager.role === UserRole.MANAGER) {
      const currentBranches = manager.assignedBranchIds || [];
      if (!currentBranches.includes(branchId)) {
        manager.assignedBranchIds = [...currentBranches, branchId];
        this.updateUser(manager);
      }
    }
  }

  unassignManagerFromBranch(managerId: string, branchId: string) {
    const users = this.users;
    const manager = users.find(u => u.id === managerId);
    if (manager && manager.role === UserRole.MANAGER && manager.assignedBranchIds) {
      manager.assignedBranchIds = manager.assignedBranchIds.filter(id => id !== branchId);
      this.updateUser(manager);
    }
  }

  generateAccessCode(): string {
    // Strict 4 digit code
    const min = 1000;
    const max = 9999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  // --- Data Mutations ---
  addProduct(product: Product) {
    const products = this.products;
    products.push(product);
    this.setStorage('nexile_products', products);
  }

  updateStock(productId: string, quantityChange: number) {
    const products = this.products;
    const idx = products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      products[idx].stock += quantityChange;
      this.setStorage('nexile_products', products);
    }
  }

  addTransaction(tx: Transaction) {
    const txs = this.transactions;
    txs.push(tx);
    this.setStorage('nexile_transactions', txs);
  }

  getProductSales(productId: string): { totalSold: number, totalRevenue: number } {
    const txs = this.transactions;
    let totalSold = 0;
    let totalRevenue = 0;

    txs.forEach(tx => {
      tx.items.forEach(item => {
        if (item.productId === productId) {
          totalSold += item.quantity;
          totalRevenue += (item.quantity * item.price);
        }
      });
    });

    return { totalSold, totalRevenue };
  }
}

export const db = new DB();