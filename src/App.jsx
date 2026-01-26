import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
const API_BASE_URL = "http://localhost:8080";
const todayString = new Date().toISOString().split("T")[0];

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function formatAmount(tx) {
  if (tx.type === "income") return `+$${tx.amount.toLocaleString()}`;
  return `-$${Math.abs(tx.amount).toLocaleString()}`;
}

function Notification({ message, type = "success" }) {
  return (
    <div
      className={`notification ${type}`}
      style={{
        position: "fixed",
        top: "2rem",
        right: "2rem",
        zIndex: 1100,
        background: type === "success" ? "#10B981" : "#EF4444",
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: 8,
      }}
    >
      {message}
    </div>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: todayString,
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: todayString,
  });
  const [notifications, setNotifications] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState({
    incomeChange: 0,
    expenseChange: 0,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    category: "all",
    dateRange: "all",
    type: "all",
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    // Load transactions from backend on component mount
    fetchTransactions();
    fetchMonthlySummary();
  }, []);

  async function fetchTransactions() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-transactions`,
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Keep initial transactions if fetch fails
    }
  }

  async function fetchMonthlySummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/monthly-summary`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      const data = await response.json();

      const { current, previous } = data;

      // Calculate percentage changes
      const incomeChange =
        previous.income > 0
          ? ((current.income - previous.income) / previous.income) * 100
          : current.income > 0
            ? 100
            : 0;

      const expenseChange =
        previous.expenses > 0
          ? ((current.expenses - previous.expenses) / previous.expenses) * 100
          : current.expenses > 0
            ? 100
            : 0;

      setMonthlyComparison({ incomeChange, expenseChange });
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
    }
  }

  const spendingLimit = 12645;

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by type (income/expense)
    if (filterOptions.type !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterOptions.type);
    }

    // Filter by category
    if (filterOptions.category !== "all") {
      filtered = filtered.filter(
        (tx) =>
          tx.category.toLowerCase() === filterOptions.category.toLowerCase(),
      );
    }

    // Filter by date range
    if (filterOptions.dateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);

        if (filterOptions.dateRange === "today")
          return txDate.getTime() === today.getTime();
        if (filterOptions.dateRange === "week") return txDate >= startOfWeek;
        if (filterOptions.dateRange === "month") return txDate >= startOfMonth;
        return true;
      });
    }

    // Filter by amount range
    if (filterOptions.minAmount || filterOptions.maxAmount) {
      filtered = filtered.filter((tx) => {
        const amount = Math.abs(tx.amount);
        const min = filterOptions.minAmount
          ? parseFloat(filterOptions.minAmount)
          : 0;
        const max = filterOptions.maxAmount
          ? parseFloat(filterOptions.maxAmount)
          : Infinity;
        return amount >= min && amount <= max;
      });
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  const currentMonthStr = todayString.substring(0, 7); // "2026-01" format
  const monthlyIncome = transactions
    .filter((t) => t.date.substring(0, 7) === currentMonthStr && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = Math.abs(
    transactions
      .filter((t) => t.date.substring(0, 7) === currentMonthStr && t.amount < 0)
      .reduce((s, t) => s + t.amount, 0),
  );

  function addNotification(message, type = "success") {
    const id = Date.now();
    setNotifications((n) => [...n, { id, message, type }]);
    setTimeout(
      () => setNotifications((n) => n.filter((x) => x.id !== id)),
      3000,
    );
  }

  async function addIncome(e) {
    e && e.preventDefault();
    const amount = parseFloat(incomeForm.amount);
    const { category, description, date } = incomeForm;
    if (!amount || !category || !description || !date)
      return alert("Please fill in all required fields");

    try {
      // Send to backend
      const response = await fetch(
        "http://localhost:8080/api/add-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            category,
            description,
            date,
            type: "income",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to add income");

      setIncomeForm({
        amount: "",
        category: "",
        description: "",
        date: todayString,
      });
      setShowIncome(false);
      fetchTransactions();
      fetchMonthlySummary();
      addNotification("Income added successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      addNotification("Failed to add income", "error");
    }
  }

  async function addExpense(e) {
    e && e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    const { category, description, date } = expenseForm;
    if (!amount || !category || !description || !date)
      return alert("Please fill in all required fields");

    try {
      // Send to backend
      const response = await fetch(
        "http://localhost:8080/api/add-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            category,
            description,
            date,
            type: "expense",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to add expense");

      setExpenseForm({
        amount: "",
        category: "",
        description: "",
        date: todayString,
      });
      fetchTransactions();
      fetchMonthlySummary();
      setShowExpense(false);
      addNotification("Expense added successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      addNotification("Failed to add expense", "error");
    }
  }
  function exportToPDF() {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Financial Report", 14, 15);

    // Add summary
    doc.setFontSize(12);
    doc.text(`Income: $${monthlyIncome.toLocaleString()}`, 14, 30);
    doc.text(`Expenses: $${monthlyExpenses.toLocaleString()}`, 14, 40);
    doc.text(
      `Balance: $${(monthlyIncome - monthlyExpenses).toLocaleString()}`,
      14,
      50,
    );

    // Add transactions as text
    doc.setFontSize(11);
    doc.text("Transactions:", 14, 65);

    let yPosition = 75;
    transactions.slice(0, 20).forEach((tx) => {
      const date = new Date(tx.date).toLocaleDateString();
      const amount = formatAmount(tx);
      const text = `${date} | ${tx.category} | ${amount} | ${tx.description}`;
      doc.text(text, 14, yPosition);
      yPosition += 8;
    });

    doc.save("financial-report.pdf");
  }

  async function deleteTransaction(id, type) {
    // Extract numeric ID from string format "income-3" or "expense-3"
    const numericId = parseInt(id.split("-")[1]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/delete-transaction`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: numericId, type }),
        },
      );
      if (!response.ok) throw new Error("Failed to delete");
      addNotification("Transaction deleted successfully", "success");
      fetchTransactions();
      fetchMonthlySummary();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      addNotification("Failed to delete transaction", "error");
    }
  }

  async function editTransaction(transaction) {
    // Extract numeric ID from string format "income-3" or "expense-3"
    const numericId = parseInt(transaction.id.split("-")[1]);

    // Show edit form with transaction data
    if (transaction.type === "income") {
      setIncomeForm({
        id: numericId,
        amount: Math.abs(transaction.amount),
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
      });
      setShowIncome(true);
    } else {
      setExpenseForm({
        id: numericId,
        amount: Math.abs(transaction.amount),
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
      });
      setShowExpense(true);
    }
  }

  async function submitIncomeForm(e) {
    e && e.preventDefault();
    try {
      const url = incomeForm.id
        ? `${API_BASE_URL}/api/update-transaction`
        : `${API_BASE_URL}/api/add-transaction`;
      const method = incomeForm.id ? "PUT" : "POST";
      const payload = incomeForm.id
        ? { ...incomeForm, type: "income" }
        : {
            amount: incomeForm.amount,
            category: incomeForm.category,
            description: incomeForm.description,
            date: incomeForm.date,
            type: "income",
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");
      addNotification(
        incomeForm.id ? "Income updated" : "Income added",
        "success",
      );
      setIncomeForm({
        amount: "",
        category: "",
        description: "",
        date: todayString,
      });
      setShowIncome(false);
      fetchTransactions();
      fetchMonthlySummary();
    } catch (error) {
      addNotification("Error saving income", "error");
    }
  }

  async function submitExpenseForm(e) {
    e && e.preventDefault();
    try {
      const url = expenseForm.id
        ? `${API_BASE_URL}/api/update-transaction`
        : `${API_BASE_URL}/api/add-transaction`;
      const method = expenseForm.id ? "PUT" : "POST";
      const payload = expenseForm.id
        ? { ...expenseForm, type: "expense" }
        : {
            amount: expenseForm.amount,
            category: expenseForm.category,
            description: expenseForm.description,
            date: expenseForm.date,
            type: "expense",
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");
      addNotification(
        expenseForm.id ? "Expense updated" : "Expense added",
        "success",
      );
      setExpenseForm({
        amount: "",
        category: "",
        description: "",
        date: todayString,
      });
      setShowExpense(false);
      fetchTransactions();
      fetchMonthlySummary();
    } catch (error) {
      addNotification("Error saving expense", "error");
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Welcome!</h1>
        <div className="header-control">
          <div className="dropdown">
            Daily <i className="fas fa-chevron-down"></i>
          </div>
          <div className="date-picker">
            <i className="fas fa-calendar"></i> {formatDate(todayString)}
          </div>
          {/* <div className="exportBtn"><i className="fas fa-download"></i> Export</div> */}
          <button
            className="exportBtn"
            onClick={exportToPDF}
            title="Export to PDF"
          >
            <i className="fas fa-download"></i> Export PDF
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Income</h3>
            </div>
            <div className="amount income-amount">
              ${monthlyIncome.toLocaleString()}
            </div>
            <div
              className="change1"
              style={{
                color:
                  monthlyComparison.incomeChange >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              <i
                className={`fas fa-arrow-${monthlyComparison.incomeChange >= 0 ? "up" : "down"}`}
              ></i>
              {Math.abs(monthlyComparison.incomeChange).toFixed(1)}% vs Last
              month
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Expenses</h3>
            </div>
            <div className="amount expense-amount">
              ${monthlyExpenses.toLocaleString()}
            </div>
            <div
              className="change2"
              style={{
                color:
                  monthlyComparison.expenseChange <= 0 ? "#10B981" : "#EF4444",
              }}
            >
              <i
                className={`fas fa-arrow-${monthlyComparison.expenseChange <= 0 ? "down" : "up"}`}
              ></i>
              {Math.abs(monthlyComparison.expenseChange).toFixed(1)}% vs Last
              month
            </div>
          </div>

          <div className="card my-card">
            <div className="card-header">
              <h3 className="card-title">My Card</h3>
            </div>
            <div
              style={{ fontSize: ".75rem", opacity: 0.8, marginBottom: "1rem" }}
            >
              Linked to your primary wallet
            </div>
            <div className="card-chip" />
            <div className="card-number">1234 1234 1234 1234</div>
            <div className="card-holder">Nicki mikkel</div>
            <div className="card-logo">
              <div className="card-logo-circle logo-red" />
              <div className="card-logo-circle logo-orange" />
            </div>

            <div className="spending-section">
              <div
                style={{
                  marginBottom: ".5rem",
                  fontSize: ".875rem",
                  opacity: 0.9,
                }}
              >
                Spending limit
              </div>
              <div className="spending-limit">
                ${(spendingLimit - monthlyExpenses).toLocaleString()}
              </div>
              <div className="spending-limit-2">Used from $19999</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((monthlyExpenses / spendingLimit) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card transaction-section">
          <div className="card-header">
            <h3 className="card-title">recent transaction</h3>
            <div className="filters">
              <button
                className="filter-btn"
                onClick={() => setShowFilterModal(true)}
              >
                <i className="fas fa-filter"></i> Filter
              </button>
            </div>
          </div>

          <table className="transactions-table">
            <thead>
              <tr>
                <th>
                  Date<i className="fas fa-sort"></i>
                </th>
                <th>
                  Category <i className="fas fa-sort"></i>
                </th>
                <th>
                  Amount <i className="fas fa-sort"></i>
                </th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="transactions-table">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {new Date(tx.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>{tx.category}</td>
                    <td
                      style={{
                        color: tx.type === "income" ? "#10B981" : "#EF4444",
                      }}
                    >
                      {formatAmount(tx)}
                    </td>
                    <td>
                      <span className="status-success">{tx.status}</span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <button
                        className="action-btn"
                        onClick={() =>
                          setOpenMenuId(openMenuId === tx.id ? null : tx.id)
                        }
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                      {openMenuId === tx.id && (
                        <div className="action-menu">
                          <button
                            className="action-menu-btn edit"
                            onClick={() => {
                              editTransaction(tx);
                              setOpenMenuId(null);
                            }}
                          >
                            <i
                              className="fas fa-edit"
                              style={{ marginRight: "0.5rem" }}
                            ></i>{" "}
                            Edit
                          </button>
                          <button
                            className="action-menu-btn delete"
                            onClick={() => {
                              deleteTransaction(tx.id, tx.type);
                              setOpenMenuId(null);
                            }}
                          >
                            <i
                              className="fas fa-trash"
                              style={{ marginRight: "0.5rem" }}
                            ></i>{" "}
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="add-buttons">
        <button
          className="fab fab-income"
          onClick={() => setShowIncome(true)}
          title="Add income"
        >
          <i className="fas fa-plus" />
        </button>
        <button
          className="fab fab-expense"
          onClick={() => setShowExpense(true)}
          title="Add expense"
        >
          <i className="fas fa-minus" />
        </button>
      </div>

      {showIncome && (
        <div
          className="Modal"
          onClick={(e) => {
            if (e.target.className === "Modal") setShowIncome(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Income</h2>
              <button
                className="close-btn"
                onClick={() => setShowIncome(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="incomeForm" onSubmit={addIncome}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    value={incomeForm.amount}
                    onChange={(e) =>
                      setIncomeForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="Enter Amount"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={incomeForm.category}
                    onChange={(e) =>
                      setIncomeForm((f) => ({ ...f, category: e.target.value }))
                    }
                    required
                  >
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
                  <input
                    type="text"
                    className="form-input"
                    value={incomeForm.description}
                    onChange={(e) =>
                      setIncomeForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter Description"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={incomeForm.date}
                    onChange={(e) =>
                      setIncomeForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowIncome(false);
                  setIncomeForm({
                    amount: "",
                    category: "",
                    description: "",
                    date: todayString,
                  });
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitIncomeForm}>
                {incomeForm.id ? "Update Income" : "Add Income"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpense && (
        <div
          className="Modal"
          onClick={(e) => {
            if (e.target.className === "Modal") setShowExpense(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Expense</h2>
              <button
                className="close-btn"
                onClick={() => setShowExpense(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="expenseForm" onSubmit={addExpense}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="Enter Amount"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm((f) => ({
                        ...f,
                        category: e.target.value,
                      }))
                    }
                    required
                  >
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
                  <input
                    type="text"
                    className="form-input"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter Description"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowExpense(false);
                  setExpenseForm({
                    amount: "",
                    category: "",
                    description: "",
                    date: todayString,
                  });
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitExpenseForm}>
                {expenseForm.id ? "Update Expense" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notifications.map((n) => (
        <Notification key={n.id} message={n.message} type={n.type} />
      ))}

      {showFilterModal && (
        <div
          className="Modal"
          onClick={(e) => {
            if (e.target.className === "Modal") setShowFilterModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Filter Transactions</h2>
              <button
                className="close-btn"
                onClick={() => setShowFilterModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={filterOptions.type}
                  onChange={(e) =>
                    setFilterOptions({ ...filterOptions, type: e.target.value })
                  }
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filterOptions.category}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="all">All Categories</option>
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="business">Business</option>
                  <option value="investment">Investment</option>
                  <option value="food">Food</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="shopping">Shopping</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date Range</label>
                <select
                  className="form-select"
                  value={filterOptions.dateRange}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      dateRange: e.target.value,
                    })
                  }
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={filterOptions.minAmount}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      minAmount: e.target.value,
                    })
                  }
                  placeholder="Min amount (optional)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={filterOptions.maxAmount}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      maxAmount: e.target.value,
                    })
                  }
                  placeholder="Max amount (optional)"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilterOptions({
                    category: "all",
                    dateRange: "all",
                    type: "all",
                    minAmount: "",
                    maxAmount: "",
                  });
                  setShowFilterModal(false);
                }}
              >
                Clear All
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowFilterModal(false)}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
