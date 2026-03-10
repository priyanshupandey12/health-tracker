const jwt = require("jsonwebtoken")
const User = require("../models/user.model")

const authMiddleware = async (req, res, next) => {

 try {

  const token =
   req.cookies.token ||
   req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
   return res.status(401).json({
    success: false,
    message: "Unauthorized access"
   })
  }


  const decoded = jwt.verify(token, process.env.JWT_SECRET)



  const user = await User.findById(decoded.id)

  if (!user) {
   return res.status(401).json({
    success: false,
    message: "User not found"
   })
  }


  req.user = user

  next()

 } catch (error) {

  if (error.name === "JsonWebTokenError") {
   return res.status(401).json({
    success: false,
    message: "Invalid token"
   })
  }

  if (error.name === "TokenExpiredError") {
   return res.status(401).json({
    success: false,
    message: "Token expired"
   })
  }

  res.status(500).json({
   success: false,
   message: "Internal server error"
  })
 }
}

module.exports =  authMiddleware 