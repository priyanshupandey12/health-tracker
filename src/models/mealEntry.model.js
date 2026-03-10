const mongoose=require('mongoose')

const mealEntrySchema = new mongoose.Schema(
  {

    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
      required: true,
    },


    mealType: {
      type: String,
      enum: ["pre_breakfast", "breakfast", "lunch", "dinner", "snack"],
      required: true,
    },

   
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },

    // Food name — stored directly for quick display
    // (even if item ref exists, store name here)
    foodName: {
      type: String,
      required: true,
      trim: true,
    },


    portionUnit: {
      type: String,
      enum: [
        "katori", "bowl", "glass", "cup",
        "spoon", "teaspoon", "mutthi",
        "piece", "slice", "plate", "grams",
      ],
      required: true,
    },
    portionSize: {
      type: String,
      enum: ["small", "medium", "large", "standard"],
      default: "medium",
    },

    // For countable items — roti (2), eggs (3), biscuits (4)
    quantity: { type: Number, default: 1, min: 0.25 },

    // Final grams — calculated and stored (don't recalculate every time)
    calculatedGrams: { type: Number, required: true },

    // ── Nutrition for THIS entry ──────────────────────────
    // Calculated at log time: (calculatedGrams / 100) × item nutrition
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },

      // Vitamins
      vitaminA: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      vitaminD: { type: Number, default: 0 },
      vitaminB12: { type: Number, default: 0 },
      folate: { type: Number, default: 0 },

      // Minerals
      iron: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      zinc: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
    },

    // User note — "added extra ghee", "less salt"
    note: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);


const MealEntry = mongoose.model("MealEntry", mealEntrySchema);
module.exports=MealEntry