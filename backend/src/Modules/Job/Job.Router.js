const express = require("express");
const Auth = require("../../middleware/Auth")
const isAdmin = require("../../middleware/isAdmin")
const isWorker = require("../../middleware/isWorker")
const isAssignedWorker = require("../../middleware/isAssignedWorker");
const inJobWorkers = require("../../middleware/inJobWorkers")
const loadJob = require("../../middleware/loadJob")
const { createJobs,myJobs ,getJobs,getThisJob,AssignJob,Accepted,Rejected,updateStatus,
    reachedLocation,EstimateSubmitted,Approval,WorkCompleted,verified,ReworkRequired } = require("./Job.Controller");
const  validate  = require("../../utils/validate");
const { createjob } = require("./Job.Validator");
const idempotancyMiddleware = require("../../infrastructure/idempotency/idempotancy.middleware");

const jobrouter = express.Router();

jobrouter.get("/", Auth, getJobs);  // it sends of freshly created :: title category subCategory address.city address.street with a query 

jobrouter.get("/my-jobs", Auth, myJobs);  // either created by you or verified by you || job done by you || all for admin

jobrouter.post("/create", Auth,validate(createjob),idempotancyMiddleware,createJobs);// to create job

jobrouter.get("/:id", Auth,loadJob, getThisJob); // to get more details about that respeted job details 

jobrouter.post("/:id/assign",Auth,loadJob,isAdmin,idempotancyMiddleware,AssignJob) 
// for Admin to assign jobs by woker userids checks online or not    

jobrouter.patch("/:id/accepted", Auth,isWorker,loadJob,idempotancyMiddleware,Accepted);
//  

jobrouter.patch("/:id/reject",Auth,isWorker,loadJob,idempotancyMiddleware,Rejected);

jobrouter.patch("/:id/status", Auth,loadJob,isAdmin,idempotancyMiddleware, updateStatus);

jobrouter.patch("/:id/checking",Auth,loadJob,inJobWorkers,idempotancyMiddleware,reachedLocation)

jobrouter.patch("/:id/EstimateSubmitted",Auth,loadJob,inJobWorkers,idempotancyMiddleware,EstimateSubmitted); 

jobrouter.patch("/:id/Approval",Auth,loadJob,inJobWorkers,idempotancyMiddleware,Approval)   

jobrouter.patch("/:id/WorkCompleted",Auth,loadJob,inJobWorkers,idempotancyMiddleware,WorkCompleted);

jobrouter.patch("/:id/verified",Auth,loadJob,inJobWorkers,idempotancyMiddleware,verified);

jobrouter.patch("/:id/ReworkRequired",Auth,loadJob,inJobWorkers,idempotancyMiddleware,ReworkRequired) 

module.exports=jobrouter;