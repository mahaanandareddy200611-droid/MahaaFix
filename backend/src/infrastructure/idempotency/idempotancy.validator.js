const Joi = require("joi");

const idempotencyKeySchema = Joi.string().trim().min(1).max(255).required();

exports.validateIdempotancyKey = (key) => {
    const { error, value } = idempotencyKeySchema.validate(key);

    if(error){
        console.log(error)
        return {
            valid:false,
            value:null,
            message:error.details[0].message,
            
        }
    }

    return {
        valid:true,
        value,
        message:null,
    }
};