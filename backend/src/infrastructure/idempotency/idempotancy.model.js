const mongoose = require("mongoose")

const idempotancySchema = new mongoose.Schema({
    idempotancyKey:{
        type:String,
        trim:true,
        maxlength:true,
        required:true,
    },
    userId:{
        type:mongoose.Schema.ObjectId,
        ref:"user",
        required:true,
    },
    endPoint:{
        type:String,
        required:true,
        trim:true,
        maxlength:200,
    },},

    {timestamps:true,}

)

idempotancySchema.index({
    userId:1,
    endPoint:1,
    idempotancyKey:1,
},{
    unique:true,
})
// db deleting after  48 hours automatically from created time
idempotancySchema.index(
    {
        createdAt:1,
    },{
        expireAfterSeconds:48*60*60,
    },
)

module.exports = mongoose.model("Idempotancy",idempotancySchema)