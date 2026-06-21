const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const Auth = async(req , res, next)=>{
    
        // here we get token like this 
        const AuthHeader = req.headers.authorization;

        if(!AuthHeader){
            console.log("token does not exist ")
            throw new AppError("token not found! , please Login",403)
        }
        const token = AuthHeader.split(" ")[1];
        // now we have token lets verify it .
        const verfiedToken = jwt.verify(token,process.env.JWT_SECRET);
        // if(!verfiedToken){
        //     console.log(" token invalid or wrong token ")
        //     return res.status(403).json({                   this was not needed because jwt.verify diretly does this job! it checks:
        //                                                     token authentic?   secret correct?   token expired?  token modified? 
        //         success : false,
        //         message:" token was not valid"
        //     })        }

        

        req.user = verfiedToken;
        
        // res.status(200).json({    we should not do this because  after .sent .json it completes, next() wont happens 
        //     success:true,
        //     message :" token was fine "
        // })

        next();
    }
module.exports=Auth;