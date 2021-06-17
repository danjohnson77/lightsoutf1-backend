const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config({ path: "./config/config.env" });

// Connect to DB
connectDB();

// Routes
const auth = require("./routes/auth");
const predict = require("./routes/predict");

const app = express();

app.use(express.json());

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Enable CORS
app.use(cors(corsOptions));

process.env.NODE_ENV === "development" && app.use(morgan("dev"));

// Mount Routes
app.use("/auth", auth);
app.use("/predict", predict);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running on ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});
