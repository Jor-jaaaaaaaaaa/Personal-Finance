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

// InsertData(100.00,"some","what","2024-12-1")  // Commented out test call
