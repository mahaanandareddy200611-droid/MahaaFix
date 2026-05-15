const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        min:18,
        required:true
        
        },
    
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        unique:true
    },

    role:{
        
        type:String,
        enum:['user','user + worker','Admin','operater'],
        default:'user',
        required:true
    }
}
)
const User = mongoose.model("User",userSchema)
module.exports=User