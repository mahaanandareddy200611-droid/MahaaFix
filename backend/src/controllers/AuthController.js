const User = require("../models/User")
const asyncHandler = require("../middleware/asyncHandler");
const authservice = require("../services/authservice");

const bcrypt = require("bcryptjs")
const AppError = require("../utils/AppError")

//                                   |------------------------------------------|
//                                               from here Sign up
//                                   |------------------------------------------|
exports.Signup = asyncHandler(async(req,res)=>{
        const {name,email,password,age,role,mobileNumber} =req.body //defining them at here to validate

        const data =await authservice.Signup(name,email,password,age,role,mobileNumber)
        
        
        console.log("New user created")
        return res.status(201).json({
            success:true,
            message:" you had created an account",
            data:{
                id:data._id,
                email:data.email,
                name:data.name,
                mobileNumber:data.mobileNumber,
                age:data.age,
                role:data.role
            }
            
        })

    })
//                           |------------------------------------------------------|
//                                            Login from here 
//                           |------------------------------------------------------|

exports.Login= asyncHandler(async (req,res)=>{
    
        const {email,password} =req.body
        const token =await authservice.Login(email,password) 

        return res.status(200).json({
            success:true,
            message:"Login Successful", token
})
        

})