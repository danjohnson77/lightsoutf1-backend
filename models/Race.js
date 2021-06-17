const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const RaceSchema = new mongoose.Schema({
  secret: String,

  nextRace: Object,

  lastRace: Object,
});

module.exports = mongoose.model("race", RaceSchema);
