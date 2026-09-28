const Job = require("../../models/job");
const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const workflow = require("../../utils/workflow")


// ========================================================================================================================================
//                                                 create jobs
// =====================================================================================================================================

exports.createJobs=async(data,user)=>{

    const {beforeMedia,budget,paymentStatus,...jobData} = data; // we are extracted those from data beforePhotos,, videos budget
    const NewJob = await Job.create({
        ...jobData,
       status:"Created",
        customer:{
            userid:user.id,
            name:user.name,
            mobileNumber:user.mobileNumber
                },
        visualProofs: {
            beforeMedia: beforeMedia || [],
            // beforeVideos: beforeVideos || []
            },
        payments: {
            budget: budget,
            paymentStatus: paymentStatus || "Pending"
            }
    })
    // await NewJob.save();  no save required because create only saves 
    return NewJob

}

// ========================================================================================================================================
//                                                my jobs  self created or done
// =====================================================================================================================================

exports.myJobs=async(user,query)=>{
    const page = Number(query.page)||0
    const filter = {
        status :{$in:["Created","Verified"]}
    }
    if(query.category){
        filter.category=query.category
    }
    if(query.subCategory){
        filter.subCategory = query.subCategory
    }
    if(query.city){
        filter["address.city"] = query.city;    }

        let jobs;

    if(user.role === "worker"){
            jobs = await Job.find({"worker.workerid":user.id,...filter}).select("title category subCategory address.city address.street").limit(20).skip(page*10)
        }
    else if (user.role==="customer") {
            jobs = await Job.find({"customer.userid":user.id,...filter}).select("title category subCategory address.city").limit(20).skip(page*10)
            
        }
    else if(user.role==="admin"||user.role=="operator"){
            jobs= await Job.find(filter).select("title category subCategory address.city address.street userid workerid").limit(20).skip(page*10)
        }
    

    return jobs
}


// ========================================================================================================================================
//                                                 get Jobs   which are avilable to get done 
// =====================================================================================================================================

exports.getJobs=async(query)=>{
    const page = Number(query.page)||0
    const filter = {
        status :"Created"
    }
    if(query.category){
        filter.category=query.category
    }
    if(query.subCategory){
        filter.subCategory = query.subCategory
    }
    if(query.city){
        filter["address.city"] = query.city
    }
    const jobs = await Job.find(filter).select("title category subCategory address.city address.street").limit(20).skip( page *20)

    return jobs

}

// ========================================================================================================================================
//                                                 get details of a perticular job
// =====================================================================================================================================

exports.getThisJob = async(id)=>{

    const job = await Job.findById(id)

    if(!job){throw new AppError(
            "Job not found",404
        );

}

    return job
}
// ========================================================================================================================================
//                                                 AssignJob
// =====================================================================================================================================

exports.AssignJob = async (job, workerId) => {
    const worker = await User.findOne({
        _id: workerId,
        role: "worker"
    }).select("_id name mobileNumber isOnline");

    if (!worker) {
        throw new AppError("Worker not found", 404);
    }

    if (!worker.isOnline) {
        throw new AppError("Worker is currently offline", 409);
    }

    const updatedJob = await Job.findOneAndUpdate(
        {
            _id: job.id,
            status: "Created"
        },
        {
            $set: {
                worker: {
                    workerid: worker.id,
                    name: worker.name,
                    mobileNumber: worker.mobileNumber
                },
                status: "Assigned"
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedJob) {
        throw new AppError(
            "Job is no longer available for assignment",
            409
        );
    }

    return updatedJob;
};

// =================================================================================================================================
//                                                      Rejected job
// =================================================================================================================================
exports.RejectJob = async(job,user)=>{
    
    const worker = await User.findById(user.id);
    
    if(!worker || worker.role !=="worker"){
        throw new AppError("worker not found",400);    
        }
    if(job.worker?.workerid?.toString()!== user.id.toString()){
        throw new AppError("This job is not Assigned to you",403)
    }

    const updatedJob = await Job.findOneAndUpdate({
        _id:job.id,
        status:"Assigned",
        "worker.workerid":user.id
    },{
        $set:{
            worker:null,
            status:"Created"
        }
    },{
        new:true,
        runValidators: true
    })
    if(!updatedJob){
        throw new AppError( "Job is no longer assigned to this worker",409)
    }
    // job.worker=null
    // job.status="Created"
    // await job.save()
    return updatedJob
}


// ========================================================================================================================================
//                                                 Accepted the job
// =====================================================================================================================================

exports.Accepted = async(job,user)=>{

    
    if(!job.worker?.workerid||job.worker.workerid.toString() !==user.id){ 
         // this search for worker? workerid if found it stops dubilicate accepts
            throw new AppError("this was not assigned to you",403)
        }
    const updateJob = await Job.findOneAndUpdate(
        {
            _id:job.id,
            status:"Assigned",
            "worker.workerid": user.id
        },{
            $set:{
                worker:{
                    workerid:user.id,
                    name:user.name,
                    mobileNumber:user.mobileNumber
                },
                status:"WorkerAccepted"
                
            }
        },{
            new: true,
            runValidators: true
        }
    )
        // job.worker={
        //     workerid:user.id,
        //     name:user.name,
        //     mobileNumber:user.mobileNumber
        // }

        // job.status = "WorkerAccepted"

        // await job.save()
        if(!updateJob){
            throw new AppError("job has alreadyy been assigned ")
        }

        return updateJob
}

// ========================================================================================================================================
//                                                 Update the Job Status
// =====================================================================================================================================

exports.updateStatus = async(job,user,newStatus)=>{
        

        const currentStatus = job.status;

        const currentWorkflow = workflow[currentStatus];

        if (!currentWorkflow) {
            throw new AppError(
            "Invalid workflow state",
            400
        );
        }

        if (!currentWorkflow.next.includes(newStatus)) {
            throw new AppError(
            `Cannot move from ${currentStatus} to ${newStatus}`,
            400
        );
        }

        const allowedActors = currentWorkflow.actor;

        const userRole = user.role;

        if (!allowedActors.includes(userRole)) {
            throw new AppError(
            `Only ${allowedActors.join(", ")} can update this status`,
            403
        );
        }

        const updatedJob = await Job.findOneAndUpdate(
        {
        _id: job.id,
        status: currentStatus
        },
        {
        $set: {
            status: newStatus
        }
        },
        {
        new: true,
        runValidators: true
        }
        );
        if(!updatedJob){
            throw new AppError ("status of job was not updated, try again ",409)
        }

        return updatedJob;
}

// ========================================================================================================================================
//                                                    Estimate cost of the job
// =====================================================================================================================================

exports.EstimateSubmitted = async (job, user, budget, actualProblem) => {
    if (budget === undefined || budget === null || budget <= 0) {
        throw new AppError("Valid budget is required", 400);
    }

    if (!actualProblem || !actualProblem.trim()) {
        throw new AppError("Actual problem is required", 400);
    }

    const updatedJob = await Job.findOneAndUpdate(
        {
            _id: job.id,
            status: "Checking",
            "worker.workerid": user.id
        },
        {
            $set: {
                EstimateSubmitted: {
                    budget,
                    actualProblem: actualProblem.trim()
                },
                status: "WaitingCustomerApproval"
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedJob) {
        throw new AppError(
            "Estimate cannot be submitted because the job is no longer in Checking status",
            409
        );
    }

    return updatedJob;
};

// ========================================================================================================================================
//                                                 Work completed
// =====================================================================================================================================

exports.WorkCompleted = async (job, user, afterMedia) => {
    if (!Array.isArray(afterMedia) || afterMedia.length === 0) {
        throw new AppError(
            "At least one after-work media item is required",
            400
        );
    }

    const updatedJob = await Job.findOneAndUpdate(
        {
            _id: job.id,
            status: "InProgress",
            "worker.workerid": user.id
        },
        {
            $set: {
                "visualProofs.afterMedia": afterMedia,
                status: "WorkCompleted"
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedJob) {
        throw new AppError(
            "Job is no longer available for completion",
            409
        );
    }

    return updatedJob;
};

// ========================================================================================================================================
//                                                 re work required
// =====================================================================================================================================
exports.ReworkRequired = async (job, user, reworkProof) => {
    if (!reworkProof || !reworkProof.trim()) {
        throw new AppError(
            "Rework proof is required",
            400
        );
    }

    const updatedJob = await Job.findOneAndUpdate(
    {
        _id: job.id,
        status: "WorkCompleted",
        "customer.userid": user.id
    },
    {
        $set: {
            rework: {
                proofMedia: reworkProof,
                requestedBy: user.id,
                requestedAt: new Date()
            },
            status: "ReworkRequired"
        }
    },
    {
        new: true,
        runValidators: true
    }
);
    if (!updatedJob) {
        throw new AppError(
            "Rework cannot be requested because the job is no longer awaiting verification",
            409
        );
    }
    return updatedJob;
};