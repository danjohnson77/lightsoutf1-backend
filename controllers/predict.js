const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");
const axios = require("axios");
const dayjs = require("dayjs");

const User = require("../models/User");
const RaceInfo = require("../models/RaceInfo");
const { updateRaceConfig } = require("../utils/resolvePredictions");
const dateFormat = "DD MMMM, YYYY HH:mm";

// @desc Get Users Predicitons
// @route POST /predict/user
// @access Private
exports.getPredictions = asyncHandler(async (req, res, next) => {
  const { id } = req.body;
  try {
    const user = await User.findById(id);

    res.json(user.currentPrediction);
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});

// @desc Get Race Info
// @route GET /predict/
// @access Private
exports.getRaceInfo = asyncHandler(async (req, res, next) => {
  const response = await RaceInfo.find({});
  if (response.error) {
    return next(errorHandler(response, req, res, next));
  }
  res.status(200).json(response);
});

// @desc Update User Prediction
// @route POST /predict/
// @access Private
exports.updateUserPrediction = asyncHandler(async (req, res, next) => {
  try {
    const { list, user, raceId, tiebreaker, raceName } = req.body;
    const currentUser = await User.findById(user.id);
    currentUser.currentPrediction = {
      list,
      raceName,
      raceId,
      tiebreaker,
      lastUpdated: dayjs().format(dateFormat),
    };
    currentUser.save();
    res.json({ success: true, list });
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});

// @desc Update Race Info
// @route GET /predict/update
// @access Private
exports.updateRaceInfo = asyncHandler(async (req, res, next) => {
  try {
    const objForDB = await updateRaceConfig(true);

    res.json(objForDB);
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});
