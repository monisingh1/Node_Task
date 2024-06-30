const express = require("express")
require("dotenv").config();
const cors = require("cors")
 var db = require('./config/dbConnection.js')
const userRouter = require('./routes/customerRoute.js')


const app = express()
const port = process.env.POR || 5000;


app.use (express.json())
app.use(express.urlencoded({ extended:true }))

app.use(cors())

app.use('/api',userRouter)

//error handling

app.listen(port, ()=> 
  console.log(`Server is running on port ${port}`));