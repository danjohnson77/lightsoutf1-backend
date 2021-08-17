const schedule = require("node-schedule");

const { resolvePredictions, getRaceInfo } = require("./resolvePredictions");

const initCron = async () => {
  const raceInfo = await getRaceInfo();

  startCron(raceInfo[0].nextRace.date);
};

const startCron = async (time = Date.now() + 3 * 1000) => {
  console.log("CRON STARTED, SCHEDULED FOR: ", new Date(time));

  schedule.scheduleJob(time, async () => {
    console.log("RAN JOB AT", new Date(time));

    const resolveResults = await resolvePredictions();

    console.log("res", resolveResults);

    if (resolveResults === "unchanged") {
      time = Date.now() + 60 * 60 * 1000;

      console.log("Unchanged, running next job at ", new Date(time));

      startCron(time);
    } else if (resolveResults === "changed") {
      const raceInfo = await getRaceInfo();

      console.log("new race", raceInfo[0].nextRace.date + 60);

      time = raceInfo[0].nextRace.date + 60;

      startCron(time);
    } else if (resolveResults === "DB Error") {
      console.log("DB ERROR");
    }
  });
};

module.exports = { initCron };
