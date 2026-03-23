import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';
import {
  FinanceState,
  FinanceAction,
  Transaction,
  transactionsForMonth,
  sumByType,
  currentMonthKey,
} from '../types/finance';

// ─── Default seed data (realistic demo) ───────────────────────────────────

const SEED_MONTH = currentMonthKey();

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 65000,
    categoryId: 'salary',
    description: 'Monthly salary – March 2026',
    date: `${SEED_MONTH}-01`,
  },
  {
    id: '2',
    type: 'expense',
    amount: 15000,
    categoryId: 'rent',
    description: 'Apartment rent',
    date: `${SEED_MONTH}-01`,
  },
  {
    id: '3',
    type: 'expense',
    amount: 4200,
    categoryId: 'food',
    description: 'Groceries + restaurants',
    date: `${SEED_MONTH}-05`,
  },
  {
    id: '4',
    type: 'expense',
    amount: 1800,
    categoryId: 'transport',
    description: 'Ola / auto rides',
    date: `${SEED_MONTH}-08`,
  },
  {
    id: '5',
    type: 'expense',
    amount: 2500,
    categoryId: 'shopping',
    description: 'Myntra order',
    date: `${SEED_MONTH}-10`,
  },
  {
    id: '6',
    type: 'income',
    amount: 12000,
    categoryId: 'freelance',
    description: 'UI design freelance project',
    date: `${SEED_MONTH}-12`,
  },
  {
    id: '7',
    type: 'expense',
    amount: 799,
    categoryId: 'entertainment',
    description: 'Netflix subscription',
    date: `${SEED_MONTH}-15`,
  },
  {
    id: '8',
    type: 'expense',
    amount: 1200,
    categoryId: 'health',
    description: 'Doctor visit + medicine',
    date: `${SEED_MONTH}-17`,
  },
];

const INITIAL_STATE: FinanceState = {
  transactions: SEED_TRANSACTIONS,
  monthlyBudget: 40000,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_BUDGET':
      return { ...state, monthlyBudget: action.payload };
    case 'CLEAR_ALL':
      return { ...state, transactions: [] };
    default:
      return state;
  }
}

// ─── Context value ─────────────────────────────────────────────────────────

interface FinanceContextValue {
  state: FinanceState;
  addTransaction: (txn: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (amount: number) => void;
  monthlyExpenses: number;
  monthlyIncome: number;
  currentMonthTxns: Transaction[];
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export const useFinance = (): FinanceContextValue => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>');
  return ctx;
};

// ─── Provider ──────────────────────────────────────────────────────────────

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, INITIAL_STATE);

  const addTransaction = useCallback((txn: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: txn });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const setBudget = useCallback((amount: number) => {
    dispatch({ type: 'SET_BUDGET', payload: amount });
  }, []);

  const currentMonthTxns = useMemo(
    () => transactionsForMonth(state.transactions, currentMonthKey()),
    [state.transactions],
  );

  const monthlyExpenses = useMemo(
    () => sumByType(currentMonthTxns, 'expense'),
    [currentMonthTxns],
  );

  const monthlyIncome = useMemo(
    () => sumByType(currentMonthTxns, 'income'),
    [currentMonthTxns],
  );

  const value: FinanceContextValue = {
    state,
    addTransaction,
    deleteTransaction,
    setBudget,
    monthlyExpenses,
    monthlyIncome,
    currentMonthTxns,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
