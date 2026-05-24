const workflow = require("../utils/workflow");

const Job = require("../models/job")

exports.createJobs = async (req,res)=>{
    try {
        const {title,description,category,subCategory,address,mobileNumber,visualproofs,beforePhoto,beforeVideo,paymentStatus}=req.body
        if((!title||!description||!category||!subCategory||!beforePhoto||!beforeVideo||!address)){
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
                paymentStatus: paymentStatus || "Pending"
            }
        })
        return res.status(201).json({
            success:true,
            message :"Job created Successfully",
            data:NewJOb
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"server error"

        })
    }
}   


//                                 |------------------------------------------------------|
//                                                  worker permissions
//                                 |------------------------------------------------------|


exports.getJobs= async (req,res)=>{

    // fetch jobs for work 
    try{
        const jobs = await Job.find()

        return res.status(200).json({
            success:true,
            message:"jobs fetched successfully",
            data:jobs
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server error, try Again"
        })
    }
}

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
            data:job
        })

    }catch(error){

        console.log(error)

        return res.status(500).json({
            success:false,
            message:"Server error, try Again"
        })

    }
}



exports.updateStatus = async (req, res) => {
    try {

        const { newStatus } = req.body;

        // ==============================
        // FIND JOB
        // ==============================
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // ==============================
        // CURRENT STATUS
        // ==============================
        const currentStatus = job.status;

        // ==============================
        // CHECK WORKFLOW EXISTS
        // ==============================
        const currentWorkflow = workflow[currentStatus];

        if (!currentWorkflow) {
            return res.status(400).json({
                success: false,
                message: "Invalid current workflow state"
            });
        }

        // ==============================
        // CHECK NEXT STATUS VALID
        // ==============================
        if (!currentWorkflow.next.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot move from ${currentStatus} to ${newStatus}`
            });
        }

        // ==============================
        // CHECK ACTOR PERMISSION
        // ==============================
        const allowedActors = currentWorkflow.actor;

        const userRole = req.user.role;

        if (!allowedActors.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Only ${allowedActors.join(", ")} can update this status`
            });
        }

        // ============================================
        // ADMIN / OPERATOR CAN BYPASS OWNERSHIP
        // ============================================
        const isAdminOrOperator =
            req.user.role === "Admin" ||
            req.user.role === "operator";

        // ============================================
        // WORKER OWNERSHIP CHECK
        // ============================================
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

        // ============================================
        // CUSTOMER OWNERSHIP CHECK
        // ============================================
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

        // ==============================
        // UPDATE STATUS
        // ==============================
        job.status = newStatus;

        await job.save();

        // ==============================
        // SUCCESS RESPONSE
        // ==============================
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