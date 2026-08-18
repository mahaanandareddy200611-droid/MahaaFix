const mongoose = require("mongoose")

//=================================================================================================================================================
//  Rewive
//=================================================================================================================================================
const reviewSchema = new mongoose.Schema({
    WorkRecord:{
        type:mongoose.Schema.ObjectId,
        ref:"WorkRecord",
        required:true,
        index:true
    },
    reviewedBy:{
        type:mongoose.Schema.ObjectId,
        ref:"User", // actually in work record there is a whatsapp nubmer those can rewive acually he was the customer
        required:true,
        index:true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review:{
        type:String,
        required:true,
        trim:true,
        maxlength:1000
    }
},{timestamps:true})
reviewSchema.index(
    {
        workRecord: 1,
        reviewedBy: 1
    },
    {
        unique: true
    }
);
const Review = mongoose.model("Review",reviewSchema)

module.exports = Review