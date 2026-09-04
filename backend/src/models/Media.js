const { required } = require("joi")
const mongoose = require("mongoose")
const User = require("./User")

const MediaSchema = new mongoose.Schema({
    uploadedBy:{
        type:mongoose.Schema.ObjectId,
        ref:User,
        required:true
    },
    type:{
        type:String,
        enum:["text","image","pdf","video","voice"],
        required:true
    },
    orginalName:{
        type:String,  //  photo.jpg  like this.........
        required:true,
        trim:true,
    },
    mimeType:{ // .mp4 , jpg etc.... all
        type:String,
        required:true,
    },
    url:{
        type:String,
        required:true,
    },
    publicId:{
        type:String,
        required:true,
    },
    size:{
        type:Number,  //  mb gb 
        required:true
    },
    status: {
    type: String,
    enum: ["draft","processing","readyForReview","confirmed","completed","archived"],
    default: "draft",
    },
},{timestamps:true}
)

const Media = mongoose.model("Media",MediaSchema)

module.exports = Media
// WHO uploaded it
// WHAT it is
// WHAT the original file was called
// WHAT MIME type it has
// HOW large it is
// WHERE Cloudinary stores it
// Cloudinary public ID
// Cloudinary resource type
// processing status