const express = require("express");
const Auth = require("../middleware/Auth")
const isAdmin = require("../middleware/isAdmin")
const isWorker = require("../middleware/isWorker")
const jobrouter = express.Router();

const { createJobs,myJobs ,getJobs,getThisJob,AssignJob,Accepted,updateStatus,EstimateSubmitted,completed,reworkProof } = require("../controllers/jobcontroller");

jobrouter.get("/", Auth, getJobs);

jobrouter.get("/my-jobs", Auth, myJobs);

jobrouter.post("/create", Auth, createJobs);

jobrouter.get("/:id", Auth, getThisJob);

jobrouter.post("/:id/assign",Auth,isAdmin,AssignJob)

jobrouter.patch("/:id/accepted", Auth, isWorker, Accepted);

jobrouter.patch("/:id/status", Auth, updateStatus);

jobrouter.patch("/:id/EstimateSubmitted",EstimateSubmitted);

jobrouter.patch("/:id/completed",completed);

jobrouter.patch("/:id/rework",reworkProof)

module.exports=jobrouter;