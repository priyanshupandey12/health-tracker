const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const { addMeal, editMeal, deleteMeal, updateWater } = require("../controllers/meal.controller");


   
router.post("/today/", authMiddleware, addMeal);
router.patch("/today/water", authMiddleware, updateWater);
router.patch("/today/:mealId", authMiddleware, editMeal);
router.delete("/today/:mealId", authMiddleware, deleteMeal);


module.exports = router;