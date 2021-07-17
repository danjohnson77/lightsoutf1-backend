const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");

const { getRaceInfoFromFile } = require("../utils/resolvePredictions");
const fs = require("fs").promises;

const axios = require("axios");
const dayjs = require("dayjs");
// const UTC = require("dayjs/plugin/UTC");

const User = require("../models/User");

// dayjs.extend(UTC); // use plugin

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
  const response = await getRaceInfoFromFile();
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
    const lastRaceRes = axios.get(
      `${process.env.F1_API_URL}/current/last/results.json`
    );

    const nextRaceRes = axios.get(`${process.env.F1_API_URL}/current.json`);

    const apiRes = await axios.all([lastRaceRes, nextRaceRes]);

    const fullRes = apiRes.map((res, index) => {
      const { Races: races } = res.data.MRData.RaceTable;
      const {
        Results: results,
        date,
        time,
        season,
        round,
        raceName,
      } = index === 0
        ? races[0]
        : races.find((race) => {
            const date = race.date + "T" + race.time;

            const d = new Date(date);

            const parsed = Date.parse(d);

            return parsed > Date.now() - 1000000000;
          });

      let key = "";

      let returnObj = {
        id: `${season}r${round}`,
        raceName,
        date: Date.parse(`${date}T${time}`),
        displayDate: dayjs(`${date}T${time}`).format(dateFormat) + " GMT",
        lastUpdated: dayjs().format(dateFormat),
      };

      if (index === 0) {
        key = "lastRace";
        returnObj = {
          ...returnObj,
          results: results.map((item) => {
            const {
              Driver: { driverId },
              position,
            } = item;
            return { driverId, position };
          }),
        };
      }
      if (index === 1) {
        key = "nextRace";
      }

      return { [key]: returnObj };
    });

    await fs.writeFile("./config/raceInfo.json", JSON.stringify(fullRes));

    res.json(fullRes);
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});
