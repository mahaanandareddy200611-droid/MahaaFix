const Job = require("../models/job")
const AppError = require("../utils/AppError")
const asyncHandler = require("./asyncHandler")

module.exports = asyncHandler(async(req,res,next)=>{
    const job = await Job.findById(req.params.id)

    if(!job){
        throw new AppError("Job not found",404)
    }
    req.job = job

    next()
}
)