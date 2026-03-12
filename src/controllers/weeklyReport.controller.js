const Record       = require("../models/record.model");
const WeeklyReport = require("../models/weeklyReport");
const { getRDA }   = require("../utils/rda");


const startOfDay = (date = new Date()) => {
  const { year, month, day } = getISTDateParts(date);

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    -5,
    -30,
    0,
    0
  ));
};

const endOfDay = (date = new Date()) => {
 const { year, month, day } = getISTDateParts(date);

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    18,
    29,
    59,
    999
  ));
};

const getISTDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const obj = {};
  parts.forEach(p => obj[p.type] = p.value);

  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day)
  };
};


const formatDateIST = (date) => {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

};

const getWeekRange = () => {
  const today = new Date();
  const day   = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: startOfDay(monday),
    weekEnd:   endOfDay(sunday),
  };
};


const checkDailyLimit = async (userId) => {
  const today = new Date();

  const todayCount = await WeeklyReport.countDocuments({
    user:      userId,
    createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) },
  });


  return todayCount;
};


const buildPrompt = (user, records, rda, daysLogged) => {


  const avg = (key) =>
    Math.round(records.reduce((s, r) => s + (r.totals?.[key] || 0), 0) / daysLogged);


  const avgScore = Math.round(
    records.reduce((s, r) => s + (r.dietScore || 0), 0) / daysLogged
  );
  const avgWater = Math.round(
    records.reduce((s, r) => s + (r.waterIntake || 0), 0) / daysLogged
  );

  return `Indian nutrition expert. Analyze weekly diet. Reply in simple English only.

User: ${user.gender}, ${user.age}yrs, goal: ${user.goal}
Week avg: score ${avgScore}/100, cal ${avg("calories")}/${rda.calories}, protein ${avg("protein")}/${rda.protein}g, iron ${avg("iron")}/${rda.iron}mg, water ${avgWater}/${user.dailyWaterTarget} glasses

Reply ONLY valid JSON, no extra text:
{"summary":"2 line English","positives":["2 items"],"warnings":["2 items"],"suggestions":["3 Indian food tips"],"motivation":"1 line"}`;

};


const callOpenAI = async (prompt) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "gpt-4o-mini",


      max_tokens:  350,


      temperature: 0.5,


      messages: [
        {
          role:    "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();



  const clean = text.replace(/```json|```/g, "").trim();


  return JSON.parse(clean);
};


const generateInBackground = async (reportId, user, records, rda, daysLogged) => {
  try {
    const prompt   = buildPrompt(user, records, rda, daysLogged);
    const insights = await callOpenAI(prompt);

    const avg = (key) =>
      Math.round(records.reduce((s, r) => s + (r.totals?.[key] || 0), 0) / daysLogged * 10) / 10;

    const avgTotals = {
      calories: avg("calories"),
      protein:  avg("protein"),
      carbs:    avg("carbs"),
      fats:     avg("fats"),
      fiber:    avg("fiber"),
      iron:     avg("iron"),
      calcium:  avg("calcium"),
      vitaminC: avg("vitaminC"),
    };


    const weeklyDietScore = Math.round(
      records.reduce((s, r) => s + (r.dietScore || 0), 0) / daysLogged
    );

    await WeeklyReport.findByIdAndUpdate(reportId, {
      status:          "completed",
      insights,
      averages:        avgTotals,
      weeklyDietScore,
      generatedAt:     new Date(),
    });

  } catch (error) {
    console.error("Background generation error:", error);
    await WeeklyReport.findByIdAndUpdate(reportId, { status: "failed" });
  }
};


const generateReport = async (req, res) => {
  try {
    const user = req.user;
    const { weekStart, weekEnd } = getWeekRange();


    const todayCount = await checkDailyLimit(user._id);

    if (todayCount >= 2) {
      return res.status(429).json({
   
        success: false,
        message: "Aaj 2 baar report generate ho chuki hai. Kal dobara try karo.",
        limit:       2,
        usedToday:   todayCount,
      });
    }



    const existingReport = await WeeklyReport.findOne({
      user:          user._id,
      weekStartDate: weekStart,
      status:        "completed",
    });

    if (existingReport) {
      return res.status(200).json({
        success:       true,
        alreadyExists: true,
        message:       "Is hafte ki report already exist karti hai.",
        report:        existingReport,
      });
    }

    const records = await Record.find({
      user: user._id,
      date: { $gte: weekStart, $lte: weekEnd },
    })
      .sort({ date: 1 })
      .select("date dietScore totals waterIntake");


    const daysLogged = records.length;

    if (daysLogged < 2) {
      return res.status(400).json({
        success:    false,
        message:    `7 din ka data chahiye. Abhi ${daysLogged}/7 din logged hain.`,
        daysLogged,
        daysNeeded: 7 - daysLogged,
      });
    }


    const report = await WeeklyReport.create({
      user:          user._id,
      weekStartDate: weekStart,
      weekEndDate:   weekEnd,
      daysLogged,
      status:        "pending",
    });

    const rda = getRDA(user.gender, user.age);


    generateInBackground(report._id, user, records, rda, daysLogged);


    res.status(202).json({
      success:  true,
      message:  "Report generate ho rahi hai. 10-15 seconds mein GET /weekly check karo.",
      reportId: report._id,
      status:   "pending",
      usedToday:   todayCount + 1,
      remainingToday: 2 - (todayCount + 1),

    });

  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ success: false, message: "Failed to start report generation." });
  }
};


const getWeeklyReport = async (req, res) => {
  try {
    const user = req.user;
    const { weekStart } = getWeekRange();

    const report = await WeeklyReport.findOne({
      user:          user._id,
      weekStartDate: weekStart,
    }).sort({ createdAt: -1 });


    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Is hafte ki koi report nahi. POST /generate karo.",
      });
    }

    if (report.status === "pending") {
      return res.status(200).json({
        success:  true,
        status:   "pending",
        message:  "Report ban rahi hai. 10-15 sec baad dobara try karo.",
        reportId: report._id,
      });
    }

    if (report.status === "failed") {
      return res.status(200).json({
        success:  false,
        status:   "failed",
        message:  "Report generate karne mein error aayi. Dobara try karo.",
        reportId: report._id,
      });
    }

    res.status(200).json({
      success: true,
      status:  "completed",
      report: {
        _id:             report._id,
        weekStartDate:   formatDateIST(report.weekStartDate),
        weekEndDate:     formatDateIST(report.weekEndDate),
        daysLogged:      report.daysLogged,
        weeklyDietScore: report.weeklyDietScore,
        averages:        report.averages,
        insights:        report.insights,
        generatedAt:     report.generatedAt,
      },
    });

  } catch (error) {
    console.error("Get weekly report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report." });
  }
};

module.exports = { generateReport, getWeeklyReport };