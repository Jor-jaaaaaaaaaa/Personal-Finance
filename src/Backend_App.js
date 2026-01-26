import express from 'express'
import cors from 'cors'
import { InsertExpense, InsertIncome, GetAllTransactions, GetMonthlySummary, UpdateIncome, UpdateExpense, DeleteTransaction } from './database.js'

const app = express()
const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:8080"]
}

app.use(cors(corsOptions))
app.use(express.json())

app.get("/api/get-transactions", async (req,res)=>{
    try {
        const transactions = await GetAllTransactions()
        res.json(transactions)
    } catch (error) {
        console.error('Error fetching transactions:', error)
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message })
    }
})

app.get("/api/monthly-summary", async (req,res)=>{
    try {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
        const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear
        
        const current = await GetMonthlySummary(currentYear, currentMonth)
        const previous = await GetMonthlySummary(lastYear, lastMonth)
        
        res.json({
            current,
            previous,
            currentMonth: { month: currentMonth, year: currentYear },
            previousMonth: { month: lastMonth, year: lastYear }
        })
    } catch (error) {
        console.error('Error fetching monthly summary:', error)
        res.status(500).json({ error: 'Failed to fetch summary', details: error.message })
    }
})

app.post("/api/add-transaction", async (req,res)=>{
    try {
        const { amount, category, description, date, type } = req.body
        
        if (!amount || !category || !description || !date || !type) {
            return res.status(400).json({ error: 'All fields are required' })
        }

        let result
        if (type === 'income') {
            result = await InsertIncome(amount, category, description, date)
        } else if (type === 'expense') {
            result = await InsertExpense(amount, category, description, date)
        } else {
            return res.status(400).json({ error: 'Invalid transaction type' })
        }

        res.json({ success: true, message: 'Transaction added successfully', data: result })
    } catch (error) {
        console.error('Error inserting data:', error)
        res.status(500).json({ error: 'Failed to add transaction', details: error.message })
    }
})

app.put("/api/update-transaction", async (req,res)=>{
    try {
        const { id, amount, category, description, date, type } = req.body
        
        if (!id || !amount || !category || !description || !date || !type) {
            return res.status(400).json({ error: 'All fields are required' })
        }

        let result
        if (type === 'income') {
            result = await UpdateIncome(id, amount, category, description, date)
        } else if (type === 'expense') {
            result = await UpdateExpense(id, amount, category, description, date)
        } else {
            return res.status(400).json({ error: 'Invalid transaction type' })
        }

        res.json({ success: true, message: 'Transaction updated successfully', data: result })
    } catch (error) {
        console.error('Error updating transaction:', error)
        res.status(500).json({ error: 'Failed to update transaction', details: error.message })
    }
})

app.delete("/api/delete-transaction", async (req,res)=>{
    try {
        const { id, type } = req.body
        
        if (!id || !type) {
            return res.status(400).json({ error: 'ID and type are required' })
        }

        await DeleteTransaction(id, type)

        res.json({ success: true, message: 'Transaction deleted successfully' })
    } catch (error) {
        console.error('Error deleting transaction:', error)
        res.status(500).json({ error: 'Failed to delete transaction', details: error.message })
    }
})

app.listen(8080,()=>{
    console.log("Server running on http://localhost:8080")
})