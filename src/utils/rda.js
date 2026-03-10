const getRDA = (gender, age) => {
  const isFemale = gender === "female";
  const isChild  = age < 18;
  const isSenior = age > 60;

  return {
  
    calories:  isFemale ? 1900 : 2100,
    protein:   isFemale ? 46   : 56,      // g
    carbs:     isFemale ? 225  : 260,     // g
    fats:      isFemale ? 55   : 65,      // g
    fiber:     isFemale ? 25   : 30,      // g

  
    vitaminA:   600,                       // mcg — same for all adults
    vitaminC:   40,                        // mg
    vitaminD:   600,                       // IU (15mcg)
    vitaminB1:  isFemale ? 1.1 : 1.2,     // mg
    vitaminB2:  isFemale ? 1.1 : 1.3,     // mg
    vitaminB3:  isFemale ? 14  : 16,      // mg
    vitaminB6:  1.3,                       // mg
    vitaminB12: 2.4,                       // mcg
    folate:     400,                       

   
    iron:       isFemale && !isSenior ? 21 : 17,  // mg — females need more
    calcium:    isChild ? 800 : isSenior ? 1200 : 600, // mg
    zinc:       isFemale ? 8   : 11,      // mg
    magnesium:  isFemale ? 310 : 400,     // mg
    potassium:  3500,                      // mg
    sodium:     2000,                      // mg (upper limit)
    phosphorus: 700,                       // mg
  };
};

module.exports = { getRDA };