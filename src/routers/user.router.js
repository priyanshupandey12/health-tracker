const express=require('express')
const router=express.Router()

const authMiddleware=require('../middleware/auth.middleware')
const {login,signup,updateProfile,getCurrentUser,logoutUser}=require('../controllers/user.controller')


router.post('/signup',signup)
router.post('/login',login)
router.post('/logout',logoutUser)
router.get('/profile',authMiddleware,getCurrentUser)
router.patch('/profile',authMiddleware,updateProfile)


module.exports=router