const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const WorkRecord = require("../../models/WorkRecord");
const Review = require("../../models/Review");
const Comment = require("../../models/Comment");
const OutBoxEvent = require("../../models/OutBox")
const mongoose = require("mongoose");
const withTransaction = require("./../../infrastructure/transactions/transaction")
const outboxEvent = require("../../infrastructure/outbox/outbox.service")


// =============================================================================================================
//                                          get all workrecords 
//==============================================================================================================


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

//=====================================================================================================================
//                                    create work record
//======================================================================================================================

exports.createWorkRecordService = async (body, user,idempotencyKey) => {
    

    return withTransaction(async(session)=>{    // withTransation promise that create both workrecord and outBox
        const [records] = await WorkRecord.create([{

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

        const updateUser = await User.updateOne([
        {_id:user.id},
        {$inc:{WorkRecordsCount:1}},
        {
            session,
        }
    ]
        );
        if(!updateUser){
            throw new AppError("Authentication user no longer exists",404)
        }
        if (updateUser.matchedCount === 0) {
    throw new AppError(
        "Authenticated user no longer exists",
        404
    );
    }


         await outboxEvent({
            session,

            eventType: "WORK_RECORD_CREATED",

            aggregateType: "WorkRecord",

            aggregateId: records._id,

            payload: {
                workRecordId:
                    records._id.toString(),

                workerId:
                    user.id.toString(),

                customerId:
                    body.customer?body.customer.toString():null
            }
        });

    
    return records

     //}catch(error){
    //     if(error.code === 11000){  // for idempotancy mean for duplicates 
    //         const existingJob = await WorkRecord.findOne({worker:user.id , idempotencyKey:idempotencyKey})
    //         return(existingJob)
    //     }
    // throw error;
    
    // no needed this because  we are using alredy idempotancy middle ware 
    
    })
};

//===============================================================================================================
//                                           getting his own workrecords
//================================================================================================

exports.getmyWorkRecord = async (user, query) => {
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
        filter.title = { $regex: query.title, $options: "i" }; // $regex :used to match string values 
    }

    if (query.city) {
        filter.city = { $regex: query.city, $options: "i" }; // $options search case-insensitive
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

//=======================================================================================================================
//                                         get work record about some perticular  with Auth only
//=======================================================================================================================

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

// =======================================================================================================================
//                                                     get records about a perticular job details
//========================================================================================================================

exports.getThisWorkRecord = async (user, id) => {

    if(!user){
        throw new AppError("Unauthorized",401)
    }

    const workRecord = await WorkRecord.findById(id);


    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if(workRecord.visibility==="private"){
        const isOwner = workRecord.worker && 
        workRecord.worker.toString() === user.id.toString()

        const isCustomer = workRecord.customer && 
        workRecord.customer.toString() === user.id.toString()

        const isAdmin = user.role === "admin" || user.role === "operator";

        if(!isOwner&& !isAdmin && !isCustomer){
        throw new AppError("Unauthorized", 403)
    }}

    return workRecord;
};

//========================================================================================================================
//                                   Update the Workrecord 
//==========================================================================================================================

exports.updateWorkRecord= async(id,user,body)=>{
    if(!user){
        throw new AppError("Unauthorized", 401)
    }
    const workRecord = await WorkRecord.findById(id);
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    if (workRecord.worker.toString() !== user.id.toString()) {
    throw new AppError(
        "You are not authorized to update this work record",
        403
    );
    }
    if (workRecord.engagementType !== "contract") {
    throw new AppError(
        "You can't edit this work record since it is not a contract",
        400
    );
    }
    

 const updateData = {};

    if (body.title !== undefined) {
        updateData.title = body.title;
    }

    if (body.description !== undefined) {
        updateData.description = body.description;
    }

    if (body.category !== undefined) {
        updateData.category = body.category;
    }

    if (body.type !== undefined) {
        updateData.type = body.type;
    }

    if (body.customer !== undefined) {
        updateData.customer = body.customer;
    }

    if (body.amount !== undefined) {
        updateData.amount = body.amount;
    }

    if (body.visibility !== undefined) {
        updateData.visibility = body.visibility;
    }

    if (body.customerWhatsappNumber !== undefined) {
        updateData.customerWhatsappNumber =
            body.customerWhatsappNumber;
    }

    const updatedWorkRecord =
        await WorkRecord.findOneAndUpdate(
            {
                _id: id,
                worker: user.id,
                engagementType: "contract"
            },
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
            }
        );

    if (!updatedWorkRecord) {
        throw new AppError(
            "Work record could not be updated",
            409
        );
    }

    return updatedWorkRecord;
};

//==============================================================================================================
//                      delete WorkRecord
//===============================================================================================================

exports.deleteWorkRecord= async(id,user)=>{
    if(!user){
        throw new AppError("Unauthorized ", 401)
    }
    const workRecord =
        await WorkRecord.findOneAndDelete({
            _id: id,
            worker: user.id
        },{$inc:{WorkRecordsCount:-1}});

    if (!workRecord) {
        throw new AppError(
            "Work record not found or you are not authorized",
            404
        );
    }

    return workRecord;
};

//=========================================================================================================================
//                                   Review 
//=========================================================================================================================

exports.review=async(body,user,id)=>{
    if(!user){
        throw new AppError("Unauthorized",401)
    }
    const workRecord = await WorkRecord.findById(id);

    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    return withTransaction(async (session) => {

    const review =
        await Review.create(
            [{
                workRecord: id,
                reviewedBy: user.id,
                rating: body.rating,
                review: body.review
            }],
            { session }
        );

    await outboxEvent({
        session,
        eventType: "REVIEW_CREATED",
        aggregateType: "Review",
        aggregateId: review._id,
        payload: {
            reviewId: review._id.toString(),
            workRecordId: id.toString(),
            reviewedBy: user.id.toString(),
            rating: body.rating
        }
    });

    return review;
});
}

//=========================================================================================================================
//                                   update the review
//==========================================================================================================================

exports.updateReview= async(body,user,id)=>{
    if(!user){
        throw new AppError("Unauthorized",401)
    }
    const workRecord = await WorkRecord.findById(id)
    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }


    const existingReview =
        await Review.findOne({
            workRecord: id,
            reviewedBy: user.id
        });

    if (!existingReview) {
        throw new AppError(
            "Review not found",
            404
        );
    }

    const updateData = {};

    if (body.rating !== undefined) {
        updateData.rating = body.rating;
    }

    if (body.review !== undefined) {
        updateData.review = body.review;
    }

    const updatedReview =
        await Review.findOneAndUpdate(
            {
                _id: existingReview._id,
                reviewedBy: user.id
            },
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
            }
        );

    return updatedReview;
};

//=========================================================================================================
//                          Comment
//==================================================================================================

exports.AddComment= async(id,user,body)=>{
    if(!user){
        throw new AppError("Unouthorized ",401)
    }
    const workRecord = await WorkRecord.findById(id);

    if (!workRecord) {
        throw new AppError("Work record not found", 404);
    }
    return withTransaction(async (session) => {

    const comment =
        await Comment.create(
            [{
                workRecord: id,
                commentedBy: user.id,
                comment: body.comment
            }],
            { session }
        );

    await outboxEvent({
        session,
        eventType: "COMMENT_CREATED",
        aggregateType: "Comment",
        aggregateId: comment._id,
        payload: {
            commentId:
                comment._id.toString(),

            workRecordId:
                id.toString(),

            commentedBy:
                user.id.toString()
        }
    });

    return comment;
});
}
