const User = require("../../models/User")
const asyncHandler = require("../../middleware/asyncHandler");
const authservice = require("../Auth/Auth.Service");

// const bcrypt = require("bcryptjs")
// const AppError = require("../../utils/AppError")

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
        const result =await authservice.Login(email,password) 

        return res.status(200).json({
            success:true,
            message:"Login Successful",
            token:result.token,
            user:result.user
})
        

})


exports.forgotPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body
    const find =await authservice.forgotPassword(email)

    return res.status(200).json({
        success:true,
        message:"otp-sent",
        data:find
    })
})
exports.verifyResetOtp = asyncHandler(async(req,res)=>{
    const {otp,email} = req.body
    await authservice.verifyResetOTP(otp,email)
    return res.status(200).json({
        success:true,
        message:"otp veified , successful"
    })
})

exports.newPassword = asyncHandler(async(req,res)=>{
    const {password,email} = req.body
    await authservice.password(password,email)
    return res.status(200).json({
        success:true,
        message:"password changed"
    })
})