const workflow ={
    Created:{
    next:["Assigned"],
    actor:["admin","operator"]
    },
    Assigned:{
        next:["WorkerAccepted"],
        actor:["worker","admin","operator"]
    },
    WorkerAccepted:{
        next:["Checking"],
        actor:["worker","admin","operator"]
    },
    Checking:{
        next:["Reject","WaitingCustomerApproval"],
        actor:["worker","admin","operator"]
    },
    // EstimateSubmitted:{
    //     next:["WaitingCustomerApproval","TemporaryFixApproved","Reject"],
    //     actor:["worker"]
    // },
    WaitingCustomerApproval:{
   next:["TemporaryFixApproved","InProgress","InspectionCompleted"],
   actor:["customer","admin","operator"]
},
    TemporaryFixApproved:{
        next:["InProgress"],
        actor:["customer","admin","operator"]
    },
    InspectionCompleted:{
    next:[],
    actor:["customer","admin","operator"]
},
    Reject:{
        next:[],
        actor:["customer","worker","admin","system"]
    },
    InProgress:{
        next:["WorkCompleted"],
        actor:["worker","admin","operator"]
    },
    WorkCompleted:{
        next:["Verified","ReworkRequired"],
        actor:["customer","admin","operator"]
    },
    // VerificationPending:{
    //     next:["Verified","ReworkRequired"],
    //     actor:["customer"]
    // },
    ReworkRequired:{
        next:["InProgress"],
        actor:["worker","admin","operator"]  
    },
    Verified:{
        next:[],
        actor:["customer","admin","operator"]
    }
}
module.exports = workflow;