require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors")
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

const userroutes = require("./src/Modules/User/User.Router");
const jobrouter = require("./src/Modules/Job/Job.Router");
const authentication = require("./src/Modules/Auth/Auth.Router");
const WorkRecords = require("./src/Modules/WorkRecord/WorkRecord.Router")
// const Media = require("./src/Modules/Media/Media.Router");
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());

// routes
app.use("/profile", userroutes);
app.use("/api/v1/auth", authentication);
app.use("/api/v1/jobs", jobrouter);
app.use("/api/v1/work",WorkRecords);
// app.use("/api/v1/Media", Media);

// get 
app.get("/login/test",(req,res)=>{
  console.log("user entered login");

  console.log(req.method);
  console.log(req.url);

  res.send("login not yet created");
});

// post == create
app.post("/jobs/:id",(req,res)=>{
  console.log("post  request recived from /jobs/:id ");
  console.log(req.body);
  console.log(req.method);
  console.log(req.url);
  console.log(req.params.id);
  res.status(200).json({
    success : true,
    message : "jobs are fetched",
    status : "pending",
  });
  
});

app.use(errorHandler);        //              error handleing should be at last 

// CONNECT DATABASE
connectDB();

// server 
app.get("/", (req, res) => {
  res.send("MahaaFix Backend Running 🚀");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});