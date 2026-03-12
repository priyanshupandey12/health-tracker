const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {getToday,getByDate,getHistory}=require('../controllers/record.controller')


router.get("/today", authMiddleware, getToday);
router.get("/history", authMiddleware, getHistory);
router.get("/:date",   authMiddleware, getByDate); 
module.exports=router