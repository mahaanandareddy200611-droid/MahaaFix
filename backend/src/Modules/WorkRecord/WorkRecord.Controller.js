const asyncHandler = require("../../middleware/asyncHandler");
const WorkRecordService = require("./WorkRecord.Service")

// GET ALL
exports.allWorkRecords= asyncHandler(async (req,res) => {
    const WorkRecord = await(WorkRecordService.allWorkRecords(req.query)) // query is for filter

    return res.status(200).json({   
        success:true,
        data:WorkRecord,
        message:"successfully , workRecords are Available",
    })
})

// CREATE
exports.createWorkRecord= asyncHandler(async (req,res) => {

    const postWorkRecord = await(WorkRecordService.createWorkRecordService(req.body,req.user,idempotencyKey))
    // console.log("BODY:", req.body);
    // console.log("AUTH USER:", req.user);
    // console.log("IDEMPOTENCY KEY:", idempotencyKey);
    return res.status(201).json({
        success:true,
        data:postWorkRecord,
        message:"successfully , workRecord created",
    })
})

exports.getmyWorkRecords= asyncHandler(async (req,res) => {
    const getmyWorkRecord = await(WorkRecordService.WorkRecord(req.user,req.query)) 
    return res.status(200).json({
        success:true,
        data:getmyWorkRecord,
        message:"successfully , workRecords are Available",
    })
})

exports.WorkRecordofWorker = asyncHandler(async (req,res) => {
    const getWorkRecord = await(WorkRecordService.getWorkRecord(req.user,req.query))  
    return res.status(200).json({
        success:true,
        data:getWorkRecord,
        message:"successfully , workRecords are Available",
    })
})

exports.getThisWorkRecord=asyncHandler(async(req,res)=>{
    const getThisWorkRecord = await (WorkRecordService.getThisWorkRecord(req.user||null,req.params.id))

    return res.status(200).json({
        success:true,
        data:getThisWorkRecord,
        message:"successfully , workRecord is Available"
    })
})

exports.updateWorkRecord = asyncHandler(async(req,res)=>{
    const updateWorkRecord = await (WorkRecordService.updateWorkRecord(req.params.id,req.user,req.body))

    return res.status(200).json({
        success:true,
        data:updateWorkRecord,
        message:"successfully , workRecord is Updated"
    })   
})

exports.deleteWorkRecord=asyncHandler(async(req,res)=>{
    const deleteWorkRecord = await (WorkRecordService.deleteWorkRecord(req.params.id,req.user))
    return res.status(200).json({
        success:true,
        data:deleteWorkRecord,
        message:"successfully , deleted workRecord"
    }) 
})

exports.review= asyncHandler(async(req,res)=>{
    const review = await (WorkRecordService.review(req.body,req.user,req.params.id))
    return res.status(200).json({
        success:true,
        data:review,
        message:"successfully , added a rewive"
    }) 
})

exports.updateReview= asyncHandler(async(req,res)=>{
    const updaterewive=await(WorkRecordService.updateReview(req.body,req.user,req.params.id))
    return res.status(200).json({
        sucess:true,
        data:updaterewive,
        message:"successfully , updated a rewive"
    }) 
})
exports.AddComment= asyncHandler(async(req,res)=>{
    const comment = await (WorkRecordService.AddComment(req.params.id,req.user,req.body))
    return res.status(200).json({
        success:true,
        data:comment,
        message:"Added comment successfully"
    })
})