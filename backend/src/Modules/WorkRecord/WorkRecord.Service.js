const workRecord = require("../../models/WorkRecord")
const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const WorkRecord = require("../../models/WorkRecord");
const Review = require("../../models/Review");
const Comment = require("../../models/Comment");

const limit = 20; // for page limit 
exports.allWorkRecords=async(query)=>{
    const page = Number(query.page)||1 // for page limits will be done at bottom
    // filters
    const filter = {
        visibility:     "public",}
        if(query.category){
            filter.category = query.category
        }
        if(query.type){
            filter.type =query.type
        }
        if(query.title){
            filter.title=query.title
        }
        // if (query.workerName) {
        //     filter["worker.name"] = query.workerName;
        // }
        if(query.city){
            filter.city=query.city
        }
        
        const workRecords = await workRecord.find(filter).populate("worker","name").select("title worker.name type category city").skip((page - 1) * limit).limit(limit)
        return workRecords
}

exports.createWorkRecord = async (body, user) => {

    const record = await WorkRecord.create({

        title: body.title,

        description: body.description,

        category: body.category,

        type: body.type,

        city: body.city,
        
        worker: user.id,

        customer: body.customer,

        createdBy: user._id,

        amount: body.amount,

        visibility: body.visibility,

        customerWhatsappNumber:
            body.customerWhatsappNumber,

        engagementType:
            body.engagementType
    });
    return record;
};

exports.getmyWorkRecords=async(user,query)=>{

        const page = Number(query.page)||1
    const filter = {
        visibility:{$in:["public","private"]},}
        if(query.category){
            filter.category = query.category
        }
        if(query.type){
            filter.type =query.type
        }
        if(query.title){
            filter.title=query.title
        }
        if (query.workerName) {
            filter["worker.name"] = query.workerName;
        }
        if(query.city){
            filter.city=query.city
        }

        let jobs;
    if(!user){
       throw new AppError("Unauthorized",403)
        }
    


    if(workRecord.visibility==="private"){
            jobs = await workRecord.find({createdBy:user.id, ...filter})
            .select("title category type city amount visibility customerWhatsappNumber engagementType description worker").skip((page - 1) * limit).limit(limit)
        }
    else if(workRecord.visibility==="public"){
            jobs = await workRecord.find({createdBy:user.id, ...filter})
            .select("title category type city amount visibility customerWhatsappNumber engagementType description worker").skip((page - 1) * limit).limit(limit)
        }
    // else if(user.role==="admin"||user.role=="operator"){
    //         jobs= await workRecord.find(filter)
    // .select("title category type city amount visibility customerWhatsappNumber engagementType description worker").skip((page - 1) * limit).limit(limit)
    
    // }
    return jobs
}

exports.getThisWorkRecord = async (user, id) => {

    const workRecord = await WorkRecord.findById(id);


    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if(workRecord.visibility==="private"){
        throw new AppError("Unauthorized", 403)
    }

    return workRecord;
};

exports.updateWorkRecord= async(id,user,body)=>{
    const workRecord = await WorkRecord.findById(id);
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if (workRecord.engagementType !== "contract") {
    throw new AppError(
        "You can't edit this work record since it is not a contract",
        400
    );
    }
    if (workRecord.worker.toString() !== user._id.toString()) {
    throw new AppError(
        "You are not authorized to delete this work record",
        403
    );
}


    const updatedWorkrecord = await WorkRecord.findByIdAndUpdate({
        
        title: body.title,

        description: body.description,

        category: body.category,

        type: body.type,

        customer: body.customer,

        amount: body.amount,

        visibility: body.visibility,

        customerWhatsappNumber:
            body.customerWhatsappNumber,

    })
    return updatedWorkrecord
}

exports.deleteWorkRecord= async(id,user)=>{
    const workRecord = await WorkRecord.findById(id);
    if (workRecord.worker.toString() !== user._id.toString()) {
    throw new AppError(
        "You are not authorized to delete this work record",
        403
    );
}
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if(!WorkRecord.worker==="user"){
        throw new AppError("you are not authorized to delete this ", 404)
    }
    const deleteWorkrecord = await WorkRecord.findByIdAndDelete(id)
}

exports.review=async(id,user,body)=>{
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    const AddReview = await Review.create({
        workRecord:id,
        reviewedBy:user,
        rating:body.rating,
        review:body.review
    })
    return AddReview
}

exports.updateReview= async(id,user,body)=>{
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if (workRecord.reviewedBy.toString() !== user._id.toString()) {
    throw new AppError(
        "You are not authorized to delete this work record",
        403
    );
}
    const updateReview = await Review.findByIdAndUpdate({
        rating:body.rating,
        review:body.review
    })
    return updateReview
}

exports.AddComment= async(id,user,body)=>{
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    const comment = await Comment.create({
        workRecord:id,
        commentedBy:user._id,
        review:body.review
    })
    return comment
}