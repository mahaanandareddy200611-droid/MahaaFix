const mongoose = require("mongoose")
//====================================================================================================================================================================
//         comment
//============================================================================================================================================================
const commentSchema = new mongoose.Schema({
    workRecord:{
        type:mongoose.Schema.ObjectId,
        ref:"WorkRecord",
        required:true,
        index:true,
    },
    commentedBy:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    comment:{
        type:String,
        required:true,
        trim:true,
        maxlength:1000,
    },


},{timestamps:true})

const Comment = mongoose.model("Comment",commentSchema);
module.exports=Comment;
