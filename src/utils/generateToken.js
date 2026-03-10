const jwt = require("jsonwebtoken")

const generateToken = (res, user, message, statusCode = 200) => {

 const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
 )

 const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
 }

 return res
  .status(statusCode)
  .cookie("token", token, cookieOptions)
  .json({
   success: true,
   message,
   user: {
    id: user._id,
    name: user.name,
    email: user.email
   }
  })
}

module.exports = generateToken


