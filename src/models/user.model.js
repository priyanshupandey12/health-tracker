const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, 
    },


    age: { type: Number, required: true, min: 10, max: 100 },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    height: { type: Number, required: true }, // in cm
    weight: { type: Number, required: true }, // in kg
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate",
    },
    goal: {
      type: String,
      enum: ["lose_weight", "maintain", "gain_weight", "build_muscle"],
      default: "maintain",
    },

     bmi:                { type: Number, default: 0    },
    dailyCalorieTarget: { type: Number, default: 2000 },
    dailyWaterTarget:   { type: Number, default: 8    }, 
 
  
    macroTargets: {
      protein: { type: Number, default: 50  },
      carbs:   { type: Number, default: 250 },
      fats:    { type: Number, default: 55  },
      fiber:   { type: Number, default: 28  },
    },

  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return ;
  this.password = await bcrypt.hash(this.password, 12);

});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports=User