const Item = require("../models/Item.model");
const r = (val) => Math.round((val || 0) * 100) / 100;


const formatNutrition = (item) => ({
  _id:       item._id,
  name:      item.name,
  localName: item.localName,
  category:  item.category,
  source:    item.source,
  tags:      item.tags,


  calories: r(item.calories),
  protein:  r(item.protein),
  carbs:    r(item.carbs),
  fats:     r(item.fats),
  fiber:    r(item.fiber),


  vitaminA:   r(item.vitaminA),
  vitaminC:   r(item.vitaminC),
  vitaminD:   r(item.vitaminD),
  vitaminB1:  r(item.vitaminB1),
  vitaminB2:  r(item.vitaminB2),
  vitaminB3:  r(item.vitaminB3),
  vitaminB6:  r(item.vitaminB6),
  vitaminB12: r(item.vitaminB12),
  folate:     r(item.folate),

  iron:       r(item.iron),
  calcium:    r(item.calcium),
  zinc:       r(item.zinc),
  magnesium:  r(item.magnesium),
  potassium:  r(item.potassium),
  sodium:     r(item.sodium),
  phosphorus: r(item.phosphorus),


  saturatedFat: r(item.saturatedFat),
  transFat:     r(item.transFat),

  yieldFactor: item.yieldFactor || 1,
});


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


const searchFoods = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 20); 

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

 
    const results = await Item.find({
      $or: [
        { name:      { $regex: query, $options: "i" } },
        { localName: { $regex: query, $options: "i" } },
        { tags:      { $regex: query, $options: "i" } },
        { category:  { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .select("name localName category source calories protein carbs fats fiber");

    res.status(200).json({
      success: true,
      count:   results.length,
      query,
      results: results.map(formatCard),
    });
  } catch (error) {
    console.error("Food search error:", error);
    res.status(500).json({ success: false, message: "Food search failed." });
  }
};


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



// Standard portion sizes in ml (volume-based)
const PORTION_SIZES = {
  katori: { small: 120, medium: 150, large: 200 },
  bowl:   { small: 200, medium: 300, large: 400 },
  glass:  { small: 150, medium: 250, large: 350 },
  plate:  { small: 150, medium: 250, large: 350 },
};

// Density map — category ke basis pe (g/ml)
const getCategoryDensity = (category = "") => {
  const c = category.toLowerCase();

  if (c.includes("legume"))                        return 1.05; // Grain Legumes (dal)
  if (c.includes("cereal") || c.includes("millet"))return 0.90; // Cereals and Millets
  if (c.includes("vegetable") || c.includes("leafy")) return 0.85; // Vegetables
  if (c.includes("roots") || c.includes("tuber"))  return 0.95; // Aloo, Shakarkand
  if (c.includes("milk") || c.includes("dairy"))   return 1.03; // Milk products
  if (c.includes("meat") || c.includes("poultry")) return 0.95; // Meat
  if (c.includes("fish"))                          return 1.02; // Fish
  if (c.includes("egg"))                           return 1.0;  // Eggs
  if (c.includes("fat") || c.includes("oil"))      return 0.92; // Oils
  if (c.includes("fruit"))                         return 0.85; // Fruits
  if (c.includes("nut") || c.includes("seed"))     return 0.65; // Nuts (dense)
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


    portions.push({
      unit: "mutthi", size: "standard", ml: null,
      grams: 35,
      nutrition: nutritionForGrams(35),
      label: "1 Mutthi / Handful (~35g)",
    });


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