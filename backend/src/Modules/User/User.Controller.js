const jwt = require("jsonwebtoken")
const AppError = require("../../utils/AppError")
const user = require("../../models/User")
const userservice = require("./User.Service")

exports.profile= async(req,res)=>{

        const data = await userservice.profile(req.user)
        const {name,email,mobileNumber,age,role}= data

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