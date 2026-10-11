const workflow = require("../../utils/workflow");
const asyncHandler = require("../../middleware/asyncHandler")
const AppError = require("../../utils/AppError")
const User = require("../../models/User")
const Job = require("../../models/job")
const jobservice = require("./Job.Services")
const executeIdempotant =  require("../../infrastructure/idempotency/idempotancy.execution.service");

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------create jobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------


exports.createJobs = asyncHandler(
    async (req, res) => {

        const result = await executeIdempotant({

                idempotancy:
                    req.idempotancy,

                operation:
                    async (session) => {

                        const newJob =
                            await jobservice.createJobs(
                                req.body,
                                req.user,
                                session
                            );

                        const body = {

                            success: true,

                            message:
                                "Job created Successfully",

                            data:
                                newJob
                        };

                        return {

                            statusCode: 201,

                            body
                        };

                    }
            });

        if (result.replayed) {

            res.set(
                "Idempotency-Replayed",
                "true"
            );

        }

        return res
            .status(result.statusCode)
            .json(result.body);

    }
);


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



exports.getThisJob = asyncHandler(async (req, res) => {
    const job = await jobservice.getThisJob(req.params.id);

    // Unassigned workers receive a limited preview.
    if (req.jobPreviewOnly) {
        return res.status(200).json({
            success: true,
            message: "Job preview fetched successfully",
            data: {
                _id: job._id,
                title: job.title,
                description: job.description,
                category: job.category,
                subCategory: job.subCategory,
                status: job.status,
                address: {
                    city: job.address?.city,
                },
                payments: {
                    budget: job.payments?.budget,
                },
                previewOnly: true,
            },
        });
    }

    return res.status(200).json({
        success: true,
        message: "Job fetched successfully",
        data: job,
    });
});

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------AssignJob------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------

exports.AssignJob=asyncHandler(async(req,res)=>{

        const job = await jobservice.AssignJob(req.job,req.body.workerid,req.user)

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
        const allowed = [
    "TemporaryFixApproved",
    "InProgress",
    "Reject",
];//"InspectionCompleted"
        if(!allowed.includes(decision)){
            throw new AppError("wrong responce",400);           
        }

         const job = await jobservice.updateStatus(req.job,req.user,decision);

        return res.status(200).json({
            success:true,
            message:`Job moved to ${decision} `,
            data:job
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
        success:true,
        message:"job success fully completed",
        data:job
    })
});