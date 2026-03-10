require('dotenv').config()
const express=require('express');
const connectDB=require('./src/config/db')
const cookieParser=require('cookie-parser')
const app=express()
connectDB()


app.use(express.json())
app.use(cookieParser())

const userRouter=require('./src/routers/user.router')
const foodRouter=require('./src/routers/item.router')
const mealRouter=require('./src/routers/meal.router')

app.use('/api/v1/users',userRouter)
app.use('/api/v1/foods',foodRouter)
app.use('/api/v1/meals',mealRouter)

app.listen(3000,()=>{
   console.log("server is running")
})













