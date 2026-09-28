const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const { sendMail } = require("../../common/mail/mailer");
const { worker } = require("cluster");
const { now } = require("mongoose");


exports.Signup = async(name,email,password,age,role,mobileNumber)=>{
    
    const checkingExistance = await User.findOne({email
    })
        if(checkingExistance){
            throw new AppError("you already had an account please, LOGIN ",400);
            
        }

    const HashedPassword = await bcrypt.hash(password,10)
        
    const createUser = await User.create({
            name,
            email,
            password:HashedPassword,
            age,
            mobileNumber,
            role:"customer"
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
            expiresIn:"15m"          // 15m => 15 min  //14d => 14 days
        }
        );

        return {
    token,
    user: {
        id: checkingExistance._id,
        name: checkingExistance.name,
        email: checkingExistance.email,
        mobileNumber: checkingExistance.mobileNumber, // for to use in these details in frontend
        age: checkingExistance.age,
        role: checkingExistance.role
    }
};

}

exports.forgotPassword = async(email)=>{
    const user = await User.findOne({email});
    if(!user){
        throw new AppError("If an account exists for this email, a reset OTP has been sent.",200)}
     // Generate 6 digit OTP
    const otp = crypto
        .randomInt(100000, 1000000)
        .toString();

    // Hash OTP before storing
    const otpHash = crypto
        .createHash("sha256")  // SHA-256 === some long hash or fixed-length hash.
        .update(otp)   // takes to hashing algorithm
        .digest("hex"); 

    user.passwordResetOtpHash = otpHash; // store in db

    user.passwordResetOtpExpires =
        new Date(Date.now() + 5 * 60 * 1000); // 5 is the time for expiration

    user.passwordResetOtpAttempts = 0; 

    user.passwordResetVerifiedUntil = null; //Clear old verification

    await user.save(); 
    
    await sendMail({
        to:email,
        subject:"Your OTP for forgot password request",
        text:`your MahaaFix password reset OTP is ${otp}. It is valid for 3 min 
        if this not requested by you please ignore it. Don't share otp we are not responsible for that !!! `,

        html:`
            <h2> Mahaafix Password Reset </h2>
            <p>Your password reset OTP is: <p>
            <h1>${otp} </h1>
            <p> This OTP is valid for <Strong> 3 minutes </strong> .</p>
            <p> If you did not request this, please ignore this email.</p>
        `
    })

    // Temporary for development
    console.log("PASSWORD RESET OTP:", otp);

    return {
        sent: true
    };
}

exports.verifyResetOTP = async(otp,email)=>{
    if(!otp){
        throw new AppError("otp not found",400);
    }
    if(!email){
        throw new AppError("email not found",400);
    }
    const currentTime = Date.now()

    const user = await User.findOne({email}) // checking for the user is really exist or not 
    if (!user) {
        throw new AppError("Invalid request", 400);
    }

    if(user.passwordResetOtpAttempts>=5 ){
        throw new AppError("your otp expired",400)
    }

    if(user.passwordResetOtpExpires<=currentTime){
        throw new AppError("your otp expired",400) 

    }

    const otpHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    const isMatch = otpHash === user.passwordResetOtpHash;

    if(!isMatch){
        user.passwordResetOtpAttempts +=1
        await user.save()
        throw new AppError("Incorrect otp",400)
    }

    user.passwordResetVerifiedUntil =
        new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetOtpAttempts = 0;

    await user.save();

    return {
        verified: true
    };
}

exports.password = async(password,email)=>{
    if(!password){
        throw new AppError("password not found try again",404)
    }
    if(!email){
        throw new AppError("email not found",400);
    }
    const checkingExistance = await User.findOne({email
    })
    if(!checkingExistance){
        throw new AppError("",400);
    }
    if(!checkingExistance.passwordResetVerifiedUntil||checkingExistance.passwordResetVerifiedUntil.getTime() <= Date.now()){
        throw new AppError(
            "OTP verification required or expired",
            400
        );
    }
    const HashedPassword = await bcrypt.hash(password,10)
        
    checkingExistance.password = HashedPassword
    
    checkingExistance.passwordResetVerifiedUntil = null

    await checkingExistance.save()

    return {
        updated:true
    }
}

exports.workerOnline = async(user)=>{
    if(!user.id||user.role!="worker"){
        throw new AppError("only logged in workers can update their presence",403)
    }
    const now = new Date()

    await User.findByIdAndUpdate(user.id,{
        $set: {
            isOnline: true,
            lastSeen:now,
            lastHeartbeat:now
        }
    },{
            runValidators: true
        })
    return{
        isOnline:true,
        lastHeartbeat:now
    }

}

exports.workerHeartbeat = async(user)=>{
    if(!user.id||user.role!="worker"){
        throw new AppError("only loggedin users can update the presence ",403)
    }
    const now = new Date()

    await User.findByIdAndUpdate(user.id,{
        $set:{
            isOnline:true,
            lastSeen:now,
            lastHeartbeat:now
        }
    },)
    return {
        isOnline:true
    }
}

exports.workerOffline=async(user)=>{
    if(!user.id||user.role!="worker"){
        throw new AppError("only loggedin users can update the presence ",403)
    }
    const now = new Date()

    await User.findByIdAndUpdate(user.id,{
        $set:{
            isOnline:false,
            lastSeen:now
        }
    })

    return {
        isOnline:false
    }
}