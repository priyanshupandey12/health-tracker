const Record    = require("../models/record.model");
const MealEntry = require("../models/mealEntry.model");
const Item      = require("../models/Item.model");
const { getRDA } = require("../utils/rda");
const {
  reaggregateTotals,
  calculateDietScore,
  calculateRDACompletion,
} = require("./record.controller");


const PORTION_ML = {
  katori:     { small: 120, medium: 150, large: 200 },
  bowl:       { small: 200, medium: 300, large: 400 },
  glass:      { small: 150, medium: 250, large: 350 },
  plate:      { small: 150, medium: 250, large: 350 },
  tablespoon: { standard: 15 },
  teaspoon:   { standard: 5  },
  mutthi:     { standard: 35 },
  piece:      { standard: null },
  grams:      { standard: 1  },
};


const VALID_PORTION_UNITS = Object.keys(PORTION_ML);


const VALID_PORTION_SIZES = ["small", "medium", "large", "standard"];


const VALID_MEAL_TYPES = ["pre_breakfast", "breakfast", "lunch", "dinner", "snack"];



const getDensity = (category = "") => {
  const c = category.toLowerCase();


  if (c.includes("legume"))                            return 1.05;
  if (c.includes("cereal") || c.includes("millet"))   return 0.90;
  if (c.includes("vegetable") || c.includes("leafy")) return 0.85;
  if (c.includes("roots") || c.includes("tuber"))     return 0.95;
  if (c.includes("milk") || c.includes("dairy"))      return 1.03;
  if (c.includes("meat") || c.includes("poultry"))    return 0.95;
  if (c.includes("fish"))                             return 1.02;
  if (c.includes("egg"))                              return 1.0;
  if (c.includes("fat") || c.includes("oil"))         return 0.92;
  if (c.includes("fruit"))                            return 0.85;
  if (c.includes("nut") || c.includes("seed"))        return 0.65;
  return 0.90;
};


const PIECE_WEIGHTS = {
  roti: 35, chapati: 35, wheat: 35, flour: 35,
  bread: 25, egg: 50, idli: 40, dosa: 80,
};



const calculateGrams = (portionUnit, portionSize = "medium", quantity = 1, item) => {
  
  if (portionUnit === "grams") return quantity;


  if (portionUnit === "piece") {
    const nameLower = item.name.toLowerCase();


    const match = Object.keys(PIECE_WEIGHTS).find((k) => nameLower.includes(k));


    const gramsPerPiece = match ? PIECE_WEIGHTS[match] : 50;


    return gramsPerPiece * quantity;

  }

  const sizes = PORTION_ML[portionUnit];


  if (!sizes) return 100 * quantity;


  const ml = sizes[portionSize] || sizes["standard"] || sizes["medium"];


  const density = getDensity(item.category);


  return Math.round(ml * density * quantity);

};


const calculateNutrition = (item, grams) => {
  const m = grams / 100;


  const n = (val) => Math.round((val || 0) * m * 100) / 100;


  return {
    calories:   n(item.calories),
    protein:    n(item.protein),
    carbs:      n(item.carbs),
    fats:       n(item.fats),
    fiber:      n(item.fiber),
    vitaminA:   n(item.vitaminA),
    vitaminC:   n(item.vitaminC),
    vitaminD:   n(item.vitaminD),
    vitaminB12: n(item.vitaminB12),
    folate:     n(item.folate),
    iron:       n(item.iron),
    calcium:    n(item.calcium),
    zinc:       n(item.zinc),
    sodium:     n(item.sodium),
    potassium:  n(item.potassium),
  };

};


const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0);      return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };



const findOrCreateRecord = async (userId, waterTarget) => {
  const today = new Date();

  let record = await Record.findOne({
    user: userId,
    date: { $gte: startOfDay(today), $lte: endOfDay(today) },
  });


  if (!record) {
    record = await Record.create({
      user:        userId,
      date:        startOfDay(today),
      waterTarget: waterTarget,
    });
  }

  return record;

};
/*

POST /api/records/today/meals
        ↓
authMiddleware → req.user set kiya
        ↓
Validation (mealType, itemId, portionUnit)
        ↓
Item DB se fetch kiya
        ↓
findOrCreateRecord()
→ Aaj ka record hai? Nahi → banao
→ Hai? → wahi lo
        ↓
calculateGrams("katori", "medium", 2, dalItem)
→ 150ml × 1.05 × 2 = 315g
        ↓
calculateNutrition(dalItem, 315g)
→ calories = 343 × 3.15 = 1080
        ↓
MealEntry.create() → DB mein save
        ↓
reaggregateTotals() → saari entries ka sum
        ↓
calculateDietScore() + calculateRDACompletion()
        ↓
Record.update() → fresh totals save
        ↓
Response → entry + recordSummary

*/

const addMeal = async (req, res) => {
  try {
    const user = req.user;


    const { mealType, itemId, portionUnit, portionSize, quantity, note } = req.body;




    if (!mealType || !itemId || !portionUnit) {
      return res.status(400).json({
        success: false,
        message: "mealType, itemId, and portionUnit are required.",
      });
    }

    if (!VALID_MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid mealType. Must be one of: ${VALID_MEAL_TYPES.join(", ")}`,
      });
    }


    if (!VALID_PORTION_UNITS.includes(portionUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid portionUnit. Must be one of: ${VALID_PORTION_UNITS.join(", ")}`,
      });
    }
 

    if (portionSize && !VALID_PORTION_SIZES.includes(portionSize)) {
      return res.status(400).json({
        success: false,
        message: `Invalid portionSize. Must be one of: ${VALID_PORTION_SIZES.join(", ")}`,
      });
    }



    const item = await Item.findById(itemId);


    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item not found. Please search and select from database.",
      });
    }



    const record = await findOrCreateRecord(user._id, user.dailyWaterTarget);



    const qty = parseFloat(quantity) || 1;


    const calculatedGrams = calculateGrams(portionUnit, portionSize || "medium", qty, item);



    const nutrition = calculateNutrition(item, calculatedGrams);



    const entry = await MealEntry.create({
      record:      record._id,


      mealType,


      item:        item._id,


      foodName:    item.name,


      portionUnit,
      portionSize: portionSize || "medium",
      quantity:    qty,


      calculatedGrams,


      nutrition,


      note: note || "",

    });


    const totals = await reaggregateTotals(record._id);


    const rda = getRDA(user.gender, user.age);


    const rdaCompletion = calculateRDACompletion(totals, rda);


    const dietScore = calculateDietScore(totals, rda);

    await Record.findByIdAndUpdate(record._id, {
      totals,
      rdaCompletion,
      dietScore,
    });
    


    res.status(201).json({

      success: true,
      message: "Meal logged successfully!",
      entry: {
        _id:             entry._id,
        mealType:        entry.mealType,
        foodName:        entry.foodName,
        portionUnit:     entry.portionUnit,
        portionSize:     entry.portionSize,
        quantity:        entry.quantity,
        calculatedGrams: entry.calculatedGrams,
        nutrition:       entry.nutrition,
        note:            entry.note,
      },
  

      recordSummary: {
        recordId:      record._id,
        dietScore,
        totals,
        rdaCompletion,
      },

    });

  } catch (error) {
    console.error("Add meal error:", error);

    res.status(500).json({ success: false, message: "Failed to log meal." });

  }
};

const editMeal = async (req, res) => {
  try {

    const { mealId } = req.params;


    const { portionUnit, portionSize, quantity, note } = req.body;


    if (!portionUnit && !portionSize && quantity === undefined && note === undefined) {
      return res.status(400).json({
        success: false,
        message: "Kuch toh bhejo update karne ke liye.",
      });
    }


    if (portionUnit && !VALID_PORTION_UNITS.includes(portionUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid portionUnit. Must be one of: ${VALID_PORTION_UNITS.join(", ")}`,
      });
    }


    if (portionSize && !VALID_PORTION_SIZES.includes(portionSize)) {
      return res.status(400).json({
        success: false,
        message: `Invalid portionSize. Must be one of: ${VALID_PORTION_SIZES.join(", ")}`,
      });
    }


    if (quantity !== undefined && (isNaN(quantity) || quantity < 0.25)) {
      return res.status(400).json({
        success: false,
        message: "Quantity at least 0.25 honi chahiye.",
      });
    }


    const entry = await MealEntry.findById(mealId).populate("record");


    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Meal entry not found.",
      });
    }


    if (entry.record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Yeh entry aapki nahi hai.",
      });
    }


    const item = await Item.findById(entry.item);


    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item no longer exists in database.",
      });
    }


    const newPortionUnit = portionUnit || entry.portionUnit;


    const newPortionSize = portionSize || entry.portionSize;


    const newQuantity = quantity !== undefined ? parseFloat(quantity) : entry.quantity;


    const newNote = note !== undefined ? note : entry.note;


    const newGrams = calculateGrams(newPortionUnit, newPortionSize, newQuantity, item);


    const newNutrition = calculateNutrition(item, newGrams);


    entry.portionUnit     = newPortionUnit;
    entry.portionSize     = newPortionSize;
    entry.quantity        = newQuantity;
    entry.calculatedGrams = newGrams;
    entry.nutrition       = newNutrition;
    entry.note            = newNote;
    await entry.save();


    const recordId = entry.record._id;


    const totals        = await reaggregateTotals(recordId);
    const rda           = getRDA(req.user.gender, req.user.age);
    const rdaCompletion = calculateRDACompletion(totals, rda);
    const dietScore     = calculateDietScore(totals, rda);


    await Record.findByIdAndUpdate(recordId, { totals, rdaCompletion, dietScore });


    res.status(200).json({
 
      success: true,
      message: "Meal updated successfully!",
      entry: {
        _id:             entry._id,
        mealType:        entry.mealType,
        foodName:        entry.foodName,
        portionUnit:     entry.portionUnit,
        portionSize:     entry.portionSize,
        quantity:        entry.quantity,
        calculatedGrams: entry.calculatedGrams,
        nutrition:       entry.nutrition,
        note:            entry.note,
      },


      recordSummary: {
        recordId: recordId,
        dietScore,
        totals,
        rdaCompletion,
      },
  
    });

  } catch (error) {
    console.error("Edit meal error:", error);
    res.status(500).json({ success: false, message: "Failed to update meal." });
  }
};


const deleteMeal = async (req, res) => {
  try {
    const { mealId } = req.params;


    const entry = await MealEntry.findById(mealId);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Meal entry not found." });
    }

    const recordId = entry.record; 

    await entry.deleteOne();


    const totals        = await reaggregateTotals(recordId);
    const rda           = getRDA(req.user.gender, req.user.age);
    const rdaCompletion = calculateRDACompletion(totals, rda);
    const dietScore     = calculateDietScore(totals, rda);

    await Record.findByIdAndUpdate(recordId, { totals, rdaCompletion, dietScore });

    res.status(200).json({
      success: true,
      message: "Meal deleted successfully!",
      recordSummary: { dietScore, totals, rdaCompletion },
    });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ success: false, message: "Failed to delete meal." });
  }
};


const updateWater = async (req, res) => {
  try {
    const { waterIntake } = req.body;

    if (waterIntake === undefined || waterIntake < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid waterIntake (glasses) is required.",
      });
    }


    const record = await findOrCreateRecord(
      req.user._id,
      req.user.dailyWaterTarget
    );

    const updated = await Record.findByIdAndUpdate(
      record._id,
      { waterIntake: Math.min(waterIntake, 20) },
      { new: true }
    );

    res.status(200).json({
      success:     true,
      message:     "Water intake updated!",
      waterIntake: updated.waterIntake,
      waterTarget: updated.waterTarget,
      percentage:  Math.round((updated.waterIntake / updated.waterTarget) * 100),
    });
  } catch (error) {
    console.error("Update water error:", error);
    res.status(500).json({ success: false, message: "Failed to update water intake." });
  }
};

module.exports = { addMeal, editMeal, deleteMeal, updateWater };