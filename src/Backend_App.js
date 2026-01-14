import express from 'express'
import cors from 'cors'
import { InsertData } from './database.js'

const app = express()
const corsOptions = {
    origin: ["http://localhost:5173"]
}

app.use(cors(corsOptions))
app.use(express.json())

app.get("/",(req,res)=>{
    res.send(console.log("Is it working"))
})

app.post("/api/add-transaction", async (req,res)=>{
    try {
        const { amount, category, description, date } = req.body
        
        if (!amount || !category || !description || !date) {
            return res.status(400).json({ error: 'All fields are required' })
        }

        const result = await InsertData(amount, category, description, date)
        res.json({ success: true, message: 'Transaction added successfully', data: result })
    } catch (error) {
        console.error('Error inserting data:', error)
        res.status(500).json({ error: 'Failed to add transaction', details: error.message })
    }
})

app.listen(8080,()=>{
    console.log("Server running on http://localhost:8080")
})