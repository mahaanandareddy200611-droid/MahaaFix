const mongoose = require("mongoose")


const jobSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"please give what major problem"],
        maxlength:100,
    },
    description:{
        type:String,
        required:[true,"explain about the problem "]
    },
    category:{
        type:String,
        enum:['repair','new-installation','inspection','cleaning','emergency'],
        required:[true,"choose from category"]
    },
    subCategory:{
        type:String,
        enum:['Electrical','Plumbing','AC-repair','House-cleaning','Bathroom-cleaning','ApplianceRepair'],
        required:[true,"this subCategory not available for service"]
    },
    status:{
        type:String,
        enum:[ "Created", "Assigned",
            "WorkerAccepted",
            "Checking",
            "EstimateSubmitted",
            "WaitingCustomerApproval",
            "TemporaryFixApproved",
            "InProgress",
            "WorkCompleted",
            "VerificationPending",
            "Verified",
            "ReworkRequired",
            "Reject"
        ],
        default:'Created',
        required:true
    },
    address:{
        city:{
            type:String,
            required:[true,"please menction city"]
        },
        street:{
            type:String,
            required:[true , "please menction street"], },
        colony:{
            type:String,
            },
        houseNo:{
            type:String,
            required:[true,"please menction the house number"]},
        landMark:{
            type:String,
            },
        newMobile:{
            type:String,
            required:[true,"please conform mobile number"],
        },
    gpsLocation:{
        longitude:{
            type:Number,
        },
        latitude:{
            type:Number,
        }

    },
    
    },
    //coustomer
    customer:{
        userid:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        name:{type:String,
            required:true,
        },
        mobileNumber:{
            type:String,
            required:true
        },
        location:{
            longitude:{
                type:Number,
            },
            latitude:{
                type:Number,
            }
            }
    },
    //worker
    worker:{
        workerid:{type:mongoose.Schema.Types.ObjectId,
            ref:"User",
                                   // here in worker wont have required because 
                                   // we are not fixing this , so initially here we wont put required
        },
        name:{
            type:String,
            
        },
        mobileNumber:{ 
            type:String,                           
        },  
        location:{
            longitude:{                    
                type:Number,            
            },                
            latitude:{                    
                type:Number,
            }
        }
    },
    visualProofs:{
        beforePhotos:[{
            type:String,
            required:[true, "please upload photos of where problem exists"]
        }],
        
        beforeVideos:[{
            type:String,  // these are strings because  "https://cloudinary.com/video123.mp4"
            required:true
        }],
        afterPhotos:[{
            type:String,
                                 // here we are using Square brackets because for 
        }],                     //    what if worker uploads 5 photos?            ans : it stores all of them 
        afterVideos:[{             // now these are like arrays  ==>> multible rooms 
            type:String,         
        }]
    },
    EstimateSubmitted:{
        budget:{
            type:Number,
        },
        actualProblem:{
            type:String,
        },

    },
    ReworkRequired:{
        proof:[{type:String}],
    },
    
    payments:{
        upfront:{
            type:Number,
            default:0
        },
        budget:{
            type:Number,
        
        },
        paymentStatus:{
        type:String,
        enum:['Pending','Held','Released','Refunded'],
        default:'Pending'
    }
        
    },

    },
    {timestamps:true})

    const Job = mongoose.model("Job",jobSchema)
    module.exports=Job