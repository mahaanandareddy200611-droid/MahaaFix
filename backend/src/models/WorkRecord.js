const mongoose = require("mongoose");

const WorkRecordSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index:true,
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        
    },
    customerName:{
        type:String,
        trim:true,
    },
    // createdBy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true
    // },

    customerWhatsappNumber:{
        type:String,
        trim:true,
    },
    city:{
        type:String,
        required:[true,"City is needed"],
        trim:true,
    },
    
    engagementType: {
        type: String,
        enum: ["work", "contract"],
        default:"work",
        required: [true, "Work type is required"]
    },
    title:{
        type:String,
        required:[true,"Title needed"],
        maxlength:100,
        trim: true
    },
    type:{
        type:String,
        enum:["installation",
        "repair",
        "maintenance",
        "replacement",
        "inspection",
        "service","New"],
        required:[true,"type required  "]
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        minlength: [25, "Description must be at least 25 characters"],
        trim: true
    },
    category:{
        type:String,
        required:[true,"category required"],
        trim:true
    },
    Media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media"
    }],
    amount:{
        type:Number,
        required:true,
        min:0
    },
    visibility:{
        type:String,
        enum:["private","public"],
        default:"public",
        required:true,
    },
    // invoice: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Invoice"
    // },

    status: {
            type: String,
            enum: [
                "draft",
                "processing",
                "readyForReview",
                "confirmed",
                "completed",
                "archived"
            ],
            default: "draft"
        }
},{timestamps:true})

/*
 * Worker dashboard:
 *
 * worker + newest records
 */
WorkRecordSchema.index({
    worker: 1,
    createdAt: -1
});


/*
 * Public WorkRecord listing:
 *
 * visibility + newest records
 */
WorkRecordSchema.index({
    visibility: 1,
    createdAt: -1
});


const WorkRecord = mongoose.model(
    "WorkRecord",
    WorkRecordSchema
);

module.exports = WorkRecord;
