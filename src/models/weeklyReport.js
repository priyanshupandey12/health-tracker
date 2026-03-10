const mongoose=require('mongoose')

const weeklyReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

  
    weekStartDate: { type: Date, required: true }, // Monday
    weekEndDate: { type: Date, required: true },   // Sunday

    // How many days were actually logged (out of 7)
    daysLogged: { type: Number, default: 0, min: 0, max: 7 },

    // ── Weekly Averages ──────────────────────────────────
    // Average per day across the week
    averages: {
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

      // Water
      water: { type: Number, default: 0 }, // avg glasses per day
    },

    // ── Average RDA Completion % ─────────────────────────
    avgRdaCompletion: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      vitaminD: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
    },

    // ── AI Generated Insights ────────────────────────────
    insights: {
      // Overall summary paragraph
      summary: { type: String, default: "" },

      // What went well this week
      positives: [{ type: String }],

      // What needs attention
      warnings: [{ type: String }],

      // Specific food suggestions for next week
      suggestions: [{ type: String }],

      // One motivational line
      motivation: { type: String, default: "" },
    },

    // ── Weekly Diet Score ────────────────────────────────
    weeklyDietScore: { type: Number, default: 0, min: 0, max: 100 },

    // Report generation status
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },

    // When AI generated this report
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);



const WeeklyReport = mongoose.model("WeeklyReport", weeklyReportSchema);
module.exports=WeeklyReport