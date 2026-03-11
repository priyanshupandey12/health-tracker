const SEARCH_ALIASES = {

  "roti":        "wheat flour",
  "chapati":     "wheat flour",
  "chapatti":    "wheat flour",
  "phulka":      "wheat flour",
  "paratha":     "wheat flour",
  "parantha":    "wheat flour",
  "naan":        "wheat flour",
  "puri":        "wheat flour",
  "bhatura":     "wheat flour",
  "gehu":        "wheat flour",
  "gehun":       "wheat flour",

  
  "chawal":      "rice",
  "bhat":        "rice",
  "bhaat":       "rice",
  "pulao":       "rice",
  "biryani":     "rice",
  "khichdi":     "rice",
  "poha":        "rice flakes",
  "chivda":      "rice flakes",


  "dal":         "lentil",
  "daal":        "lentil",
  "masoor":      "lentil",
  "moong":       "green gram",
  "moong dal":   "green gram",
  "urad":        "black gram",
  "urad dal":    "black gram",
  "chana":       "bengal gram",
  "chane":       "bengal gram",
  "chole":       "bengal gram",
  "rajma":       "kidney beans",
  "arhar":       "red gram",
  "toor":        "red gram",
  "tur":         "red gram",


  "aloo":        "potato",
  "aaloo":       "potato",
  "tamatar":     "tomato",
  "pyaaz":       "onion",
  "pyaz":        "onion",
  "palak":       "spinach",
  "methi":       "fenugreek",
  "gobhi":       "cauliflower",
  "phool gobhi": "cauliflower",
  "band gobhi":  "cabbage",
  "patta gobhi": "cabbage",
  "gajar":       "carrot",
  "matar":       "peas",
  "shimla mirch":"capsicum",
  "karela":      "bitter gourd",
  "lauki":       "bottle gourd",
  "bhindi":      "lady finger",
  "okra":        "lady finger",
  "baingan":     "brinjal",
  "kaddu":       "pumpkin",
  "arbi":        "colocasia",


  "seb":         "apple",
  "kela":        "banana",
  "aam":         "mango",
  "santara":     "orange",
  "narangi":     "orange",
  "angoor":      "grape",
  "nashpati":    "pear",
  "anaar":       "pomegranate",
  "papita":      "papaya",
  "amrood":      "guava",
  "tarbooz":     "watermelon",
  "ananas":      "pineapple",
  "litchi":      "litchi",
  "chikoo":      "sapota",


  "doodh":       "milk",
  "dudh":        "milk",
  "dahi":        "curd",
  "paneer":      "cottage cheese",
  "makhan":      "butter",
  "ghee":        "ghee",
  "malai":       "cream",
  "lassi":       "butter milk",
  "chaach":      "butter milk",


  "anda":        "egg",
  "anday":       "egg",
  "murgi":       "chicken",
  "murg":        "chicken",
  "gosht":       "mutton",
  "machli":      "fish",
  "machali":     "fish",


  "badam":       "almond",
  "akhrot":      "walnut",
  "kaju":        "cashew",
  "mungfali":    "groundnut",
  "moongfali":   "groundnut",
  "peanut":      "groundnut",
  "til":         "sesame",


  "haldi":       "turmeric",
  "jeera":       "cumin",
  "dhania":      "coriander",
  "adrak":       "ginger",
  "lahsun":      "garlic",
  "imli":        "tamarind",

 
  "upma":        "semolina",
  "suji":        "semolina",
  "rava":        "semolina",
  "daliya":      "broken wheat",


  "tel":         "oil",
  "sarson tel":  "mustard oil",
  "nariyal tel": "coconut oil",
};

const resolveAlias = (query = "") => {
  const q = query.toLowerCase().trim();
  return SEARCH_ALIASES[q] || query;
};

module.exports = { resolveAlias, SEARCH_ALIASES };