const express = require("express")

const authentication = express.Router()

const {signup , login,forgotPassword:forgotPass,newpassword:password ,otp} = require("./Auth.Validator")

const validate  = require("../../utils/validate");

const {Login ,Signup,forgotPassword,verifyResetOtp,newPassword,
    workerOnline,workerHeartbeat,workerOffline
}= require("./Auth.Contoller");

const idempotancyMiddleware = require("../../infrastructure/idempotency/idempotancy.middleware");
const Auth = require("../../middleware/Auth");

authentication.post("/signup",validate(signup),Signup)

authentication.post("/login",validate(login),Login)

authentication.post("/forget-password",validate(forgotPass),forgotPassword)

authentication.post("/verify-reset-otp",validate(otp),verifyResetOtp)

authentication.post("/reset-password",validate(password),newPassword)

authentication.post("/online",Auth,idempotancyMiddleware,workerOnline)
// for worker changing the the online with a button

authentication.post("/heartbeat",Auth,workerHeartbeat)
// frontend sends with after some time if worker is online or not 

authentication.post("/offline",Auth,idempotancyMiddleware,workerOffline)
// makes offline  

module.exports=authentication
