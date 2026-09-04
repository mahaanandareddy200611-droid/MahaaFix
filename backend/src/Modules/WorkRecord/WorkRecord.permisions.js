const WorkRecord ={
    draft:{
    next:["processing"],
    // actor:["admin","operator"] 
    },
    processing:{
        next:["readyForReview"],
        // actor:["worker","admin","operator"]
    },
    readyForReview:{
        next:["confirmed"],
        // actor:["worker","admin","operator"]
    },
    confirmed:{
        next:["completed"],
        // actor:["worker","admin","operator"]
    },
    completed:{
        next:["archived"],
        // actor:["worker"]
    },
    archived:{
   next:[],
//    actor:["customer","admin","operator"]
}}

module.exports = WorkRecord;