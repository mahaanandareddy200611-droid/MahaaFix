const Job = require("../models/job");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

const isAssignedWorker =asyncHandler (async(req,res,next)=>{  
    const job = await Job.findById(req.params.id)
    
    if(!job){
    throw new AppError("Job not found!",404)}
    
    if(job.worker?.workerid ||
    job.worker.workerid.toString() !== req.user.id){
        throw new AppError("you are not authorized to do this",403);
    }
    req.job = job;
    next()
})
module.exports=isAssignedWorker