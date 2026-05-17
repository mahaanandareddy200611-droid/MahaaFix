const jwt = require("jsonwebtoken")
const IsAdmin = async(req,res,next)=>{
try{
    const AdminEmails = ["adminofmahaafixone@gmail.com","admin@gmail.com"];

        if((req.user.role)!=="Admin" || (!AdminEmails.includes(req.user.email))){
            console.log("tried to enter as a Admin")
            return res.status(403).json({
                success : false,
                message:"Access denied"
        });
    }
        console.log("Admin entered")

        next() 
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message 
        })
    }
}
module.exports=IsAdmin