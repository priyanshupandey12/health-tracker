// controllers/foodController.js
const Item = require("../models/Item.model");
const { resolveAlias } = require("../constant/searchAlias");

// ── Helper: round to 2 decimal places ────────────────────────
const r = (val) => Math.round((val || 0) * 100) / 100;

// ── Helper: format full nutrition (for single item response) ─
const formatNutrition = (item) => ({
  _id:       item._id,
  name:      item.name,
  localName: item.localName,
  category:  item.category,
  source:    item.source,
  tags:      item.tags,

  // Macros
  calories: r(item.calories),
  protein:  r(item.protein),
  carbs:    r(item.carbs),
  fats:     r(item.fats),
  fiber:    r(item.fiber),

  // Vitamins
  vitaminA:   r(item.vitaminA),
  vitaminC:   r(item.vitaminC),
  vitaminD:   r(item.vitaminD),
  vitaminB1:  r(item.vitaminB1),
  vitaminB2:  r(item.vitaminB2),
  vitaminB3:  r(item.vitaminB3),
  vitaminB6:  r(item.vitaminB6),
  vitaminB12: r(item.vitaminB12),
  folate:     r(item.folate),

  // Minerals
  iron:       r(item.iron),
  calcium:    r(item.calcium),
  zinc:       r(item.zinc),
  magnesium:  r(item.magnesium),
  potassium:  r(item.potassium),
  sodium:     r(item.sodium),
  phosphorus: r(item.phosphorus),

  // Fats detail
  saturatedFat: r(item.saturatedFat),
  transFat:     r(item.transFat),

  yieldFactor: item.yieldFactor || 1,
});

// ── Helper: format card (lightweight — for search results) ───
const formatCard = (item) => ({
  _id:       item._id,
  name:      item.name,
  localName: item.localName,
  category:  item.category,
  source:    item.source,
  calories:  r(item.calories),
  protein:   r(item.protein),
  carbs:     r(item.carbs),
  fats:      r(item.fats),
  fiber:     r(item.fiber),
});

// ─────────────────────────────────────────────────────────────
// GET /api/foods/search?q=masoor&limit=10
// ─────────────────────────────────────────────────────────────
const searchFoods = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 20); // max 20

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    // Alias resolve karo — "chapati" → "wheat flour", "doodh" → "milk"
    const resolvedQuery = resolveAlias(query);
    const aliasUsed     = resolvedQuery !== query;

    // Hybrid search — regex across name, localName, tags, category
    const results = await Item.find({
      $or: [
        { name:      { $regex: resolvedQuery, $options: "i" } },
        { localName: { $regex: resolvedQuery, $options: "i" } },
        { tags:      { $regex: resolvedQuery, $options: "i" } },
        { category:  { $regex: resolvedQuery, $options: "i" } },
      ],
    })
      .limit(limit)
      .select("name localName category source calories protein carbs fats fiber");

    res.status(200).json({
      success:       true,
      count:         results.length,
      query,
      resolvedQuery: aliasUsed ? resolvedQuery : undefined,
      results:       results.map(formatCard),
    });
  } catch (error) {
    console.error("Food search error:", error);
    res.status(500).json({ success: false, message: "Food search failed." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/foods/:id
// ─────────────────────────────────────────────────────────────
const getFoodById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    res.status(200).json({
      success: true,
      food: formatNutrition(item),
    });
  } catch (error) {
    console.error("Get food error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch food." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/foods/:id/portions
// Returns katori/bowl/glass → grams + nutrition for each portion
// ─────────────────────────────────────────────────────────────

// Standard portion sizes in ml (volume-based)
const PORTION_SIZES = {
  katori: { small: 120, medium: 150, large: 200 },
  bowl:   { small: 200, medium: 300, large: 400 },
  glass:  { small: 150, medium: 250, large: 350 },
  plate:  { small: 150, medium: 250, large: 350 },
};

// Density map — category ke basis pe (g/ml)
const getCategoryDensity = (category = "") => {
  const cat = category.toLowerCase();
  if (cat.includes("pulse") || cat.includes("dal"))      return 1.05;
  if (cat.includes("cereal") || cat.includes("rice"))    return 0.90;
  if (cat.includes("vegetable"))                         return 0.85;
  if (cat.includes("milk") || cat.includes("dairy"))     return 1.03;
  if (cat.includes("meat") || cat.includes("fish"))      return 0.95;
  if (cat.includes("oil") || cat.includes("fat"))        return 0.92;
  return 0.90; // default
};

// Countable items — per piece weight (grams)
const COUNTABLE_ITEMS = {
  roti:    35,
  chapati: 35,
  bread:   25,
  egg:     50,
  idli:    40,
  dosa:    80,
};

const getFoodPortions = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    const density = getCategoryDensity(item.category);

    // Helper: calculate nutrition for given grams
    const nutritionForGrams = (grams) => {
      const m = grams / 100;
      return {
        calories: r(item.calories * m),
        protein:  r(item.protein  * m),
        carbs:    r(item.carbs    * m),
        fats:     r(item.fats     * m),
        fiber:    r(item.fiber    * m),
        iron:     r(item.iron     * m),
        calcium:  r(item.calcium  * m),
        vitaminC: r(item.vitaminC * m),
      };
    };

    const portions = [];

    // 1. Volume-based portions (katori, bowl, glass, plate)
    for (const [unit, sizes] of Object.entries(PORTION_SIZES)) {
      for (const [size, ml] of Object.entries(sizes)) {
        const grams = Math.round(ml * density);
        portions.push({
          unit,
          size,
          ml,
          grams,
          nutrition: nutritionForGrams(grams),
          label: `${size.charAt(0).toUpperCase() + size.slice(1)} ${unit} (~${grams}g)`,
        });
      }
    }

    // 2. Spoon-based portions
    portions.push(
      {
        unit: "tablespoon", size: "standard", ml: 15,
        grams: Math.round(15 * density),
        nutrition: nutritionForGrams(Math.round(15 * density)),
        label: `1 Tablespoon (~${Math.round(15 * density)}g)`,
      },
      {
        unit: "teaspoon", size: "standard", ml: 5,
        grams: Math.round(5 * density),
        nutrition: nutritionForGrams(Math.round(5 * density)),
        label: `1 Teaspoon (~${Math.round(5 * density)}g)`,
      }
    );

    // 3. Mutthi (handful)
    portions.push({
      unit: "mutthi", size: "standard", ml: null,
      grams: 35,
      nutrition: nutritionForGrams(35),
      label: "1 Mutthi / Handful (~35g)",
    });

    // 4. Countable — check if item matches (roti, egg etc.)
    const itemNameLower = item.name.toLowerCase();
    for (const [keyword, gramsPerPiece] of Object.entries(COUNTABLE_ITEMS)) {
      if (itemNameLower.includes(keyword)) {
        portions.push({
          unit: "piece", size: "standard", ml: null,
          grams: gramsPerPiece,
          nutrition: nutritionForGrams(gramsPerPiece),
          label: `1 Piece (~${gramsPerPiece}g)`,
        });
        break;
      }
    }

    // 5. Always include direct grams option
    portions.push({
      unit: "grams", size: "standard", ml: null,
      grams: 100,
      nutrition: nutritionForGrams(100),
      label: "100g (Standard)",
    });

    res.status(200).json({
      success: true,
      food: {
        _id:      item._id,
        name:     item.name,
        category: item.category,
      },
      density,
      portions,
    });
  } catch (error) {
    console.error("Get portions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch portions." });
  }
};

module.exports = { searchFoods, getFoodById, getFoodPortions };