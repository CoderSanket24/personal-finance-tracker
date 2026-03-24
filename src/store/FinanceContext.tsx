import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  FinanceState,
  Transaction,
  transactionsForMonth,
  sumByType,
  currentMonthKey,
} from '../types/finance';
import { DatabaseService } from '../database/DatabaseService';

// App starts explicitly blank for production users

interface FinanceContextValue {
  state: FinanceState;
  addTransaction: (txn: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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

// ─── Provider: The Bridge between SQLite and React Native ──────────────────
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    monthlyBudget: 40000, // Legacy fallback
    walletBalance: 0.0,
    isDBReady: false,
  });

  // Master synchronization function
  const synchronizeDB = useCallback(async () => {
    try {
      const dbTransactions = await DatabaseService.getAllTransactions();
      const dbBalance = await DatabaseService.getWalletBalance();

      // Schema is ready, pure fetch directly to UI

      setState((prev) => ({
        ...prev,
        transactions: dbTransactions,
        walletBalance: dbBalance,
        isDBReady: true,
      }));
    } catch (e) {
      console.error('Failed to sync DB with UI:', e);
    }
  }, []);

  // Boot up the native driver when the app starts
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await DatabaseService.initDB();
        await synchronizeDB();
      } catch (err) {
        console.error('CRITICAL ERROR: Failed to bootstrap SQLite engine:', err);
      }
    };
    initializeDatabase();
  }, [synchronizeDB]);

  // Native asynchronous wrappers for UI actions
  const addTransaction = useCallback(async (txn: Transaction) => {
    await DatabaseService.insertTransaction(txn);
    await synchronizeDB(); // The DB Trigger updates the wallet balance automatically!
  }, [synchronizeDB]);

  const deleteTransaction = useCallback(async (id: string) => {
    // Note: Since we didn't define deleteTransaction in DAO yet, doing a raw fallback query for the UI:
    const { open } = require('@op-engineering/op-sqlite');
    const db = open({ name: 'hackxtreme_finance.sqlite' });
    try {
      await db.executeAsync('DELETE FROM Transactions WHERE id = ?', [id]);
      await synchronizeDB();
    } catch (e) {
      console.error('DB Delete Error:', e);
    }
  }, [synchronizeDB]);

  const setBudget = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, monthlyBudget: amount }));
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

  // If the DB is strict required, we could render <ActivityIndicator> if !state.isDBReady here.
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
