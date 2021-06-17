const express = require("express");
const {
  getRaceInfo,
  updateRaceInfo,
  updateUserPrediction,
} = require("../controllers/predict");

const router = express.Router();

router.get("/", getRaceInfo);
router.post("/", updateUserPrediction);
router.post("/update", updateRaceInfo);

module.exports = router;
