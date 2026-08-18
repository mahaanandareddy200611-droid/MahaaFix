const express = require("express")
const Auth = require("../../middleware/Auth")

const WorkrecordRoute = express.Router();

const {allWorkRecords,createWorkRecord,WorkRecordofWorker,getmyWorkRecords,
    getThisWorkRecord,updateWorkRecord,deleteWorkRecord,review,updateReview,AddComment} = require("./WorkRecord.Controller")

WorkrecordRoute.get("/allWorkRecords",allWorkRecords) // all public

WorkrecordRoute.post("/WorkRecord",Auth ,createWorkRecord)//  to create record


WorkrecordRoute.get("/work-records",Auth,WorkRecordofWorker)// to just to see title 
WorkrecordRoute.get("/work-records/my",Auth,getmyWorkRecords)// to see my work records created by me 
WorkrecordRoute.get("/work-records/:id",getThisWorkRecord)// to see full details of work records
WorkrecordRoute.patch("/work-records/:id",Auth,updateWorkRecord)// to update work record
WorkrecordRoute.delete("/work-records/:id",Auth,deleteWorkRecord)// to delete that perticular record
WorkrecordRoute.post("/work-records/:id/review",Auth,review)// to rewive
WorkrecordRoute.patch("/work-records/:id/review/update",Auth,updateReview)// to update rewive
WorkrecordRoute.post("/work-records/:id/comment",Auth,AddComment) // to comment

module.exports = WorkrecordRoute