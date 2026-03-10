const Record    = require("../models/record.model");
const MealEntry = require("../models/mealEntry.model");
const { getRDA } = require("../utils/rda");


const r = (val) => Math.round((val || 0) * 100) / 100;


const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};


const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};


const calculateDietScore = (totals, rda) => {
  const nutrients = [
    "calories", "protein", "fiber",
    "iron", "calcium", "vitaminC", "vitaminD",
  ];

  const percentages = nutrients.map((key) => {
    if (!rda[key] || rda[key] === 0) return 0;
    return Math.min(100, (totals[key] / rda[key]) * 100);
  });

  const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  return Math.round(avg);
};


const calculateRDACompletion = (totals, rda) => {
  const keys = [
    "calories", "protein", "carbs", "fats", "fiber",
    "iron", "calcium", "vitaminC", "vitaminD",
  ];

  const result = {};
  keys.forEach((key) => {
    result[key] = rda[key]
      ? Math.min(100, Math.round((totals[key] / rda[key]) * 100))
      : 0;
  });
  return result;
};


const reaggregateTotals = async (recordId) => {
  const entries = await MealEntry.find({ record: recordId });

  const totals = {
    calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0,
    vitaminA: 0, vitaminC: 0, vitaminD: 0,
    vitaminB1: 0, vitaminB2: 0, vitaminB3: 0,
    vitaminB6: 0, vitaminB12: 0, folate: 0,
    iron: 0, calcium: 0, zinc: 0,
    magnesium: 0, potassium: 0, sodium: 0, phosphorus: 0,
    saturatedFat: 0, transFat: 0,
  };

  entries.forEach((entry) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += entry.nutrition[key] || 0;
    });
  });

  Object.keys(totals).forEach((key) => {
    totals[key] = r(totals[key]);
  });

  return totals;
};


const formatEntry = (entry) => ({
  _id:             entry._id,
  mealType:        entry.mealType,
  foodName:        entry.foodName,
  portionUnit:     entry.portionUnit,
  portionSize:     entry.portionSize,
  quantity:        entry.quantity,
  calculatedGrams: entry.calculatedGrams,
  nutrition:       entry.nutrition,
  note:            entry.note,
  item:            entry.item,
});


const getToday = async (req, res) => {
  try {
    const user  = req.user;
    const today = new Date();


    let existingRecord = await Record.findOne({
      user: user._id,
      date: { $gte: startOfDay(today), $lte: endOfDay(today) },
    });

    const isNewRecord = !existingRecord;


    let record = existingRecord;
    if (!record) {
      record = await Record.create({
        user:        user._id,
        date:        startOfDay(today),
        waterTarget: user.dailyWaterTarget,
      });
    }


    const totals        = await reaggregateTotals(record._id);
    const rda           = getRDA(user.gender, user.age);
    const rdaCompletion = calculateRDACompletion(totals, rda);
    const dietScore     = calculateDietScore(totals, rda);


    await Record.findByIdAndUpdate(record._id, { totals, rdaCompletion, dietScore });


    const entries = await MealEntry.find({ record: record._id })
      .populate("item", "name category")
      .sort({ createdAt: 1 });

    const meals = {
      pre_breakfast: [],
      breakfast:     [],
      lunch:         [],
      dinner:        [],
      snack:         [],
    };
    entries.forEach((e) => meals[e.mealType]?.push(formatEntry(e)));

    res.status(200).json({
      success: true,
      record: {
        _id:           record._id,
        date:          record.date,
        isNewRecord,                 
        waterIntake:   record.waterIntake,
        waterTarget:   record.waterTarget,
        dietScore,
        totals,
        rdaCompletion,
        rda,
        meals,
      },
    });
  } catch (error) {
    console.error("Get today error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch today's record." });
  }
};


const getByDate = async (req, res) => {
  try {
    const user = req.user;


    const parts = req.params.date.split("-");
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day); 

    if (isNaN(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD.",
      });
    }

    const record = await Record.findOne({
      user: user._id,
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No record found for this date.",
      });
    }

    const entries = await MealEntry.find({ record: record._id })
      .populate("item", "name category")
      .sort({ createdAt: 1 });

    const meals = {
      pre_breakfast: [], breakfast: [],
      lunch: [], dinner: [], snack: [],
    };
    entries.forEach((e) => meals[e.mealType]?.push(formatEntry(e)));

    const rda = getRDA(user.gender, user.age);

    res.status(200).json({
      success: true,
      record: {
        _id:           record._id,
        date:          record.date,
        waterIntake:   record.waterIntake,
        waterTarget:   record.waterTarget,
        dietScore:     record.dietScore,
        totals:        record.totals,
        rdaCompletion: record.rdaCompletion,
        rda,
        meals,
      },
    });
  } catch (error) {
    console.error("Get by date error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch record." });
  }
};

const getHistory = async (req, res) => {
  try {
    const user = req.user;
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const from = new Date();
    from.setDate(from.getDate() - days);


    const records = await Record.find({
      user: user._id,
      date: { $gte: startOfDay(from) },
    })
      .sort({ date: -1 })
      .select("date dietScore totals waterIntake");

    res.status(200).json({
      success: true,
      count:   records.length,
      records,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history." });
  }
};

module.exports = {
  getToday,
  getByDate,
  getHistory,
  reaggregateTotals,
  calculateDietScore,
  calculateRDACompletion,
};