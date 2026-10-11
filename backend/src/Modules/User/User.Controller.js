const jwt = require("jsonwebtoken")
const AppError = require("../../utils/AppError")
const user = require("../../models/User")
const userservice = require("./User.Service")
const asyncHandler = require("../../middleware/asyncHandler");

exports.profile= async(req,res)=>{

        const data = await userservice.profile(req.user)
        const {name,email,mobileNumber,age,role,isOnline,
lastSeen,
lastHeartbeat,}= data

        return res.status(200).json({
            message: "Your profile ", 
            data:{
                name,
                email,
                mobileNumber,
                age,
                role
            }
        })
    }

exports.listOnlineWorkers = asyncHandler(
    async (req, res) => {
        const workers =
            await userservice.getOnlineWorkers();

        return res.status(200).json({
            success: true,
            message: "Online workers fetched successfully",
            data: workers,
            meta: {
                evaluatedAt: new Date().toISOString(),
                staleAfterSeconds: Math.floor(
                    require("../../config/presence")
                        .WORKER_HEARTBEAT_TTL_MS / 1000
                ),
            },
        });
    }
);