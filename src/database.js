import mysql from 'mysql2';
import dotenv from 'dotenv'
dotenv.config({ path: './src/.env' })

const connection = mysql.createPool({
    host: process.env.HOST || 'host.docker.internal',
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
    select CONCAT('income-', id) as id, Money as amount, Category as category, Yapping as description, Income_Day as date, 'income' as type, 'Success' as status from incomeinfo
    union
    select CONCAT('expense-', id) as id, -Money, Category, Yapping, Expense_Day, 'expense', 'Success' from expenseinfo
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

export async function UpdateIncome(id, amount, category, description, date){
    const result = await connection.query(`
    update incomeinfo 
    set Money = ?, Category = ?, Yapping = ?, Income_Day = ?
    where id = ?
    `, [amount, category, description, date, id])
    return result;
}

export async function UpdateExpense(id, amount, category, description, date){
    const result = await connection.query(`
    update expenseinfo 
    set Money = ?, Category = ?, Yapping = ?, Expense_Day = ?
    where id = ?
    `, [amount, category, description, date, id])
    return result;
}

export async function DeleteTransaction(id, type){
    const table = type === 'income' ? 'incomeinfo' : 'expenseinfo'
    const result = await connection.query(`delete from ${table} where id = ?`, [id])
    return result;
}


