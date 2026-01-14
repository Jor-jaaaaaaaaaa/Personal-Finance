import express from 'express'
import cors from 'cors'
import { InsertExpense } from './database.js'
import { InsertIncome } from './database.js'

const app = express()
const corsOptions = {
    origin: ["http://localhost:5173"]
}

app.use(cors(corsOptions))
app.use(express.json())



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

app.listen(8080,()=>{
    console.log("Server running on http://localhost:8080")
})