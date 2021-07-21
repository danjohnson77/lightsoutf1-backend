const mongoose = require("mongoose");

const RaceInfoSchema = new mongoose.Schema(
  {
    lastRace: {
      id: String,
      raceName: String,
      date: Date,
      displayDate: String,
      lastUpdated: Date,
      results: Array,
    },
    nextRace: {
      id: String,
      raceName: String,
      date: Date,
      displayDate: String,
      lastUpdated: String,
    },
  },
  { capped: { max: 1, size: 102400000 } }
);

module.exports = mongoose.model("raceInfo", RaceInfoSchema);
