
require("dotenv").config();
const express = require("express");


const app = express();
const cors = require("cors")
const errorHandler = require("./middleware/errorHandler");

const userroutes = require("./Modules/User/User.Router");
const jobrouter = require("./Modules/Job/Job.Router");
const authentication = require("./Modules/Auth/Auth.Router");
const WorkRecords = require("./Modules/WorkRecord/WorkRecord.Router");
const notFound = require("./middleware/notFound");
// const Media = require("./src/Modules/Media/Media.Router");
app.use(cors({
    origin: process.env.frontend_url
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

app.get("/", (req, res) => {
  res.send("MahaaFix Backend Running 🚀");
});

app.use(notFound)

app.use(errorHandler);        //              error handleing should be at last 
module.exports = app;