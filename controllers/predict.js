const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");

const fs = require("fs");

const axios = require("axios");
const dayjs = require("dayjs");
const UTC = require("dayjs/plugin/UTC");

dayjs.extend(UTC); // use plugin

// @desc Update Race Info
// @route POST /predict/update
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

            return parsed > Date.now();
          });

      let key = "";
      let returnObj = {};

      if (index === 0) {
        key = "lastRace";

        returnObj = {
          id: `${season}r${round}`,
          raceName,
          date: dayjs.utc(`${date}T${time}`).unix(),
          lastUpdated: dayjs(),
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
        returnObj = {
          id: `${season}r${round}`,
          raceName,
          date: dayjs.utc(`${date}T${time}`).unix(),
          lastUpdated: dayjs(),
        };
      }

      return { [key]: returnObj };
    });

    fs.writeFileSync("./config/raceInfo.json", JSON.stringify(fullRes));

    res.json(fullRes);
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});
