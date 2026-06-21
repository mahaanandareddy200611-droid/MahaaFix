const AppError  = require("../utils/AppError")

const validate = (schema)=>{
    return (req,res,next)=>{
        const{ error} = schema.validate(req.body,{abortEarly :false})

        if(error){
            const errors = error.details.map( err=>err.message)

            return next(
                new AppError(errors.join(", "),400)
            );
        }
        next()
    }
}
module.exports=validate