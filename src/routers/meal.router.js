const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const { getToday, getByDate, getHistory } = require("../controllers/record.controller");
const { addMeal, editMeal, deleteMeal, updateWater } = require("../controllers/meal.controller");


router.get("/today",    authMiddleware, getToday);
router.get("/history",  authMiddleware, getHistory);
router.get("/:date",    authMiddleware, getByDate);      


router.post("/today/meals", authMiddleware, addMeal);
router.patch("/today/meals/:mealId", authMiddleware, editMeal);
router.delete("/today/meals/:mealId", authMiddleware, deleteMeal);
router.patch("/today/water", authMiddleware, updateWater);

module.exports = router;