const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

module.exports = asyncHandler(async(req,res,next)=>{

    const job = req.job;

    const isAdmin =
        req.user.role === "admin" ||
        req.user.role === "operator";

    if(!isAdmin){

        if(req.user.role === "worker"){

            if(
                !job.worker?.workerid ||
                job.worker.workerid.toString()
                !==
                req.user.id
            ){
                throw new AppError(
                    "This job is not assigned to you",
                    403
                );
            }
        }

        if(req.user.role === "customer"){

            if(
                job.customer.userid.toString()
                !==
                req.user.id
            ){
                throw new AppError(
                    "You are not the owner of this job",
                    403
                );
            }
        }
    }

    next();

});