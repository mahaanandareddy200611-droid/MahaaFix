const workRecord = require("../../models/WorkRecord")
const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const WorkRecord = require("../../models/WorkRecord");
const Review = require("../../models/Review");
const Comment = require("../../models/Comment");
const OutBoxEvent = require("../../models/OutBox")
const mongoose = require("mongoose");

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
        
        const workRecords = await WorkRecord.find(filter).populate("worker","name").select("title worker.name type category city").skip((page - 1) * limit).limit(limit)
        return workRecords
}



exports.createWorkRecordService = async (body, user,idempotencyKey) => {
    const session = await mongoose.startSession()
    try{
    let createdRecord; // to return easily

    await session.withTransaction(async()=>{    // withTransation promise that create both workrecord and outBox
        const records = await WorkRecord.create([{

            title: body.title,

            description: body.description,

            category: body.category,

            idempotencyKey:idempotencyKey,

            type: body.type,

            city: body.city,
        
            worker: user.id,

            customer: body.customer,

            amount: body.amount,

            visibility: body.visibility,

            customerWhatsappNumber:
                body.customerWhatsappNumber,

            engagementType:
                body.engagementType,
        }],
        {session}
        );
        createdRecord = records[0]; // keeping record into createdRecords 

        await OutBoxEvent.create([{  // outbox Event 
            type:"Job_Recorded",
            AggregateType:"WorkRecord",
            AggregateId:createdRecord.id,
        playload:{jobId:createdRecord.id},
        status:"PENDING"

    }],
    {session}
    )
    
    })
    
    await User.updateOne(
        {_id:id},
        {$inc:{WorkRecordsCount:1}},
        {session}
    );

    return createdRecord

    }catch(error){
        if(error.code === 11000){  // for idempotancy mean for duplicates 
            const existingJob = await WorkRecord.findOne({worker:user.id , idempotencyKey:idempotencyKey})
            return(existingJob)
        }
    throw error;
        }finally{
            await session.endSession()  // is session ends then only it will have Workrecord and outbox
        }
};



exports.getWorkRecord = async (user, query) => {
    if (!user) {
        throw new AppError("Unauthorized", 401);
    }

    const page = Number(query.page) || 1;

    const filter = {
        worker: user.id,
        visibility: { $in: ["public", "private"] }
    };

    // Filters
    if (query.category) {
        filter.category = query.category;
    }

    if (query.type) {
        filter.type = query.type;
    }

    if (query.title) {
        filter.title = { $regex: query.title, $options: "i" };
    }

    if (query.city) {
        filter.city = { $regex: query.city, $options: "i" };
    }

    const workRecords = await WorkRecord.find(filter)
        .select(
            "title category type city amount visibility customerWhatsappNumber engagementType description worker"
        )
        .populate("worker", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return workRecords;
};


exports.getWorkRecord = async (user, query) => {
    if (!user) {
        throw new AppError("Unauthorized", 401);
    }

    const page = Number(query.page) || 1;

    const filter = {
        worker: user.id
    };

    if (query.category) {
        filter.category = query.category;
    }

    if (query.type) {
        filter.type = query.type;
    }

    if (query.title) {
        filter.title = { $regex: query.title, $options: "i" };
    }

    if (query.city) {
        filter.city = { $regex: query.city, $options: "i" };
    }

    const records = await WorkRecord.find(filter)
        .select(
            "title category type city amount visibility customerWhatsappNumber engagementType description worker"
        )
        .populate("worker", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return records;
};

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
    if(!user){
        throw new AppError("Unauthorized", 401)
    }
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
    if (workRecord.worker.toString() !== user.id.toString()) {
    throw new AppError(
        "You are not authorized to update this work record",
        403
    );
}


    const updateData = {
        title: body.title,
        description: body.description,
        category: body.category,
        type: body.type,
        customer: body.customer,
        amount: body.amount,
        visibility: body.visibility,
        customerWhatsappNumber: body.customerWhatsappNumber,
        engagementType: body.engagementType
    };

    const updatedWorkRecord = await WorkRecord.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    );

    return updatedWorkRecord;
};

exports.deleteWorkRecord= async(id,user)=>{
    const workRecord = await WorkRecord.findById(id);
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if (workRecord.worker.toString() !== user.id.toString()) {
    throw new AppError(
        "You are not authorized to delete this work record",
        403
    );
}

    const deleteWorkrecord = await WorkRecord.findByIdAndDelete(id)
    return deleteWorkrecord
}

exports.review=async(body,user,id)=>{
    const workRecord = await WorkRecord.findById(id);

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

exports.updateReview= async(body,user,id)=>{
    if (!WorkRecord) {
        throw new AppError("Work record not found", 404);
    }
    if (WorkRecord.reviewedBy.toString() !== user.id.toString()) {
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
    const workRecord = await WorkRecord.findById(id);

    if (!WorkRecord) {
        throw new AppError("Work record not found", 404);
    }
    const comment = await Comment.create({
        workRecord:id,
        commentedBy:user.id,
        comment:body.comment
    })
    return comment
}
