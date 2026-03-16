function calculateBMI(weight, height) {
  const heightM = height / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
}


function calculateBMR(weight, height, age, gender) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}


function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary:   1.2,
    light:       1.375,
    moderate:    1.55,
    active:      1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}


function calculateDailyCalorieTarget(tdee, goal) {
  const adjustments = {
    lose_weight:  -400,
    maintain:        0,
    gain_weight:  +400,
    build_muscle: +250,
  };
  const adjusted = tdee + (adjustments[goal] ?? 0);
  return Math.max(1200, Math.round(adjusted)); 
}


function calculateMacroTargets(weight, totalCalories, activityLevel, goal) {
  const proteinPerKg =
    goal === "build_muscle"                       ? 2.0 :
    activityLevel === "very_active"               ? 1.8 :
    activityLevel === "active"                    ? 1.6 :
    ["light", "moderate"].includes(activityLevel) ? 1.2 : 0.8;

  return {
    protein: Math.round(weight * proteinPerKg),
    carbs:   Math.round((totalCalories * 0.50) / 4),
    fats:    Math.round((totalCalories * 0.25) / 9),
    fiber:   Math.round((totalCalories / 1000) * 14),
  };
}


function calculateWaterTarget(weight) {
  return Math.min(12, Math.max(6, Math.round((weight * 35) / 250)));
}


function calculateAllTargets({ weight, height, age, gender, activityLevel, goal }) {
  const bmi                = calculateBMI(weight, height);
  const bmr                = calculateBMR(weight, height, age, gender);
  const tdee               = calculateTDEE(bmr, activityLevel);
  const dailyCalorieTarget = calculateDailyCalorieTarget(tdee, goal);
  const macroTargets       = calculateMacroTargets(weight, dailyCalorieTarget, activityLevel, goal);
  const dailyWaterTarget   = calculateWaterTarget(weight);

  return { bmi, dailyCalorieTarget, dailyWaterTarget, macroTargets };
}

module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateWaterTarget,
  calculateAllTargets,
};