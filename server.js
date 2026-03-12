require('dotenv').config()
const express=require('express');
const connectDB=require('./src/config/db')
const cookieParser=require('cookie-parser')
const cors=require('cors')
const app=express()
connectDB()


app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

const userRouter=require('./src/routers/user.router')
const foodRouter=require('./src/routers/item.router')
const mealRouter=require('./src/routers/meal.router')
const recordRouter=require('./src/routers/record.router')
const weeklyRouter=require('./src/routers/weekly.router')
app.use('/api/v1/users',userRouter)
app.use('/api/v1/foods',foodRouter)
app.use('/api/v1/meals',mealRouter)
app.use('/api/v1/record',recordRouter)
app.use('/api/v1/weekly',weeklyRouter)

app.listen(3000,()=>{
   console.log("server is running")
})













