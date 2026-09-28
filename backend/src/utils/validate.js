const AppError  = require("./AppError")

const validate = (schema)=>{
    return (req,res,next)=>{
        const{ error,value} = schema.validate(req.body,{abortEarly :false})

        if(error){
            const errors = error.details.map( err=>err.message)

            return next(
                new AppError(errors.join(", "),400)
            );
        }

        req.body = value; // value being written back into req.body.
        // with is we get can handle clear data to route handler 
        next()
    }
}
module.exports=validate