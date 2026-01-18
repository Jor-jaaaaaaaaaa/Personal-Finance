import mysql from 'mysql2';
import dotenv from 'dotenv'
dotenv.config({ path: './src/.env' })

const connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE}
).promise()

export async function InsertIncome(amount, category, description, date){
    const result = await connection.query(`
    insert into incomeinfo (Money, Category, Yapping, Income_Day)  
    values(?, ?, ?, ?) 
    `, [amount, category, description, date])
    return result;
}

export async function InsertExpense(amount, category, description, date){
    const result = await connection.query(`
    insert into expenseinfo (Money, Category, Yapping, Expense_Day)  
    values(?, ?, ?, ?) 
    `, [amount, category, description, date])
    return result;
}

export async function GetAllTransactions(){
    const [rows] = await connection.query(`
    select id, Money as amount, Category as category, Yapping as description, Income_Day as date, 'income' as type, 'Success' as status from incomeinfo
    union
    select id, -Money, Category, Yapping, Expense_Day, 'expense', 'Success' from expenseinfo
    order by date desc
    `)
    
    return rows
}

export async function GetMonthlySummary(year, month){
    const [incomeResult] = await connection.query(`
    select COALESCE(SUM(Money), 0) as total from incomeinfo
    where YEAR(Income_Day) = ? and MONTH(Income_Day) = ?
    `, [year, month])
    
    const [expenseResult] = await connection.query(`
    select COALESCE(SUM(Money), 0) as total from expenseinfo
    where YEAR(Expense_Day) = ? and MONTH(Expense_Day) = ?
    `, [year, month])
    
    return {
        income: incomeResult[0].total,
        expenses: expenseResult[0].total
    }
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Financial Report', 14, 15);
  
  // Add summary
  doc.setFontSize(12);
  doc.text(`Income: $${monthlyIncome.toLocaleString()}`, 14, 30);
  doc.text(`Expenses: $${monthlyExpenses.toLocaleString()}`, 14, 40);
  doc.text(`Balance: $${(monthlyIncome - monthlyExpenses).toLocaleString()}`, 14, 50);
  
  // Add transactions table
  const tableData = transactions.map(tx => [
    new Date(tx.date).toLocaleDateString(),
    tx.category,
    formatAmount(tx),
    tx.description
  ]);
  
  doc.autoTable({
    head: [['Date', 'Category', 'Amount', 'Description']],
    body: tableData,
    startY: 60
  });
  
  doc.save('financial-report.pdf');
}

