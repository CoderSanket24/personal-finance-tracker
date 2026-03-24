export const INIT_QUERIES = [
  // 1. Wallets Table
  `CREATE TABLE IF NOT EXISTS Wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0.0
  );`,

  // Insert default wallet if it doesn't exist
  `INSERT OR IGNORE INTO Wallets (id, name, balance) VALUES ('default_wallet_1', 'Main Account', 0.0);`,

  // 2. Transactions Table
  `CREATE TABLE IF NOT EXISTS Transactions (
    id TEXT PRIMARY KEY,
    walletId TEXT NOT NULL DEFAULT 'default_wallet_1',
    amount REAL NOT NULL,
    type TEXT NOT NULL,          -- 'income' or 'expense'
    categoryId TEXT NOT NULL,    -- Maps to existing CategoryId enum
    description TEXT,            -- User's note or description
    merchant TEXT,               -- Discovered merchant from AI
    date TEXT NOT NULL,          -- ISO String for easy charting
    isVoiceLogged INTEGER DEFAULT 0,
    FOREIGN KEY (walletId) REFERENCES Wallets(id)
  );`,

  // 3. High-Performance Indexes for LLM Aggregations
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON Transactions(date);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_category ON Transactions(categoryId);`,

  // 4. Triggers to automatically synchronize the Wallet Balance
  // INSERT Trigger
  `CREATE TRIGGER IF NOT EXISTS trigger_sync_wallet_insert
   AFTER INSERT ON Transactions
   BEGIN
     UPDATE Wallets 
     SET balance = balance + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
     WHERE id = NEW.walletId;
   END;`,

  // UPDATE Trigger
  `CREATE TRIGGER IF NOT EXISTS trigger_sync_wallet_update
   AFTER UPDATE ON Transactions
   BEGIN
     UPDATE Wallets 
     -- First revert the old amount's effect
     SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
                           + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
     WHERE id = NEW.walletId;
   END;`,

  // DELETE Trigger
  `CREATE TRIGGER IF NOT EXISTS trigger_sync_wallet_delete
   AFTER DELETE ON Transactions
   BEGIN
     UPDATE Wallets 
     SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
     WHERE id = OLD.walletId;
   END;`
];
