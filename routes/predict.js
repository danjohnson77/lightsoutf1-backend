const express = require("express");
const { updateRaceInfo } = require("../controllers/predict");

const router = express.Router();

router.post("/update", updateRaceInfo);

module.exports = router;
