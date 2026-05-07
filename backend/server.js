const express = require("express");

const connectDB = require("./src/config/db");

require("dotenv").config();

const app = express();

app.use(express.json());

// CONNECT DATABASE
connectDB();

app.get("/", (req, res) => {
  res.send("MahaaFix Backend Running 🚀");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});