const jwt = require("jsonwebtoken")
const IsWorker = async(req,res,next)=>{
try{
    // const AdminEmails = ["adminofmahaafixone@gmail.com","admin@gmail.com"]; like this there will be no seperate e mails for workers

        if((req.user.role)!=="worker" ){
            

            return res.status(403).json({
                success : false,
                message:"Access denied , worker account needed "
        });
    }
        console.log(req.user.name,req.user.email,"this worker online now!")

        next() 
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message 
        })
    }
}
module.exports=IsWorker