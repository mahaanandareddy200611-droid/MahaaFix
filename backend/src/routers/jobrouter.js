const express = require("express");
const Auth = require("../middleware/Auth")
const isAdmin = require("../middleware/isAdmin")
const isWorker = require("../middleware/isWorker")
const isAssignedWorker = require("../middleware/isAssignedWorker");
const inJobWorkers = require("../middleware/inJobWorkers")
const loadJob = require("../middleware/loadJob")
const { createJobs,myJobs ,getJobs,getThisJob,AssignJob,Accepted,updateStatus,
    reachedLocation,EstimateSubmitted,Approval,WorkCompleted,verified,ReworkRequired } = require("../controllers/jobcontroller");
const  validate  = require("../validators/validate");
const { createjob } = require("../validators/jobValidation");

const jobrouter = express.Router();


jobrouter.get("/", Auth, getJobs);

jobrouter.get("/my-jobs", Auth, myJobs);

jobrouter.post("/create", Auth,validate(createjob),createJobs);

jobrouter.get("/:id", Auth,loadJob, getThisJob);

jobrouter.post("/:id/assign",Auth,isAdmin,loadJob,AssignJob)

jobrouter.patch("/:id/accepted", Auth, isWorker,loadJob, Accepted);

jobrouter.patch("/:id/status", Auth,loadJob,inJobWorkers, updateStatus);

jobrouter.patch("/:id/checking",Auth,loadJob,inJobWorkers,reachedLocation)

jobrouter.patch("/:id/EstimateSubmitted",Auth,loadJob,inJobWorkers,EstimateSubmitted); 

jobrouter.patch("/:id/Approval",Auth,loadJob,inJobWorkers,Approval)   

jobrouter.patch("/:id/WorkCompleted",Auth,loadJob,inJobWorkers,WorkCompleted);

jobrouter.patch("/:id/verified",Auth,loadJob,inJobWorkers,verified);

jobrouter.patch("/:id/ReworkRequired",Auth,loadJob,inJobWorkers,ReworkRequired) 

module.exports=jobrouter;