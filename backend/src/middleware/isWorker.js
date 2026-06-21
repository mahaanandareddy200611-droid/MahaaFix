const AppError = require("../utils/AppError")
const jwt = require("jsonwebtoken")
const IsWorker = async(req,res,next)=>{

    // const AdminEmails = ["adminofmahaafixone@gmail.com","admin@gmail.com"]; like this there will be no seperate e mails for workers

        if((req.user.role)!=="worker" ){
            
            throw new AppError("you are not authorized to do this");
            
    }
        console.log(req.user.name,req.user.email,"this worker online now!")

        next() 
}
module.exports=IsWorker