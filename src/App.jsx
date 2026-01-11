import React, { useEffect, useState } from 'react'

const todayString = new Date().toISOString().split('T')[0]

const initialTransactions = [
  { id: 1, date: '2025-01-14', category: 'Subscription', amount: -40.0, status: 'Success', type: 'expense' },
  { id: 2, date: '2025-01-31', category: 'Salary', amount: 2500.0, status: 'Success', type: 'income' },
  { id: 3, date: '2025-01-2', category: 'Shopping', amount: -2500.0, status: 'Success', type: 'expense' }
]

function formatAmount(tx) {
  if (tx.type === 'income') return `+$${tx.amount.toLocaleString()}`
  return `-$${Math.abs(tx.amount).toLocaleString()}`
}

function Notification({ message, type = 'success' }) {
  return (
    <div className={`notification ${type}`} style={{
      position: 'fixed', top: '2rem', right: '2rem', zIndex: 1100,
      background: type === 'success' ? '#10B981' : '#EF4444', color: 'white', padding: '1rem 1.5rem', borderRadius: 8
    }}>{message}</div>
  )
}

export default function App() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ amount: '', category: '', description: '', date: todayString })
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', description: '', date: todayString })
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Just to ensure initial UI is in sync
  }, [])

  const spendingLimit = 12645

  const monthlyIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))

  function addNotification(message, type = 'success') {
    const id = Date.now()
    setNotifications(n => [...n, { id, message, type }])
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 3000)
  }

  function addIncome(e) {
    e && e.preventDefault()
    const amount = parseFloat(incomeForm.amount)
    const { category, description, date } = incomeForm
    if (!amount || !category || !description || !date) return alert('Please fill in all required fields')
    const newTx = { id: Date.now(), date, category: category.charAt(0).toUpperCase() + category.slice(1), amount, status: 'Success', type: 'income', description }
    setTransactions(t => [newTx, ...t])
    setIncomeForm({ amount: '', category: '', description: '', date: todayString })
    setShowIncome(false)
    addNotification('Income added successfully', 'success')
  }

  function addExpense(e) {
    e && e.preventDefault()
    const amount = parseFloat(expenseForm.amount)
    const { category, description, date } = expenseForm
    if (!amount || !category || !description || !date) return alert('Please fill in all required fields')
    const newTx = { id: Date.now(), date, category: category.charAt(0).toUpperCase() + category.slice(1), amount: -amount, status: 'Success', type: 'expense', description }
    setTransactions(t => [newTx, ...t])
    setExpenseForm({ amount: '', category: '', description: '', date: todayString })
    setShowExpense(false)
    addNotification('Expense added successfully', 'success')
  }

  return (
    <div>
      <div className="header">
        <h1>Welcome!</h1>
        <div className="header-control">
          <div className="dropdown">Daily <i className="fas fa-chevron-down"></i></div>
          <div className="date-picker"><i className="fas fa-calendar"></i> 24/12/2025</div>
          <div className="exportBtn"><i className="fas fa-download"></i> Export</div>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Income</h3>
              <button className="card-menu"><i className="fas fa-ellipsis-h"></i></button>
            </div>
            <div className="amount income-amount">${monthlyIncome.toLocaleString()}</div>
            <div className="change"><i className="fas fa-arrow-up"></i>1% vs Last month</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Expenses</h3>
              <button className="card-menu"><i className="fas fa-ellipsis-h"></i></button>
            </div>
            <div className="amount expense-amount">${monthlyExpenses.toLocaleString()}</div>
            <div className="change"><i className="fas fa-arrow-down"></i>-10% vs Last month</div>
          </div>

          <div className="card my-card">
            <div className="card-header">
              <h3 className="card-title">My Card</h3>
              <button className="card-menu" style={{ color: 'whites' }}><i className="fas fa-ellipsis-h"></i></button>
            </div>
            <div style={{ fontSize: '.75rem', opacity: .8, marginBottom: '1rem' }}>Linked to your primary wallet</div>
            <div className="card-chip" />
            <div className="card-number">1234 1234 1234 1234</div>
            <div className="card-holder">Nicki mikkel</div>
            <div className="card-logo">
              <div className="card-logo-circle logo-red" />
              <div className="card-logo-circle logo-orange" />
            </div>

            <div className="spending-section">
              <div style={{ marginBottom: '.5rem', fontSize: '.875rem', opacity: .9 }}>Spending limit</div>
              <div className="spending-limit">${(spendingLimit - monthlyExpenses).toLocaleString()}</div>
              <div className="spending-limit-2">Used from $19999</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min((monthlyExpenses / spendingLimit) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card transaction-section">
          <div className="card-header">
            <h3 className="card-title">recent transaction</h3>
            <div className="filters">
              <button className="filter-btn"><i className="fas fa-sort"></i> Short</button>
              <button className="filter-btn"><i className="fas fa-filter"></i> Filter</button>
            </div>
          </div>

          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date<i className="fas fa-sort"></i></th>
                <th>Category <i className="fas fa-sort"></i></th>
                <th>Amount <i className="fas fa-sort"></i></th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="transactions-table">
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{tx.category}</td>
                  <td style={{ color: tx.type === 'income' ? '#10B981' : '#EF4444' }}>{formatAmount(tx)}</td>
                  <td><span className="status-success">{tx.status}</span></td>
                  <td><button className="action-btn"><i className="fas fa-ellipsis-h"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="add-buttons">
        <button className="fab fab-income" onClick={() => setShowIncome(true)} title="Add income"><i className="fas fa-plus" /></button>
        <button className="fab fab-expense" onClick={() => setShowExpense(true)} title="Add expense"><i className="fas fa-minus" /></button>
      </div>

      {showIncome && (
        <div className="Modal" onClick={(e) => { if (e.target.className === 'Modal') setShowIncome(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Income</h2>
              <button className="close-btn" onClick={() => setShowIncome(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="incomeForm" onSubmit={addIncome}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input type="number" className="form-input" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter Amount" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={incomeForm.category} onChange={e => setIncomeForm(f => ({ ...f, category: e.target.value }))} required>
                    <option value="">Select Category</option>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="business">Business</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-input" value={incomeForm.description} onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))} placeholder="Enter Description" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={incomeForm.date} onChange={e => setIncomeForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowIncome(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addIncome}>Add Income</button>
            </div>
          </div>
        </div>
      )}

      {showExpense && (
        <div className="Modal" onClick={(e) => { if (e.target.className === 'Modal') setShowExpense(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Expense</h2>
              <button className="close-btn" onClick={() => setShowExpense(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="expenseForm" onSubmit={addExpense}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input type="number" className="form-input" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter Amount" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} required>
                    <option value="">Select Category</option>
                    <option value="food">Food</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="transport">Transport</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-input" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Enter Description" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExpense(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addExpense}>Add Expense</button>
            </div>
          </div>
        </div>
      )}

      {notifications.map(n => <Notification key={n.id} message={n.message} type={n.type} />)}
    </div>
  )
}
