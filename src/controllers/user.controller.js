const {  calculateBMI, calculateBMR,calculateTDEE,calculateWaterTarget}=require('../utils/calculateTarget');
const User=require('../models/user.model')
const generateToken=require('../utils/generateToken')


const signup = async (req, res) => {

 try {

  const {
   name,
   email,
   password,
   age,
   gender,
   height,
   weight,
   activityLevel,
   goal
  } = req.body




  if (
   !name ||
   !email ||
   !password ||
   !age ||
   !gender ||
   !height ||
   !weight
  ) {
   return res.status(400).json({
    success: false,
    message: "Please provide all required fields"
   })
  }



  const existingUser = await User.findOne({ email })

  if (existingUser) {
   return res.status(409).json({
    success: false,
    message: "Email already registered"
   })
  }




  const bmi = calculateBMI(weight, height)

  const bmr = calculateBMR(weight, height, age, gender)
  const water=calculateWaterTarget(weight)

  let dailyCalories = calculateTDEE(
   bmr,
   activityLevel || "moderate"
  )


 

  if (goal === "lose_weight") {
   dailyCalories -= 400
  }

  if (goal === "gain_weight" || goal === "build_muscle") {
   dailyCalories += 400
  }


  const user = await User.create({
   name,
   email,
   password,
   age,
   gender,
   height,
   weight,
   bmi,
   activityLevel,
   goal,
   dailyCalorieTarget: dailyCalories,
   dailyWaterTarget: water
  })




  generateToken(res, user, "User created successfully", 201)


 } catch (error) {

  console.error("Signup Error:", error)

  res.status(500).json({
   success: false,
   message: "Server error during signup"
  })

 }
}


const login = async (req,res)=>{

 try{

  const { email, password } = req.body


  if(!email || !password){
   return res.status(400).json({
    success:false,
    message:"Email and password required"
   })
  }


  const user = await User.findOne({ email }).select("+password")

  if(!user){
   return res.status(401).json({
    success:false,
    message:"Invalid credentials"
   })
  }


  const isMatch = await user.comparePassword(password)

  if(!isMatch){
   return res.status(401).json({
    success:false,
    message:"Invalid credentials"
   })
  }


  generateToken(res,user,"Login successful",200)

 }catch(error){

  console.error("Login error:",error)

  res.status(500).json({
   success:false,
   message:"Server error during login"
  })

 }

}


const logoutUser = (req, res) => {
    res.clearCookie("token", {
 httpOnly: true,
  secure: true,
  sameSite: "none",

    });
    res.status(200).json({ success: true, message: "User logged out successfully" });
}


const getCurrentUser = async (req, res) => {

 try {


  res.status(200).json({
   success: true,
   user:req.user
  })

 } catch (error) {

  res.status(500).json({
   success: false,
   message: "Failed to fetch user"
  })

 }

}


const updateProfile = async (req, res) => {

 try {

  const allowedUpdates = [
   "name",
   "age",
   "height",
   "weight",
   "activityLevel",
   "goal"
  ]

  const updates = {}

  for (const key of allowedUpdates) {
   if (req.body[key] !== undefined) {
    updates[key] = req.body[key]
   }
  }

  const user = await User.findById(req.user._id)

  if (!user) {
   return res.status(404).json({
    success: false,
    message: "User not found"
   })
  }


  Object.assign(user, updates)


  const bmi = calculateBMI(user.weight, user.height)
 const water=calculateWaterTarget(user.weight)
  const bmr = calculateBMR(
   user.weight,
   user.height,
   user.age,
   user.gender
  )

  let dailyCalories = calculateTDEE(
   bmr,
   user.activityLevel || "moderate"
  )


  if (user.goal === "lose_weight") {
   dailyCalories -= 400
  }

  if (
   user.goal === "gain_weight" ||
   user.goal === "build_muscle"
  ) {
   dailyCalories += 400
  }


  user.dailyCalorieTarget = dailyCalories
  user.bmi=bmi
  user.dailyWaterTarget=water


  await user.save()


  res.status(200).json({
   success: true,
   message: "Profile updated successfully",
   user: {
    id: user._id,
    name: user.name,
    email: user.email,
    height: user.height,
    weight: user.weight,
    dailyCalorieTarget: user.dailyCalorieTarget
   }
  })

 } catch (error) {

  console.error(error)

  res.status(500).json({
   success: false,
   message: "Profile update failed"
  })

 }

}


module.exports={
    signup,
    login,
    logoutUser,
    getCurrentUser,
    updateProfile
}