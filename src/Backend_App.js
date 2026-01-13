import express from 'express'

const app = express()

app.get("fif",(req,res)=>{
    res.send("something")
})

app.listen(5173,()=>{
    console.log("hello")
})