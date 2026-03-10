const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
{
  name: { type: String, required: true, trim: true },
  localName: { type: String, trim: true },
  category: { type: String, trim: true },
  tags: { type: String },

  source: {
    type: String,
    enum: ["IFCT2017", "OpenFoodFacts", "Custom"],
    default: "IFCT2017",
  },

  ifctCode: { type: String },
  barcode: { type: String },

  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },

  vitaminA: { type: Number, default: 0 },
  vitaminC: { type: Number, default: 0 },
  vitaminD: { type: Number, default: 0 },
  vitaminB1: { type: Number, default: 0 },
  vitaminB2: { type: Number, default: 0 },
  vitaminB3: { type: Number, default: 0 },
  vitaminB6: { type: Number, default: 0 },
  vitaminB12: { type: Number, default: 0 },
  folate: { type: Number, default: 0 },

  iron: { type: Number, default: 0 },
  calcium: { type: Number, default: 0 },
  zinc: { type: Number, default: 0 },
  magnesium: { type: Number, default: 0 },
  potassium: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  phosphorus: { type: Number, default: 0 },

  saturatedFat: { type: Number, default: 0 },
  transFat: { type: Number, default: 0 },

  yieldFactor: { type: Number, default: 1.0 }
},
{
  timestamps: true
}
);



const Item = mongoose.model("Item", itemSchema);

module.exports = Item;