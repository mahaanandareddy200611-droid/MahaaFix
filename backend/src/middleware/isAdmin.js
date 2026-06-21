const jwt = require("jsonwebtoken")
const AppError = require("../utils/AppError");
const IsAdmin = async(req,res,next)=>{

    const AdminEmails = ["adminofmahaafixone@gmail.com","admin@gmail.com"];

        if((req.user.role)!=="admin" || (!AdminEmails.includes(req.user.email))){
            console.log("tried to enter as a Admin")
            throw new AppError("you are warned!",403);
            
    }
        console.log("Admin entered")    

        next() 
    
}
module.exports=IsAdmin