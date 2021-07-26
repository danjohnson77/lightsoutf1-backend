const express = require("express");
const {
  getRaceInfo,
  getPredictions,
  updateUserPrediction,
} = require("../controllers/predict");

const router = express.Router();

router.get("/", getRaceInfo);
router.post("/", updateUserPrediction);
router.post("/user", getPredictions);

module.exports = router;
