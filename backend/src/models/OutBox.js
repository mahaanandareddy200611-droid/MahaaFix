const mongoose = require("mongoose")

const OutBoxSchema = new mongoose.Schema({
    type:{
        type:String,
        required:true
    },
    AggregateType:{
        type:String,
        required:true,
    },
    AggregateId:{
        type:String,
        required:true
    },
    playload:{
        type:mongoose.Schema.Types.Mixed,
        required:true,
    },
    status:{
        type:String,
        enum:["Pending","Processing","Completed","Failed"],
        default:"Pending"
    },
    attempts:{
        type:Number,
        default:0
    },
    processedAt:{
        type:Date,
        default:null
    },
    lastError:{
        type:String,
        default:null
    }
},{timestamps:true})

const OutBox = mongoose.model("OutBox",OutBoxSchema)
module.exports=OutBox