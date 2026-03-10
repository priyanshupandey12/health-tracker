const mongoose=require('mongoose')


const portionMappingSchema = new mongoose.Schema(
  {
 
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    itemName: { type: String }, 

   
    portionUnit: {
      type: String,
      enum: [
        "katori",   // small bowl ~150ml
        "bowl",     // larger bowl ~300ml
        "glass",    // drinking glass ~250ml
        "cup",      // measuring cup ~240ml
        "spoon",    // tablespoon ~15ml
        "teaspoon", // teaspoon ~5ml
        "mutthi",   // one fist/handful ~30-40g
        "piece",    // roti, egg, fruit piece
        "slice",    // bread slice
        "plate",    // full plate (rice/sabzi)
        "grams",    // direct grams (fallback)
      ],
      required: true,
    },


    portionSize: {
      type: String,
      enum: ["small", "medium", "large", "standard"],
      default: "medium",
    },

    // The key calculation — how many grams is this portion?
    calculatedGrams: {
      type: Number,
      required: true,
    },

    // How we calculated it (for transparency / debugging)
    conversionNote: {
      type: String,
      // e.g. "Medium katori = 150ml × 1.05 density for dal = 157.5g"
    },
  },
  { timestamps: true }
);

portionMappingSchema.index({ item: 1, portionUnit: 1, portionSize: 1 });

const PortionMapping = mongoose.model("PortionMapping", portionMappingSchema);
module.exports=PortionMapping;

// ─────────────────────────────────────────────────────────────
// STANDARD DEFAULTS (used when no item-specific mapping exists)
// Import this in your service layer
// ─────────────────────────────────────────────────────────────

export const STANDARD_PORTION_GRAMS = {
  katori: { small: 120, medium: 150, large: 200 },
  bowl: { small: 200, medium: 300, large: 400 },
  glass: { small: 150, medium: 250, large: 350 },
  cup: { standard: 240 },
  spoon: { standard: 15 },       // tablespoon
  teaspoon: { standard: 5 },
  mutthi: { standard: 35 },      // avg handful
  piece: { standard: null },     // depends on item (roti ~30g, egg ~50g)
  slice: { standard: 25 },       // bread slice
  plate: { small: 150, medium: 250, large: 350 },
  grams: { standard: 1 },        // 1:1 mapping
};

// Food density map — to convert volume (ml) to weight (grams)
// grams = ml × density
export const FOOD_DENSITY = {
  dal: 1.05,          // cooked dal (liquid-ish)
  chawal: 0.90,       // cooked rice
  sabzi: 0.85,        // cooked vegetables
  dahi: 1.03,         // curd/yogurt
  milk: 1.03,         // milk
  oil: 0.92,          // cooking oil
  ghee: 0.91,         // ghee
  flour: 0.57,        // dry flour (atta)
  default: 0.90,      // fallback
};

// Helper function — use this in your service
export function calculateGrams(portionUnit, portionSize = "medium", density = FOOD_DENSITY.default) {
  const sizes = STANDARD_PORTION_GRAMS[portionUnit];
  if (!sizes) return null;

  const ml = sizes[portionSize] || sizes["standard"];
  if (!ml) return null;

  // For dry/solid foods, ml ≈ grams with density factor
  // For weight-based (grams), return directly
  if (portionUnit === "grams") return ml;

  return Math.round(ml * density);
}