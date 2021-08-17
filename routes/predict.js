const express = require("express");
const {
  getRaceInfo,
  getPredictions,
  updateUserPrediction,
  updateRaceInfo,
} = require("../controllers/predict");

const router = express.Router();

router.get("/", getRaceInfo);
router.post("/", updateUserPrediction);
router.post("/user", getPredictions);

// Uncomment to expose API endpoint
//router.get("/update", updateRaceInfo);

module.exports = router;
