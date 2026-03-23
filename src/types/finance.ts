// ─── Finance Domain Types ──────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income';

export type CategoryId =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'utilities'
  | 'rent'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  food:          { id: 'food',          label: 'Food & Dining',   icon: '🍔', color: '#F59E0B' },
  transport:     { id: 'transport',     label: 'Transport',       icon: '🚗', color: '#3B82F6' },
  shopping:      { id: 'shopping',      label: 'Shopping',        icon: '🛍️', color: '#EC4899' },
  entertainment: { id: 'entertainment', label: 'Entertainment',   icon: '🎬', color: '#8B5CF6' },
  health:        { id: 'health',        label: 'Health',          icon: '💊', color: '#10B981' },
  utilities:     { id: 'utilities',     label: 'Utilities',       icon: '💡', color: '#06B6D4' },
  rent:          { id: 'rent',          label: 'Rent / Housing',  icon: '🏠', color: '#EF4444' },
  salary:        { id: 'salary',        label: 'Salary',          icon: '💼', color: '#22C55E' },
  freelance:     { id: 'freelance',     label: 'Freelance',       icon: '💻', color: '#00D9FF' },
  investment:    { id: 'investment',    label: 'Investments',     icon: '📈', color: '#A855F7' },
  other:         { id: 'other',         label: 'Other',           icon: '📦', color: '#64748B' },
};

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;           // in ₹ (paise stored as float)
  categoryId: CategoryId;
  description: string;
  date: string;             // ISO-8601 date string
  isVoiceLogged?: boolean;
}

// ─── State ─────────────────────────────────────────────────────────────────

export interface FinanceState {
  transactions: Transaction[];
  monthlyBudget: number;
}

// ─── Actions ───────────────────────────────────────────────────────────────

export type FinanceAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string /* id */ }
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'CLEAR_ALL' };

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Month string like "March 2026" */
export function currentMonthLabel(): string {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** Returns YYYY-MM for the current month */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Filter transactions for a given YYYY-MM key */
export function transactionsForMonth(txns: Transaction[], monthKey: string): Transaction[] {
  return txns.filter(t => t.date.startsWith(monthKey));
}

/** Sum of amounts for a given type */
export function sumByType(txns: Transaction[], type: TransactionType): number {
  return txns.filter(t => t.type === type).reduce((acc, t) => acc + t.amount, 0);
}

/** Format number as ₹ currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Generate a simple unique ID (no external deps) */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
