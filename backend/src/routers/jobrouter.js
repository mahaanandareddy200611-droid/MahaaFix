const express = require("express");
const Auth = require("../middleware/Auth")
const isWorker = require("../middleware/isWorker")
const jobrouter = express.Router();

const { createJobs ,getJobs,getThisJob,updateStatus } = require("../controllers/jobcontroller");

jobrouter.get("/",Auth,getJobs);


jobrouter.get("/:id",Auth,isWorker,getThisJob);


jobrouter.patch("/:id/status",Auth,updateStatus)



jobrouter.post("/",Auth,createJobs);


module.exports=jobrouter;