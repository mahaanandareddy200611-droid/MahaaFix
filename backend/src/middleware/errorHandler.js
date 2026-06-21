const express = require("express")
const errorHandler=(err,req,res,next)=>{

    err.statusCode = err.statusCode || 500;

    err.message = err.message || ", techical issue or server Error,  try, after some time "
    
    // Invalid Mongooose ObjectId

    // name: "CastError",          mongoose return errors llike this 
    // kind: "ObjectId",
    // path: "_id",         path is a variable where value is stored 
    // value: "123",            the value

    // message: 'Cast to ObjectId failed for value "123"'

    if(err.name === "CastError"){
        err.statusCode = 400;;
        err.message = `Invalid ${err.path}: ${err.value}`;
        
    }
    
    if(err.name === "ValidationError"){ // db validations
        const messages = Object.values(err.errors).map(val => val.message); // here db returns the message or error in models  map gives only message 
        err.statusCode = 400
        err.message = messages.join(", ")
    }

    if(err.code === 11000){ // dublicate key error 
        const field = Object.keys(err.keyValue)[0];

        err.statusCode = 400;
        err.message = `${field} already exists`;

    }

    if(err.name === "JsonWebTokenError"){
    err.statusCode = 401;
    err.message = "Invalid token";
}           
    if(err.name === "TokenExpiredError"){
        err.statusCode = 401;
        err.message = "Token expired";
}

    console.log(err);
    return res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}

module.exports = errorHandler;