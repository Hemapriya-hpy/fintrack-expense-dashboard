import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PALETTE = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const PRESET_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Health',
  'Housing',
  'Shopping',
  'Groceries',
  'Education',
  'Travel'
];

export default function App() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch aggregated analytics data for charts
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  // Fetch full transaction history
  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const list = await res.json();
      setTransactions(list);
    } catch (err) {
      console.error('Transactions fetch error:', err);
    }
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAnalytics(), fetchTransactions()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setStatusMessage({ text: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }
    if (!formData.category.trim()) {
      setStatusMessage({ text: 'Please enter or select a category', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error saving transaction');
      }

      await refreshAllData();
      setFormData({
        amount: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      });
      setStatusMessage({ text: 'Transaction recorded successfully!', type: 'success' });
      setTimeout(() => setStatusMessage({ text: '', type: '' }), 3500);
    } catch (err) {
      console.error('Submission error:', err);
      setStatusMessage({ text: err.message || 'Error submitting transaction', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Metrics summary
  const totalExpense = analyticsData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const topCategory = analyticsData.length > 0
    ? [...analyticsData].sort((a, b) => b.value - a.value)[0]?.name
    : 'N/A';

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : 0;
      return (
        <div style={{ background: '#1E293B', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#38BDF8' }}>${Number(item.value).toFixed(2)} ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1E293B', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          <p style={{ margin: '4px 0 0 0', color: '#60A5FA' }}>Total: ${Number(payload[0].value).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#1E293B', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '6px 14px', borderRadius: '20px', color: '#2563EB', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            <span>📊</span> FinTrack Analytics Suite
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0', color: '#0F172A', letterSpacing: '-0.5px' }}>
            Multi-Category Expense Dashboard
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Track, analyze, and visualize personal expenditures with real-time persistent storage
          </p>
        </header>

        {/* Top Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
              ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Categories</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB', marginTop: '6px' }}>
              {analyticsData.length}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Expense Sector</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', marginTop: '6px' }}>
              {topCategory}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged Transactions</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#8B5CF6', marginTop: '6px' }}>
              {transactions.length}
            </div>
          </div>
        </div>

        {/* Main Grid: Form + Visualizations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          
          {/* Transaction Intake Form */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Log New Transaction</h2>
              <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>Local JSON Sync</span>
            </div>

            {statusMessage.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: statusMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: statusMessage.type === 'success' ? '#166534' : '#991B1B',
                border: `1px solid ${statusMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`
              }}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Category *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Enter or pick category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                  <datalist id="category-suggestions">
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                {/* Quick Selection Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_CATEGORIES.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: formData.category === cat ? '#2563EB' : '#F8FAFC',
                        color: formData.category === cat ? '#FFFFFF' : '#64748B',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'background 0.2s ease',
                }}
              >
                {isLoading ? 'Saving Transaction...' : '+ Record Transaction'}
              </button>
            </form>
          </div>

          {/* Responsive Bar Chart View */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Expense Bar Breakdown</h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Total expenditure grouped by category</p>
              </div>
              <button
                onClick={refreshAllData}
                title="Refresh analytics"
                style={{ background: '#F1F5F9', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
              >
                ↻ Refresh
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
              {analyticsData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  No expense records yet. Add a transaction to view metrics!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar
                      dataKey="value"
                      name="Expense Amount ($)"
                      fill="#2563EB"
                      radius={[6, 6, 0, 0]}
                    >
                      {analyticsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Pie Chart View */}
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Category Distribution Share</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Proportional share per category</p>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
              Total: ${totalExpense.toFixed(2)}
            </span>
          </div>

          <div style={{ minHeight: '340px', width: '100%' }}>
            {analyticsData.length === 0 ? (
              <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '14px' }}>
                No expense data available for distribution chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '15px' }}
                  />
                  <Pie
                    data={analyticsData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {analyticsData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Persistent Records Table View */}
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Persistent Transaction Ledger</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Real-time records backed by backend JSON storage</p>
            </div>
            <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              {transactions.length} Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0', fontSize: '14px' }}>
              No transactions logged yet. Use the form above to add one!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...transactions].reverse().map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px', color: '#64748B' }}>{t.date}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#0F172A' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', marginRight: '8px' }}></span>
                        {t.category}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: t.type === 'expense' ? '#FEE2E2' : '#DCFCE7',
                          color: t.type === 'expense' ? '#DC2626' : '#16A34A',
                          textTransform: 'capitalize'
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: t.type === 'expense' ? '#0F172A' : '#16A34A' }}>
                        {t.type === 'expense' ? '-' : '+'}${Number(t.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Delete entry"
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
