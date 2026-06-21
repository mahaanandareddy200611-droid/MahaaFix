const Job = require("../models/job");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const workflow = require("../utils/workflow")

exports.createJobs=async(data,user)=>{

    const {beforePhotos,beforeVideos,budget,paymentStatus,...jobData} = data; // we are extracted those from data beforePhotos,, videos budget
    const NewJob = await Job.create({
        ...jobData,
       
        customer:{
            userid:user.id,
            name:user.name,
            mobileNumber:user.mobileNumber
                },
        visualProofs: {
            beforePhotos: beforePhotos || [],
            beforeVideos: beforeVideos || []
            },
        payments: {
            budget: budget,
            paymentStatus: paymentStatus || "Pending"
            }
    })
    // await NewJob.save();  no save required because create only saves 
    return NewJob

}

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
            jobs = await Job.find({"worker.workerid":user.id,...filter}).select("title category subCategory address.city address.street")
        }
    else if (user.role==="customer") {
            jobs = await Job.find({"customer.userid":user.id,...filter}).select("title category subCategory address.city")
            
        }
    else if(user.role==="admin"||user.role=="operator"){
            jobs= await Job.find(filter).select("title category subCategory address.city address.street")
        }
    

    return jobs
}

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

exports.getThisJob = async(id)=>{

    const job = await Job.findById(id)

    return job
}

exports.AssignJob = async(job,workerid)=>{
    
    const worker = await User.findById(workerid);
    
    if(!worker || worker.role !=="worker"){
        throw new AppError("worker not found",400);
            
        }
    job.worker={  // worker details 
        workerid:worker._id,
        name:worker.name,
        mobileNumber:worker.mobileNumber
        }

    job.status="Assigned"
    await job.save()
    return job
}

exports.Accepted = async(job,user)=>{

    if(job.status!== "Assigned"){
            throw new AppError("this was not assigned ",403)
            
    }
    if(!job.worker?.workerid||job.worker.workerid.toString() !==user.id){  // this search for worker? workerid if found it stops dubilicate accepts
            throw new AppError("this was not assigned to you",403)
        }
        job.worker={
            workerid:user.id,
            name:user.name,
            mobileNumber:user.mobileNumber
        }

        job.status = "WorkerAccepted"

        await job.save()

        return job
}

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

        job.status = newStatus;

        await job.save();
        return job;
}

exports.EstimateSubmitted = async(job,user,budget,actualProblem)=>{

        if(!budget || !actualProblem){
            throw new AppError("Budget and actual problem are required");
        }

        job.EstimateSubmitted={
            budget,actualProblem
        }

        job.status="WaitingCustomerApproval"
        await job.save()
        return job;
}

exports.WorkCompleted = async(job,user,afterPhotos,afterVideos)=>{

    if(!afterPhotos?.length && !afterVideos?.length){
        throw new AppError("At least one photo or video is required",400);
        
    }

    job.visualProofs.afterPhotos = afterPhotos || []
    job.visualProofs.afterVideos= afterVideos || []

    await job.save();

    return job;

}
exports.ReworkRequired = async(job,user,reworkProof)=>{

    

    job.ReworkRequired.proof = reworkProof;

    await job.save();

    return job;
}