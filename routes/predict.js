const express = require("express");
const {
  getRaceInfo,
  getPredictions,
  updateRaceInfo,
  updateUserPrediction,
} = require("../controllers/predict");

const router = express.Router();

router.get("/", getRaceInfo);
router.post("/", updateUserPrediction);
router.post("/user", getPredictions);
router.get("/update", updateRaceInfo);

module.exports = router;
