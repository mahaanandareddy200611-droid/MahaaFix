const Job = require("../../models/job");
const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const workflow = require("../../utils/workflow")
const {withTransaction }= require("../../infrastructure/transactions/transaction");
const outboxEvent = require("../../infrastructure/outbox/outbox.service");
const Media = require("../../models/Media");
const {
    WORKER_HEARTBEAT_TTL_MS,
} = require("../../config/presence");

// ========================================================================================================================================
//                                                 create jobs
// =====================================================================================================================================

exports.createJobs=async(data,user,session
) => {

    if (!session) {
        throw new AppError(
            "Job creation requires an active transaction",
            500
        );
    }
    
    const {beforeMedia,budget,paymentStatus,...jobData} = data; // we are extracted those from data beforePhotos,, videos budget
    

if (user.role !== "customer") {
    throw new AppError(
        "Only customers can create jobs",
        403
    );
}

if (!Array.isArray(beforeMedia)) {
    throw new AppError(
        "Before-media must be an array",
        400
    );
}

const normalizedBeforeMedia = [
    ...new Set(beforeMedia.map(String)),
];

if (normalizedBeforeMedia.length > 0) {
    const uploadedMedia = await Media.find({
        _id: { $in: normalizedBeforeMedia },
        uploadedBy: user.id,
        type: "image",
        status: "completed",
    })
        .select("_id")
        .session(session);

    if (uploadedMedia.length !== normalizedBeforeMedia.length) {
        throw new AppError(
            "Every attached photo must be a completed image uploaded by you",
            400
        );
    }
}

    const [NewJob] = await Job.create([{
        ...jobData,
       status:"Created",
        customer:{
            userid:user.id,
            name:user.name,
            mobileNumber:user.mobileNumber
                },
        visualProofs: {
            beforeMedia: normalizedBeforeMedia,
            // beforeVideos: beforeVideos || []
            },
        payments: {
            budget: budget,
            paymentStatus: paymentStatus || "Pending"
            }
    }],{
        session
    }
    )
    await outboxEvent({
        session,
        eventType:"JOB_CREATED",

        aggregateType:"Job",

        aggregateId: NewJob._id,

        payload:{
            jobId: NewJob._id.toString(),
            customerId: user.id.toString(),
            category:NewJob.category,
            city:NewJob.address?.city,
            address:NewJob.address
        }
    })
    // await NewJob.save();  no save required because create only saves 
    return NewJob
}


// ========================================================================================================================================
//                                                my jobs  self created or done
// =====================================================================================================================================

exports.myJobs = async (user, query = {}) => {
    if (!user) {
        throw new AppError("Unauthorized", 401);
    }

    const roles = ["customer", "worker", "admin", "operator"];
    const role = String(user.role || "").toLowerCase();

    if (!roles.includes(role)) {
        throw new AppError("Access denied", 403);
    }

    const requestedPage = Number.parseInt(query.page, 10);
    const page =
        Number.isInteger(requestedPage) && requestedPage >= 0
            ? requestedPage
            : 0;

    const limit = 20;
    const filter = {};

    // Scope ordinary accounts to their own jobs.
    if (role === "worker") {
        filter["worker.workerid"] = user.id;
    } else if (role === "customer") {
        filter["customer.userid"] = user.id;
    }

    // Admin and operator can inspect jobs across accounts.
    if (query.category) {
        filter.category = query.category;
    }

    if (query.subCategory) {
        filter.subCategory = query.subCategory;
    }

    if (query.status) {
        const allowedStatuses = [
            "Created",
            "Assigned",
            "WorkerAccepted",
            "Checking",
            "EstimateSubmitted",
            "WaitingCustomerApproval",
            "TemporaryFixApproved",
            "InProgress",
            "WorkCompleted",
            "VerificationPending",
            "Verified",
            "ReworkRequired",
            "Reject",
        ];

        if (!allowedStatuses.includes(query.status)) {
            throw new AppError("Invalid job status filter", 400);
        }

        filter.status = query.status;
    }

    if (query.city) {
        const escapedCity = String(query.city)
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        if (escapedCity) {
            filter["address.city"] = {
                $regex: escapedCity,
                $options: "i",
            };
        }
    }

    return Job.find(filter)
        .select(
            "title description category subCategory status address.city address.street customer.userid customer.name worker.workerid worker.name worker.mobileNumber payments.budget createdAt updatedAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean();
};


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


exports.getThisJob = async (id) => {
    const job = await Job.findById(id)
        .populate(
            "visualProofs.beforeMedia",
            "url originalName mimeType size status"
        )
        .populate(
            "visualProofs.afterMedia",
            "url originalName mimeType size status"
        )
        .populate(
            "rework.proofMedia",
            "url originalName mimeType size status"
        );

    if (!job) {
        throw new AppError("Job not found", 404);
    }

    return job;
};
// ========================================================================================================================================
//                                                 AssignJob
// =====================================================================================================================================

exports.AssignJob = async (job, workerId,user) => {

    return withTransaction(async(session)=>{

    const worker = await User.findOne({
    _id: workerId,
    role: "worker",
}).select(
    "_id name mobileNumber isOnline lastHeartbeat"
);

if (!worker) {
    throw new AppError("Worker not found", 404);
}

const cutoff = new Date(
    Date.now() - WORKER_HEARTBEAT_TTL_MS
);

const hasRecentHeartbeat =
    worker.lastHeartbeat &&
    worker.lastHeartbeat >= cutoff;

if (!worker.isOnline || !hasRecentHeartbeat) {
    throw new AppError(
        "Worker is offline or their heartbeat is stale",
        409
    );
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
            runValidators: true,
            session
        }
        
    );

    if (!updatedJob) {
        throw new AppError(
            "Job is no longer available for assignment",
            409
        );
    }

    await outboxEvent({
        session,

        eventType: "JOB_ASSIGNED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus: "Created",

            toStatus: "Assigned",

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:updatedJob.worker?.workerid?.toString(),

        }
    })


    return updatedJob;
    })
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
    return withTransaction(async(session)=>{

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
        runValidators: true,
        session
    }
        
    )
    if(!updatedJob){
        throw new AppError( "Job is no longer assigned to this worker",409)
    }
    // job.worker=null
    // job.status="Created"
    // await job.save()

    
    await outboxEvent({
        session,

        eventType:"JOB_REJECTED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus: "Assigned",

            toStatus: "Created",

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:user.id.toString(),

        }
    })

    return updatedJob
})
}



// ========================================================================================================================================
//                                                 Accepted the job
// =====================================================================================================================================

exports.Accepted = async(job,user)=>{

    
    if(!job.worker?.workerid||job.worker.workerid.toString() !==user.id){ 
         // this search for worker? workerid if found it stops dubilicate accepts
            throw new AppError("this was not assigned to you",403)
        }

    return withTransaction(async(session)=>{
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
            runValidators: true,
        
            session
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


        await outboxEvent({
        session,

        eventType:"JOB_ACCEPTED",

        aggregateType:"Job",

        aggregateId:updateJob._id,

        payload:{
            jobId: updateJob._id.toString(),

            fromStatus:"Assigned",

            toStatus: "WorkerAccepted",

            actorId:user.id.toString(),

            customerId:updateJob.customer?.userid?.toString(),

            workerId:updateJob.worker?.workerid?.toString(),

        }
    })

        return updateJob
        })
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

        return withTransaction(async(session)=>{
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
        runValidators: true,
        session
        }
        );
        if(!updatedJob){
            throw new AppError ("status of job was not updated, try again ",409)
        }

        await outboxEvent({
        session,

        eventType:"JOB_STATUS_UPDATED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus:currentStatus,

            toStatus: newStatus,

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:updatedJob.worker?.workerid?.toString(),

        }
    })

        return updatedJob;
    })
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
    return withTransaction(async(session)=>{
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
            runValidators: true,
            session
        }
    );

    if (!updatedJob) {
        throw new AppError(
            "Estimate cannot be submitted because the job is no longer in Checking status",
            409
        );
    }

    await outboxEvent({
        session,

        eventType:"JOB_ESTIMATE_SUBMITTED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus:"Checking",

            toStatus: "WaitingCustomerApproval",

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:updatedJob.worker?.workerid?.toString(),

        }
    })


    return updatedJob;
})
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
    return withTransaction(async(session)=>{
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
            runValidators: true,
        
            session
        }
    );

    if (!updatedJob) {
        throw new AppError(
            "Job is no longer available for completion",
            409
        );
    }

    await outboxEvent({
        session,

        eventType: "JOB_WORK_COMPLETED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus:"InProgress",

            toStatus: "WorkCompleted",

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:updatedJob.worker?.workerid?.toString(),

        }
    })

    return updatedJob;
})
};

// ========================================================================================================================================
//                                                 re work required
// =====================================================================================================================================
exports.ReworkRequired = async (job, user, reworkProof) => {
    if (!Array.isArray(reworkProof) || reworkProof.length === 0) {
        throw new AppError(
            "At least one rework proof media item is required",
            400
        );
    }
    return withTransaction(async(session)=>{
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
        runValidators: true,
        session
    }
);
    if (!updatedJob) {
        throw new AppError(
            "Rework cannot be requested because the job is no longer awaiting verification",
            409
        );
    }

    await outboxEvent({
        session,

        eventType: "JOB_REWORK_REQUIRED",

        aggregateType:"Job",

        aggregateId:updatedJob._id,

        payload:{
            jobId: updatedJob._id.toString(),

            fromStatus:"WorkCompleted",

            toStatus: "ReworkRequired",

            actorId:user.id.toString(),

            customerId:updatedJob.customer?.userid?.toString(),

            workerId:updatedJob.worker?.workerid?.toString(),

        }
    })

    return updatedJob;
})
};