const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");

const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/User");
const RaceInfo = require("../models/RaceInfo");
const dayjs = require("dayjs");

exports.resolvePredictions = asyncHandler(async () => {
  const newResults = await checkForNewRaceResults();

  if (newResults === true) {
    console.log("NEW RESULTS FOUND");
    const updated = await this.updateRaceConfig();

    if (updated) {
      try {
        const newRaceInfo = await this.getRaceInfo();

        console.log("CONFIG UPDATED");

        console.log("ID TO PROCESS", newRaceInfo[0].lastRace.id);

        const processed = await processPredictions();
        return processed;
      } catch (error) {
        console.log("update error", error);
      }
    }
  } else {
    return "unchanged";
  }
});

exports.getRaceInfo = async () => {
  const file = await RaceInfo.find({});
  if (!file) {
    return { error: "Could not retrive JSON file" };
  }
  return file;
};

const checkForNewRaceResults = async () => {
  const raceInfo = await RaceInfo.find({});

  const { lastRace } = raceInfo[0];

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

    return (
      (curSeason === season && parseInt(round) === parseInt(curRound) + 1) ||
      (season === curSeason + 1 && parseInt(round) === 1)
    );
  } catch (error) {
    return error;
  }
};

exports.updateRaceConfig = async (rollback = false) => {
  const dateFormat = "DD MMMM, YYYY HH:mm";
  try {
    const lastRaceRes = axios.get(
      `${process.env.F1_API_URL}${
        rollback ? "/2021/10/" : "/current/last/"
      }results.json`
    );

    const nextRaceRes = axios.get(
      `${process.env.F1_API_URL}${
        rollback ? "/2021/11/results.json" : "/current.json"
      }`
    );

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
      } = index === 0 ? races[0] : findNextRace(races, rollback);

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

    const objForDB = await RaceInfo.create({
      lastRace: fullRes[0].lastRace,
      nextRace: fullRes[1].nextRace,
    });

    return objForDB;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const findNextRace = (races, rollback = false) => {
  const nextRace = races.find((race) => {
    const date = race.date + "T" + race.time;

    const d = new Date(date);

    const parsed = Date.parse(d);
    const currentDate = rollback ? Date.now() - 10000000000 : Date.now();
    return parsed > currentDate;
  });

  return nextRace;
};

const processPredictions = async (attemptCount = 0) => {
  const raceInfo = await this.getRaceInfo();

  const { id, results } = raceInfo[0].lastRace;

  if (mongoose.connection.readyState === 1) {
    try {
      const users = await User.find({
        "currentPrediction.raceId": id,
      });
      users.map(async (user, index) => {
        const { currentPrediction, points, id } = user;
        const { list, raceId, raceName } = currentPrediction;
        const newPoints = calculatePrediction(list, results);
        try {
          await User.findByIdAndUpdate(
            id,
            {
              points: points + newPoints,
              currentPrediction: {},
              pastPredictions: [
                ...user.pastPredictions,
                {
                  raceName,
                  raceId,
                  points: newPoints,
                  actualResults: list,
                },
              ],
            },
            () => {
              //send user email here
            }
          );
        } catch (error) {
          console.log(error);
        }
      });

      return "changed";
    } catch (error) {
      console.log(error);
    }
  } else {
    attemptCount = attemptCount + 1;
    attemptCount < 5 &&
      setTimeout(() => {
        processPredictions();
      }, 5000);
    if (attemptCount === 5) {
      return "DB Error";
    }
  }
};

const calculatePrediction = (prediction, result) => {
  let points = 0;

  prediction.map((item, index) => {
    if (item.id === result[index].driverId) {
      points += 1;
    }
  });

  return points;
};
