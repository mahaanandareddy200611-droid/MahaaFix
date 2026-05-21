const mongoose = require("mongoose")

const jobSehema = new mongoose.Schema({
    title:{
        type :String,
        require:true,
        length:100
    },
    description:{
        type:String,
        require:true
    },
    category:{
        emum:[]
    }
})