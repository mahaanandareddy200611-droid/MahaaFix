const workflow = require("../../utils/workflow");
const asyncHandler = require("../../middleware/asyncHandler")
const AppError = require("../../utils/AppError")
const User = require("../../models/User")
const Job = require("../../models/job")
const jobservice = require("./Job.Services")

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------create jobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------


exports.createJobs = asyncHandler(async(req,res)=>{

    const newJob = await jobservice.createJobs(
        req.body,
        req.user
    );

    return res.status(201).json({
        success:true,
        message:"Job created Successfully",
        data:newJob
    });

});


//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------myJobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------



exports.myJobs=asyncHandler(async  (req,res)=>{

    const myJobs = await jobservice.myJobs(req.user,req.query)


        return res.status(200).json({
            success:true,
            message:"successfully , your jobs are",
            data:myJobs,
        }        
 ) }
)

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------getJobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------


exports.getJobs=asyncHandler(async (req,res)=>{

    // fetch jobs for work 
    const jobs = await jobservice.getJobs(req.query)

        return res.status(200).json({
            success:true,
            message:"jobs fetched successfully",
            data: jobs
        })
    })

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------getThisJob------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------


exports.getThisJob = asyncHandler(async (req,res)=>{

    const thisJob =
        await jobservice.getThisJob(req.params.id);

    return res.status(200).json({
        success:true,
        message:"Job fetched successfully",
        data:{
            address: thisJob.address,
            category: thisJob.category,
            subCategory: thisJob.subCategory,
            beforeMedia:
                thisJob.visualProofs.beforeMedia
        }
    });

});

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------AssignJob------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------

exports.AssignJob=asyncHandler(async(req,res)=>{

        const job = await jobservice.AssignJob(req.job,req.body.workerid)

        return res.status(200).json({
            message:`This job was assigned to ${req.body.workerid} `,
            success:true,   
            data:job
        })
        
    } )

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------Accepted------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------

exports.Accepted = asyncHandler(async(req,res)=>{

    const job = await jobservice.Accepted(req.job,req.user)
        
        return res.status(200).json({
            success:true,
            message:"Successfully Accepted the work ",
            data:job,
        })
        
    } )


exports.Rejected = asyncHandler(async (req, res) => {
    const job = await jobservice.RejectJob(
        req.job,
        req.user
    );

    return res.status(200).json({
        success: true,
        message: "Job rejected successfully",
        data: job
    });
});

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------updateStatus------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------


exports.updateStatus = asyncHandler(async (req, res) => {

    const job = await jobservice.updateStatus(
        req.job,
        req.user,
        req.body.newStatus
    );


        return res.status(200).json({
            success: true,
            message:"Job status updated successfully",
            data: job
        });

    } )


exports.reachedLocation = asyncHandler(async(req,res)=>{
    const job = await jobservice.updateStatus( // same update of status but with this click
        req.job,
        req.user,
        "Checking"
    );

    res.status(200).json({
        success:true,
        data:job
    });
});

//                            |--------------------------------------------------------------|
//                                               EstimateSubmitted
//                            |--------------------------------------------------------------|

exports.EstimateSubmitted = asyncHandler(async (req, res) => {
    const { budget, actualProblem } = req.body;

    const job = await jobservice.EstimateSubmitted(
        req.job,
        req.user,
        budget,
        actualProblem
    );

    return res.status(200).json({
        success: true,
        message: "Estimate Submitted",
        data: job
    });
});

//                            |--------------------------------------------------------------|
//                                               customer Approval
//                            |--------------------------------------------------------------|
exports.Approval =asyncHandler( async (req,res) =>{

        const { decision }= req.body 
        const allowed = [  "TemporaryFixApproved","InProgress","InspectionCompleted"]
        if(!allowed.includes(decision)){
            throw new AppError("wrong responce",400);           
        }

        await jobservice.updateStatus(req.job,req.user,decision);

        return res.status(200).json({
            success:true,
            message:`Job moved to ${decision} `
        })
    } )

    
//                            |--------------------------------------------------------------|
//                                               WorkCompleteted
//                            |--------------------------------------------------------------|
exports.WorkCompleted = asyncHandler(async (req, res) => {
    const { afterMedia } = req.body;

    const job = await jobservice.WorkCompleted(
        req.job,
        req.user,
        afterMedia,
    );

    return res.status(200).json({
        success: true,
        message: "Work completed successfully",
        data: job
    });
});

//                            |--------------------------------------------------------------|
//                                              ReWork Required
//                            |--------------------------------------------------------------|

exports.ReworkRequired = asyncHandler(async (req, res) => {
    const { reworkProof } = req.body;

    const job = await jobservice.ReworkRequired(
        req.job,
        req.user,
        reworkProof
    );

    return res.status(200).json({
        success: true,
        message: "Rework submitted",
        data: job
    });
});


//                            |--------------------------------------------------------------|
//                                                      verified
//                            |--------------------------------------------------------------|
exports.verified = asyncHandler(async(req,res)=>{
    const job = await jobservice.updateStatus(
        req.job,
        req.user,
        "Verified"
    )

    res.status(200).json({
        seccess:true,
        message:"job success fully completed",
        data:job
    })
});