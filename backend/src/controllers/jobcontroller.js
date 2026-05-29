const workflow = require("../utils/workflow");

const Job = require("../models/job")

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------create jobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------




exports.createJobs = async (req,res)=>{
    try {
        const {title,description,category,subCategory,address,mobileNumber,visualproofs,beforePhoto,beforeVideo,paymentStatus,budget}=req.body
        if((!title||!description||!category||!subCategory||!beforePhoto||!beforeVideo||!address||!budget)){
            return res.status(400).json({
                success:false,
                message:"Fill all required blanks",

            })
        } 
        const subCateg = ["Electrical","Plumbing","AC-repair","House-cleaning","Bathroom-cleaning","ApplianceRepair"]
        const categ  = ["repair","new-installation","inspection","cleaning","emergency"]     
        if(!categ.includes(category)||!subCateg.includes(subCategory)){
            return res.status(400).json({
                success: false,
                message:"choosen invalid category or subcategory"
            })
        }
        const NewJOb = await Job.create({
            title,
            description,
            category,
            subCategory,
            mobileNumber,
            
            address,
            customer:{
            userid:req.user.id,
            name:req.user.name,
            mobileNumber:req.user.mobileNumber
                },
            visualProofs: {
                beforePhotos: beforePhoto || [],
                beforeVideos: beforeVideo || []
            },

            payments: {
                budget: budget,
                paymentStatus: paymentStatus || "Pending"
            }
        })
        return res.status(201).json({
            success:true,
            message :"Job created Successfully",
            data:NewJOb
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"server error"

        })
    }
}   


//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------myJobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------





exports.myJobs=async  (req,res)=>{
    try {
        let jobs;

        if(req.user.role == "worker"){
            jobs = await Job.find({"worker.workerid":req.user.id}).select("title category subCategory address.city address.street")
        }
        else if (req.user.role=="customer") {
            jobs = await Job.find({"customer.userid":req.user.id}).select("title category subCategory address.city")
            
        }
        else if(req.user.role=="admin"||req.user.role=="operator"){
            jobs= await Job.find().select("title category subCategory address.city address.street")
        }

        return res.status(200).json({
            success:true,
            message:"successfully , your jobs are",
            data:jobs,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"server error"

        })      
        
    }
}

//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------getJobs------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------








exports.getJobs= async (req,res)=>{

    // fetch jobs for work 
    try{
        const jobs = await Job.find().select("title category subCategory address.city address.street") // DB gives onle these selected  

        return res.status(200).json({
            success:true,
            message:"jobs fetched successfully",
            data: jobs
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server error, try Again"
        })
    }
}



//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------getThisJob------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------



exports.getThisJob = async (req,res)=>{

    try{

        const job = await Job.findById(req.params.id)

        if(!job){
            return res.status(404).json({
                success:false,
                message:"Job not found"
            })
        }

        return res.status(200).json({
            success:true,
            message:"Job fetched successfully",
            data:{
                address : job.address,
                category: job.category,
                subCategory:job.subCategory,
                beforePhotos : job.visualProofs.beforePhotos,
                beforeVideos : job.visualProofs.beforeVideos
            }
        })

    }catch(error){

        console.log(error)

        return res.status(500).json({
            success:false,
            message:"Server error, try Again"
        })

    }
}


//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------Accepted------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------



exports.Accepted = async(req,res)=>{
    try {

        const job = await Job.findById(req.params.id) // defining that job

        if(!job){
            return res.status(404).json({
                success:false,
                message:"Job not found"
            })
        }

        if(job.status !== "Assigned"){
            return res.status(400).json({
                success:false,
                message:"Only assigned jobs can be accepted"
    })
}

        if(job.worker?.workerid){  // this search for worker? workerid if found it stops dubilicate accepts
            return res.status(403).json({
                success:false,
                message:"this job is already accepted by another worker!"
            })
        }
        job.worker={
            workerid:req.user.id,
            name:req.user.name,
            mobileNumber:req.user.mobileNumber
        }
        job.status = "WorkerAccepted"

        await job.save()
        return res.status(200).json({
            success:true,
            message:"Successfully Accepted the work "
        })
        
    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success:false,
            message:"Server error, try Again"
        })

        
    }
}


//---------------------------------------------------------------------------------------------------------------------------------------------
//        ||||||||||||||||||||||---------------------updateStatus------------------------------|||||||||||||||||||||||
// --------------------------------------------------------------------------------------------------------------------------------------------



exports.updateStatus = async (req, res) => {
    try {

        const { newStatus } = req.body;

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const currentStatus = job.status;

        const currentWorkflow = workflow[currentStatus];

        if (!currentWorkflow) {
            return res.status(400).json({
                success: false,
                message: "Invalid current workflow state"
            });
        }

        if (!currentWorkflow.next.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot move from ${currentStatus} to ${newStatus}`
            });
        }

        const allowedActors = currentWorkflow.actor;

        const userRole = req.user.role;

        if (!allowedActors.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Only ${allowedActors.join(", ")} can update this status`
            });
        }


        const isAdminOrOperator =
            req.user.role === "Admin" ||
            req.user.role === "operator";


        if (
            userRole === "worker" &&
            !isAdminOrOperator
        ) {

            // only assigned worker can update
            if (
                !job.worker?.workerid ||
                job.worker.workerid.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "This job is not assigned to you"
                });
            }
        }

        
        if (
            userRole === "customer" &&
            !isAdminOrOperator
        ) {

            if (
                job.customer.userid.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not the owner of this job"
                });
            }
        }

        job.status = newStatus;

        await job.save();

        return res.status(200).json({
            success: true,
            message: `Job status updated from ${currentStatus} to ${newStatus}`,
            data: job
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error, try again"
        });

    }
};