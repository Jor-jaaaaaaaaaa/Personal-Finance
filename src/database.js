import mysql from 'mysql2';
import dotenv from 'dotenv'
dotenv.config()

const connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.PASSWORD,
    database: process.env.DATABASE}
).promise()

const result = await connection.query("SELECT * FROM finfo")
console.log(result)


