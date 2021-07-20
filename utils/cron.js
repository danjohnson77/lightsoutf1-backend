const schedule = require("node-schedule");

const {
  resolvePredictions,
  getRaceInfoFromFile,
} = require("./resolvePredictions");

const startCron = async (time = Date.now() + 10 * 1000) => {
  console.log("CRON STARTED", new Date(time));

  schedule.scheduleJob(time, async () => {
    console.log("RAN JOB AT", new Date(time));

    const resolveResults = await resolvePredictions();

    console.log("res", resolveResults);

    if (resolveResults === "unchanged") {
      time = Date.now() + 60 * 60 * 1000;
      console.log("Unchanged, running next job at ", new Date(time));
      startCron(time);
    } else if (resolveResults === "changed") {
      const newRaceInfo = await getRaceInfoFromFile();

      time = newRaceInfo[1].nextRace.date + 60;

      startCron(time);
    } else if (resolveResults === "DB Error") {
      console.log("DB ERROR");
    }
  });
};

module.exports = { startCron };
