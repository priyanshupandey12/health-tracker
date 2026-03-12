const Record    = require("../models/record.model");
const MealEntry = require("../models/mealEntry.model");
const { getRDA } = require("../utils/rda");


const r = (val) => Math.round((val || 0) * 100) / 100;



const getISTDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const obj = {};
  parts.forEach(p => obj[p.type] = p.value);

  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day)
  };
};

const startOfDay = (date = new Date()) => {
  const { year, month, day } = getISTDateParts(date);

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    -5,
    -30,
    0,
    0
  ));
};

const endOfDay = (date = new Date()) => {
 const { year, month, day } = getISTDateParts(date);

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    18,
    29,
    59,
    999
  ));
};


const formatDateIST = (date) => {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

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
        date:          formatDateIST(record.date), 
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
    const user     = req.user;
    const dateParam = req.params.date;


    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }


    const [year, month, day] = dateParam.split("-").map(Number);
 

    const date = new Date(year, month - 1, day);


    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Please check the date values.",
      });
    }


    const today = new Date();
    if (date > today) {
      return res.status(400).json({
        success: false,
        message: "Future date ka record nahi ho sakta.",
      });
    }


    const record = await Record.findOne({
      user: user._id,
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    });


    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${dateParam} ka koi record nahi mila. Us din kuch log nahi kiya tha.`,
      });
    }


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

    const rda = getRDA(user.gender, user.age);


    res.status(200).json({
      success: true,
      record: {
        _id:           record._id,
        date:          formatDateIST(record.date),


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
    const { days } = req.query;


    if (days !== undefined) {
      const daysNum = Number(days);

      if (isNaN(daysNum) || !Number.isInteger(daysNum) || daysNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "days must be a positive integer. e.g. ?days=7",
        });
      }


      if (daysNum > 7) {
        return res.status(400).json({
          success: false,
          message: "Maximum 7 days ka history fetch ho sakta hai.",
        });
      }

    }

    const requestedDays = days ? Number(days) : 7;


    const from = new Date();
    from.setDate(from.getDate() - requestedDays);


    const records = await Record.find({
      user: user._id,
      date: { $gte: startOfDay(from) },
    })
      .sort({ date: 1 })
      .select("date dietScore totals waterIntake waterTarget");


    const formatted = records.map((rec) => ({
      date:        formatDateIST(rec.date),


      dietScore:   rec.dietScore,

      calories:    rec.totals?.calories   || 0,
      protein:     rec.totals?.protein    || 0,
      carbs:       rec.totals?.carbs      || 0,
      fats:        rec.totals?.fats       || 0,
      fiber:       rec.totals?.fiber      || 0,
      iron:        rec.totals?.iron       || 0,


      waterIntake: rec.waterIntake || 0,
      waterTarget: rec.waterTarget || 8,
    }));



    const filledData = [];
    for (let i = requestedDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateIST(d);


      const existing = formatted.find((r) => r.date === dateStr);


      if (existing) {
        filledData.push(existing);
      } else {
        filledData.push({
          date:        dateStr,
          dietScore:   0,
          calories:    0,
          protein:     0,
          carbs:       0,
          fats:        0,
          fiber:       0,
          iron:        0,
          waterIntake: 0,
          waterTarget: user.dailyWaterTarget || 8,
          noData:      true,
    
        });
      }
    }


    res.status(200).json({
      success:       true,
      days:          requestedDays,
      totalRecords:  records.length,
      data:          filledData,
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