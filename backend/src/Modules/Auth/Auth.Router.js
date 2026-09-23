const express = require("express")

const authentication = express.Router()

const {signup , login,forgotPassword:forgotPass,newpassword:password ,otp} = require("./Auth.Validator")

const validate  = require("../../utils/validate");

const {Login ,Signup,forgotPassword,verifyResetOtp,newPassword }= require("./Auth.Contoller");
const idempotancyMiddleware = require("../../infrastructure/idempotency/idempotancy.middleware");

authentication.post("/signup",validate(signup),idempotancyMiddleware,Signup)
authentication.post("/login",validate(login),Login)
authentication.post("/forget-password",validate(forgotPass),forgotPassword)
authentication.post("/verify-reset-otp",validate(otp),verifyResetOtp)
authentication.post("/reset-password",validate(password),newPassword)

module.exports=authentication
