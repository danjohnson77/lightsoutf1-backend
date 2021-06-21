const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");
const raceInfo = require("../config/raceInfo");
const fs = require("fs");
const axios = require("axios");
const User = require("../models/User");
const connectDB = require("../config/db");

exports.resolvePredictions = asyncHandler(async () => {
  const newResults = await checkForNewRaceResults();
  if (newResults === true) {
    console.log("NEW RESULTS FOUND");

    const raceResults = await this.getCurrentRaceInfo();

    const { id, results } = raceResults.data[0].lastRace;

    const users = await User.find({
      "currentPrediction.raceId": id,
    });

    users.map((user, index) => {
      const { currentPrediction, points, name, id } = user;
      const { list, raceId } = currentPrediction;
      const newPoints = calculatePrediction(list, results);

      User.findByIdAndUpdate(
        id,
        {
          points: points + newPoints,
          currentPrediction: {},
          pastPredictions: [
            ...user.pastPredictions,
            {
              raceId,
              points: newPoints,
              list,
            },
          ],
        },
        () => {
          console.log(name, "points", points, currentPrediction);
        }
      );
    });

    console.log("results", id, results);
    console.log("users", users);
  } else {
    console.log("RACE UNCHANGED");
  }
});

exports.getCurrentRaceInfo = asyncHandler(() => {
  try {
    const file = fs.readFileSync("./config/raceInfo.json");

    return { data: JSON.parse(file) };
  } catch (error) {
    return { error };
  }
});

const calculatePrediction = (prediction, result) => {
  let points = 0;

  prediction.map((item, index) => {
    if (item.id === result[index].driverId) {
      console.log(item.id, result[index].driverId, "CORRECT");
      points += 1;
    }
  });
  console.log(points);
  return points;
};

const checkForNewRaceResults = async () => {
  const {
    data: [{ lastRace }, { nextRace }],
  } = await this.getCurrentRaceInfo();

  console.log(lastRace.id, nextRace.id);

  const splitRace = lastRace.id.split("r");

  const curSeason = splitRace[0];
  const curRound = splitRace[1];

  try {
    const lastRaceRes = await axios.get(
      `${process.env.F1_API_URL}/current/last/results.json`
    );
    const {
      MRData: {
        RaceTable: { season, round },
      },
    } = lastRaceRes.data;

    console.log("cur", curSeason, curRound, "new", season, round);

    return curSeason === season && parseInt(round) === parseInt(curRound) + 1;
  } catch (error) {
    return error;
  }
};
