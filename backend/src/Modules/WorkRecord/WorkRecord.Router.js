const express = require("express")

const Auth = require("../../middleware/Auth")

const validate = require("../../utils/validate")

const WorkrecordRoute = express.Router();

const {allWorkRecords,createWorkRecord,WorkRecordofWorker,getmyWorkRecords,
    getThisWorkRecord,updateWorkRecord,deleteWorkRecord,review,updateReview,AddComment} = require("./WorkRecord.Controller");

const IsWorker = require("../../middleware/isWorker");

const {
    createWorkRecordSchema,
    updateWorkRecordSchema,
    reviewSchema,
    updateReviewSchema,
    commentSchema
} = require("./WorkRecord.Validator");
const idempotancyMiddleware = require("../../infrastructure/idempotency/idempotancy.middleware");

WorkrecordRoute.get("/allWorkRecords",allWorkRecords) // all public

WorkrecordRoute.post("/WorkRecord",Auth, IsWorker,validate(createWorkRecordSchema),idempotancyMiddleware,createWorkRecord)//  to create record

WorkrecordRoute.get("/work-records",Auth,WorkRecordofWorker)// to see my work records created by me 

WorkrecordRoute.get("/work-records/my",Auth,IsWorker,getmyWorkRecords)// to see my work records created by me 

WorkrecordRoute.get("/work-records/:id",Auth,getThisWorkRecord)// to see full details of work records

WorkrecordRoute.patch("/work-records/:id",Auth,IsWorker,validate(updateWorkRecordSchema),idempotancyMiddleware,updateWorkRecord)// to update work record

WorkrecordRoute.delete("/work-records/:id",Auth,IsWorker,idempotancyMiddleware,deleteWorkRecord)// to delete that perticular record

WorkrecordRoute.post("/work-records/:id/review",Auth,validate(reviewSchema),idempotancyMiddleware,review)// to rewive

WorkrecordRoute.patch("/work-records/:id/review/update",Auth,validate(updateReviewSchema),idempotancyMiddleware,updateReview)// to update rewive

WorkrecordRoute.post("/work-records/:id/comment",Auth,validate(commentSchema),idempotancyMiddleware,AddComment) // to comment

module.exports = WorkrecordRoute
