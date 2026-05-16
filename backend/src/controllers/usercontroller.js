const User = require("../models/User");

exports.userInfo= async(req,res)=>{
    
    try {
        
        const {name,email,password,age,role} = req.body // we have to define to use 
        if(!name||!email||!password){
            console.log("name and email,password not given")

            return res.status(400).json({
                success: false,
                message:"not filled the required blanks "

            })}
        if (!email.includes("@")){
            return res.status(400).json({
                success:false,
                message: "invalid email"
            })
        }
        if(length(password)<6){
            return 
        }
        const allowedroles =["user","worker","Admin","operator"] // this should be useed if not can't check below condition
        if(!allowedroles.includes(role)){
            return res.status(400).json({
                success: false,
                message:"roles are only ['user','user + worker','Admin','operater'] choose one"
            })
        }
        
        if(!age ||age<18){
            console.log(" age error",age)
            return res.status(400).json({
                success:false,
                message: "Enter age , grater than or equal to 18 are eligible"
                })
        }

        const checkingUser = await User.findOne({ email });
        if(checkingUser){
            return res.status(409).json({ // 409 Conflict
                success:false,
                message : "User already exist "
            })
        }

        const user = await User.create(req.body)
        
        
        res.status(201).json({
            success: true,
            data: user
        })

   } catch(error) {
    res.status(500).json({
        success: false,
        message: error.message
      })
   }
}

    
       