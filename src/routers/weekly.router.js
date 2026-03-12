const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const { generateReport, getWeeklyReport } = require("../controllers/weeklyReport.controller");

router.get("/", authMiddleware, getWeeklyReport);
router.post("/generate", authMiddleware, generateReport);




module.exports = router;