const User = require("../models/user");

exports.userInfo= async(req,res)=>{
    
    try {
        
        const {name,email} = req.body // we have to define to use 
        
        
        if(!name||!email){
            console.log("name and email not given")

            return res.status(400).json({

                message:"not filled the required blanks "

            })}

        const checkingUser = await User.findOne({ email });
        if(checkingUser){
            return res.json({
                message : "you already had a account "
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

    
       