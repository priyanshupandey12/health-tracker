const express    = require("express");
const router     = express.Router();
const { searchFoods, getFoodById, getFoodPortions } = require("../controllers/item.controller");
const authMiddleware = require("../middleware/auth.middleware");


router.get("/search",        authMiddleware, searchFoods);
router.get("/:id",           authMiddleware, getFoodById);
router.get("/:id/portions",  authMiddleware, getFoodPortions);

module.exports = router;