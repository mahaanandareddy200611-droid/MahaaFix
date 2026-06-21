const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "name is required"]
    },
    age:{
        type:Number,
        min:18,
        required:[true,"age must be grater or equal to 18"]
        
        },
    
    email:{
        type:String,
        required:[true,"email required"],
        trim:true,
        lowercase:true,
        unique:true
    },
    password:{
        type:String,
        required:[true,"password min length should be 6"],
        minlength:6
    },
    mobileNumber:{
        type:String,
        required:[true,"mobile number is required "],
        trim:true,
        unique:true,
        minlength:10,
        maxlength:10
    },

    role:{
        
        type:String,
        enum:["customer","worker","admin","operator"],
        default:'customer',
        required:true
    },
    savedAddresses:[{
      city:String,
      street:String,
      colony:String,
      houseNo:String,
      landMark:String,
      label:String
    }],
}
)

const User = mongoose.model("User",userSchema)

module.exports=User