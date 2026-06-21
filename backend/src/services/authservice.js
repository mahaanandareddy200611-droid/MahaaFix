const AppError = require("../utils/AppError");
const User = require("../models/User");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")


exports.Signup = async(name,email,password,age,role,mobileNumber)=>{
    
    const checkingExistance = await User.findOne({email})
        if(checkingExistance){
            throw new AppError("you already had an account please, LOGIN ");
            
        }

    const HashedPassword = await bcrypt.hash(password,10)
        
    const createUser = await User.create({
            name,
            email,
            password:HashedPassword,
            age,
            mobileNumber,
            role
        })

    return createUser;

}

exports.Login = async(email,password)=>{

    const checkingExistance = await User.findOne({email})
        if(!checkingExistance){
            console.log("email not found in DB")
            throw new AppError("you didn't had account please , SIGN UP",400);
            
        }
        const isMatch = await bcrypt.compare(password,checkingExistance.password)
        if(!isMatch){
            throw new AppError("Incorrect password",400);
            
             
        }
        console.log("User logined",email,checkingExistance.name)

        
        const token = jwt.sign({
            id: checkingExistance._id,
            email:checkingExistance.email, // what we want to use after token; we have to menction here those only, we can access from token..
            role: checkingExistance.role,
            name:checkingExistance.name,
            mobileNumber:checkingExistance.mobileNumber
        },
        
            process.env.JWT_SECRET,
        {
            expiresIn:"14d" //14 days
        }
        );

        return token

}