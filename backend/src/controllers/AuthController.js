const User1 = require("../models/User")

const bcrypt = require("bcryptjs")

//                                   |------------------------------------------|
//                                               from here Sign up
//                                   |------------------------------------------|
exports.Signup = async(req,res)=>{
    try{
        const {name,email,password,age,role,mobileNumber} =req.body //defining them at here to validate
        
        if(!name||!email||!password||!age||!mobileNumber){
            console.log("ERROR : not entered all required things")
            return res.status(400).json({
                success:false,
                message:" enter all required credenctials",
            })
        }
        if(age<18){
            console.log("minor tried to enter")
            return res.status(400).json({
                success:false,
                message : " you are a MINOR you are NOT eligeble to this"
            })
        }

        if(!email.includes("@") || !email.includes(".com")){// checking @ and .com present in email or not
            console.log("entered email was wrong ")
            return res.status(400).json({
                success:false,
                message:"Invalid email"})
        }
        if(password.length<6){
            return res.status(400).json({
                success:false,
                message:"password less than 6 ,it's invalid "
            })
            
        }
        if(String(mobileNumber).length!==10){
            return res.status(400).json({
                success:false,
                message:"entered Mobile number was Invalid"
            })
        }
        const HashedPassword = await bcrypt.hash(password,10)
        
        const allowedRoles=["user","worker","Admin","operater"]
        if(!allowedRoles.includes(role)){ // checking role is present in Allowed roles or not
            return res.status(400).json({
                success:false,
                message:"you choosed role not exist, choose from ['user','user + worker','Admin','operater'] "
            })
        }
        const checkingExistance = await User1.findOne({email})
        if(checkingExistance){
            return res.status(409).json({
                success:false,
                message:" you Already had a Account , please login"
            })
        }
        const createUser = await User1.create({
            name,
            email,
            password:HashedPassword,
            age,
            mobileNumber,
            role
        })
        console.log("New user created")
        return res.status(201).json({
            success:true,
            message:" you had created an account",
            data:{
                email,
                name,
                mobileNumber,
                age
            }
            
        })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                message:error.message // gives actual error
            })
        }

    }
//                           |------------------------------------------------------|
//                                            Login from here 
//                           |------------------------------------------------------|

exports.Login= async (req,res)=>{
    try{
        const {email,password} =req.body
        
        if(!email||!password){
            console.log("ERROR : not entered all required things")
            return res.status(400).json({
                success:false,
                message:" enter all required credenctials",
            })
        }
        
        if(!email.includes("@") || !email.includes(".com")){
            console.log("entered email was wrong ")
            return res.status(400).json({
                success:false,
                message:"Invalid email"})
        }
        if(password.length<6){
            return res.status(400).json({
                success:false,
                message:"password less than 6 ,it's invalid "
            })
            
        }
        
        const checkingExistance = await User1.findOne({email})
        if(!checkingExistance){
            console.log("email not found in DB")
            return res.status(400).json({
                success:false,
                message:" you Did't had a Account , please signup"
            })
        }
        const isMatch = await bcrypt.compare(password,checkingExistance.password)
        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect Password"
            })
             
        }
        console.log("User logined",email,checkingExistance.name)

        const jwt = require("jsonwebtoken")

        const token = jwt.sign({
            id: checkingExistance._id,
            email:checkingExistance.email, // what we want to use after token; we have to menction here those only, we can access from token..
            role: checkingExistance.role
        },
        
            process.env.JWT_SECRET,
        {
            expiresIn:"14d" //14 days
        }
        );

        return res.status(200).json({
            success:true,
            message:"Login Successful",
            token
})
        

    }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                message:error.message // gives actual error
            })
        }
}

