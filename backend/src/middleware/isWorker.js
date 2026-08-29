const AppError = require("../utils/AppError")
const jwt = require("jsonwebtoken")
const IsWorker = async(req,res,next)=>{

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }
    if((req.user.role)!=="worker" ){
            
        throw new AppError("you are not authorized to do this");
            
    }
    
        console.log(req.user.name,req.user.email,"this worker online now!")

        next() 
}
module.exports=IsWorker