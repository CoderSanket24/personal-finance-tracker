import { open } from '@op-engineering/op-sqlite';
import { INIT_QUERIES } from './schema';
import { Transaction, CategoryId } from '../types/finance';

// Open synchronous connection via JSI
const db = open({
  name: 'hackxtreme_finance.sqlite',
});

class DatabaseServiceImpl {
  /**
   * Bootstraps the entire schema if it doesn't exist
   */
  public initDB(): void {
    try {
      console.log('Bootstrapping SQLite Schema...');
      
      // Execute all base table constraints, triggers, and indices sequentially
      for (const query of INIT_QUERIES) {
        db.execute(query);
      }
      
      console.log('SQLite Schema initialized successfully.');
    } catch (e) {
      console.error('Failed to initialize database:', e);
      throw e;
    }
  }

  /**
   * Robust DAO Method: Inserts a single transaction
   * (The SQLite Trigger will automatically handle updating the Wallet balance)
   */
  public async insertTransaction(data: Transaction): Promise<void> {
    const query = `
      INSERT INTO Transactions (id, walletId, amount, type, categoryId, description, merchant, date, isVoiceLogged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      'default_wallet_1', // Hardcoded default wallet as per bare minimum requirements
      data.amount,
      data.type,
      data.categoryId,
      data.description || null,
      data.merchant || null,
      data.date,
      data.isVoiceLogged ? 1 : 0
    ];

    try {
      db.execute(query, params);
    } catch (e) {
      console.error('Error inserting transaction:', e);
      throw e;
    }
  }

  /**
   * Retrieves chronological array of transactions spanning a strict date range
   * Indexed via `idx_transactions_date`
   */
  public async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const query = `SELECT * FROM Transactions WHERE date >= ? AND date <= ? ORDER BY date DESC`;
    try {
      const result = await db.execute(query, [startDate, endDate]);
      // The JSI driver automatically maps result.rows to object arrays!
      const rows = result.rows || [];
      
      return rows.map((r: any) => ({
        id: r.id,
        type: r.type as 'income' | 'expense',
        amount: r.amount,
        categoryId: r.categoryId as CategoryId,
        description: r.description,
        merchant: r.merchant,
        date: r.date,
        isVoiceLogged: Boolean(r.isVoiceLogged),
      }));
    } catch (e) {
      console.error('Error fetching date range:', e);
      return [];
    }
  }

  /**
   * Executes a highly optimized GROUP BY sum to feed the AI Advisor
   * Indexed via `idx_transactions_category`
   */
  public async getAggregatedSpendingByCategory(month: string, year: string): Promise<Record<CategoryId, number>> {
    // Format: 'YYYY-MM' to match ISO 'YYYY-MM-DD' substrings
    const monthPrefix = `${year}-${month.padStart(2, '0')}`;
    const query = `
      SELECT categoryId, SUM(amount) as totalSpent 
      FROM Transactions 
      WHERE type = 'expense' AND date LIKE ? 
      GROUP BY categoryId
    `;
    
    try {
      const result = await db.execute(query, [`${monthPrefix}%`]);
      const rows = result.rows || [];
      
      const aggregations: Record<string, number> = {};
      for (const row of rows) {
        aggregations[row.categoryId as string] = row.totalSpent as number;
      }
      return aggregations as Record<CategoryId, number>;
    } catch (e) {
      console.error('Error aggregating spending:', e);
      return {} as Record<CategoryId, number>;
    }
  }

  /**
   * Standard helper to fetch all active transactions
   */
  public async getAllTransactions(): Promise<Transaction[]> {
    const query = `SELECT * FROM Transactions ORDER BY date DESC`;
    try {
      const result = await db.execute(query);
      const rows = result.rows || [];
      
      return rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId,
        description: r.description,
        merchant: r.merchant,
        date: r.date,
        isVoiceLogged: Boolean(r.isVoiceLogged),
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Retrieves the synchronized wallet balance handled strictly by SQLite Triggers
   */
  public async getWalletBalance(walletId: string = 'default_wallet_1'): Promise<number> {
    const query = `SELECT balance FROM Wallets WHERE id = ?`;
    try {
      const result = await db.execute(query, [walletId]);
      if (result.rows?.length) {
        return (result.rows[0] as any).balance;
      }
      return 0.0;
    } catch (e) {
      return 0.0;
    }
  }
}

export const DatabaseService = new DatabaseServiceImpl();
