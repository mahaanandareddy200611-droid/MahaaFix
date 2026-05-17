const jwt = require("jsonwebtoken")

const user = require("../models/User")

exports.profile= async(req,res)=>{
    try{
        // fetech currect user details
        const findUser = await user.findById(req.user.id)
        if(!findUser){
            return res.status(404).json({ // if any deleted user by admin can still come here but no data in DB he will be in this ERROR
                success : false,                // banned users , deleted accounts suspended accounts 
                message:"User not found"        // old tokens from frontend may give access till here
            });

        }
        const {name,email,mobileNumber,age,role}=findUser

        return res.status(200).json({
            message: "Your profile ", 
            data:{
                name,
                email,
                mobileNumber,
                age,
                role
            }
        })
    }catch(error){
        console.log(error)
        return res.status(400).json({
            success:false,
            message:"Server error, try later."
        })

    }
}