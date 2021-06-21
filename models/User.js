const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please enter a valid email",
    ],
  },

  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: 6,
    select: false,
  },

  verifyToken: String,
  verifyTokenExpire: Date,
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },

  points: { type: Number, required: true, default: 0 },
  currentPrediction: {
    type: Object,
    required: true,
    default: {},
  },
  pastPredictions: {
    type: Array,
    required: true,
    default: [],
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in db
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash token
UserSchema.methods.getVerifyToken = function () {
  // Generate token
  const token = crypto.randomBytes(20).toString("hex");

  // Hash token and set to dynamic field
  this.verifyToken = crypto.createHash("sha256").update(token).digest("hex");

  // Set expire

  this.verifyTokenExpire = Date.now() + 10 * 60 * 1000;
  return this.verifyToken;
};

UserSchema.methods.checkToken = function (token) {
  if (token === this.verifyToken) {
    this.verified = true;
    this.verifyToken = null;
    this.verifyTokenExpire = null;
    this.save();
    return true;
  } else {
    return false;
  }
};

module.exports = mongoose.model("user", UserSchema);
