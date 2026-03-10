function calculateBMI(weight, height) {
  const heightM = height / 100
  return Number((weight / (heightM * heightM)).toFixed(2))
}

function calculateBMR(weight, height, age, gender) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

function calculateTDEE(bmr, activityLevel) {

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }

  return Math.round(bmr * multipliers[activityLevel])
}

const calculateWaterTarget = (weight) => {
  const mlPerDay = weight * 35       
  const glasses  = mlPerDay / 250   
  return Math.min(12, Math.max(6, Math.round(glasses)))

}

module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateWaterTarget
}