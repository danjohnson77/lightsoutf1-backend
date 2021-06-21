const schedule = require("node-schedule");

const raceInfo = require("../config/raceInfo");
const { resolvePredictions } = require("./resolvePredictions");

const startCron = () => {
  console.log("CRON STARTED");
  const date = raceInfo[1].nextRace.date;
  const now = Date.now();

  const scheduleTime = new Date(now * 1000);

  console.log(date, now, scheduleTime, now < date);

  //resolvePredictions();

  //   const job = schedule.scheduleJob(scheduleTime, async () => {
  //     console.log("RAN JOB AT", scheduleTime, await resolvePredictions());

  //     // startCron();
  //   });
};

module.exports = { startCron };
