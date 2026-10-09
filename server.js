const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.json');

// Helper function to read data safely from our local JSON database file
const readDatabase = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Default fallback initial seed data if the file doesn't exist yet
      const initialData = [
        { id: 1, amount: 150, category: 'Food', type: 'expense', date: '2026-10-01' },
        { id: 2, amount: 80, category: 'Transport', type: 'expense', date: '2026-10-02' },
        { id: 3, amount: 200, category: 'Entertainment', type: 'expense', date: '2026-10-03' },
        { id: 4, amount: 120, category: 'Utilities', type: 'expense', date: '2026-10-04' },
        { id: 5, amount: 65, category: 'Health', type: 'expense', date: '2026-10-05' }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading database file:', error);
    return [];
  }
};

// Helper function to save incoming records to our local JSON database file
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
};

// Ensure database file is initialized on server startup
const initializedData = readDatabase();
console.log(`Persistent database initialized at ${DB_FILE} with ${initializedData.length} records.`);

// GET /api/transactions: Return all transaction records
app.get('/api/transactions', (req, res) => {
  const transactions = readDatabase();
  res.json(transactions);
});

// GET /api/analytics: Aggregate and format expense totals by category for Recharts
app.get('/api/analytics', (req, res) => {
  const transactions = readDatabase();
  const expenses = transactions.filter(t => t.type === 'expense');
  
  // Aggregate totals by unique categories
  const categoryTotals = expenses.reduce((acc, current) => {
    const category = current.category || 'Other';
    acc[category] = (acc[category] || 0) + Number(current.amount || 0);
    return acc;
  }, {});

  // Format explicitly as: [ { name: 'Food', value: 150 } ]
  const formattedData = Object.keys(categoryTotals).map(category => ({
    name: category,
    value: Number(categoryTotals[category].toFixed(2))
  }));

  res.json(formattedData);
});

// POST /api/transactions: Save new transaction record to persistent JSON file
app.post('/api/transactions', (req, res) => {
  const { amount, category, type, date } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid positive amount is required' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const transactions = readDatabase();

  const newTransaction = {
    id: Date.now(),
    amount: Number(amount),
    category: category.trim(),
    type: type || 'expense',
    date: date || new Date().toISOString().split('T')[0]
  };

  transactions.push(newTransaction);
  writeDatabase(transactions);

  console.log(`[DB] Saved new transaction id=${newTransaction.id}, category=${newTransaction.category}, amount=${newTransaction.amount}`);
  res.json({ message: 'Transaction logged successfully!', transaction: newTransaction });
});

// DELETE /api/transactions/:id: Remove a transaction record
app.delete('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  const transactions = readDatabase();
  const filtered = transactions.filter(t => t.id !== id);

  if (filtered.length === transactions.length) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  writeDatabase(filtered);
  res.json({ message: 'Transaction deleted successfully!' });
});

app.listen(PORT, () => {
  console.log(`Server handling local persistent storage on port ${PORT}`);
});
