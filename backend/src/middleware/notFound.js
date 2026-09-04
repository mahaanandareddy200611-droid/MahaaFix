const AppError = require("../utils/AppError")

const notFound = async(req,res,next)=>{
    next(
        new AppError(`Router not found ${req.method} ${req.url}`,404)
    )
}

module.exports=notFound;