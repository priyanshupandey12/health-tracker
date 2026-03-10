const mongoose=require('mongoose')

const recordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Date of this record — store as date only (no time)
    date: {
      type: Date,
      required: true,
    },

    // ── Water Tracking ───────────────────────────────────
    waterIntake: { type: Number, default: 0 },   // glasses consumed
    waterTarget: { type: Number, default: 8 },   // daily goal in glasses

    // ── Daily Nutrition Totals ───────────────────────────
    // These are SUM of all MealEntries for this day
    // Recalculated every time a MealEntry is added/removed
    totals: {
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

    // ── Diet Score ───────────────────────────────────────
    // Calculated score out of 100 based on how well user met their RDA
    // Formula: average % of key nutrients achieved, capped at 100
    dietScore: { type: Number, default: 0, min: 0, max: 100 },

    // ── RDA Completion % per nutrient ────────────────────
    // Stored so frontend can show progress bars without recalculating
    rdaCompletion: {
      calories: { type: Number, default: 0 },   // % of daily target
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      vitaminD: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);



const Record = mongoose.model("Record", recordSchema);
module.exports=Record
