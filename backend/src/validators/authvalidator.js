const joi = require("joi")

exports.signup= joi.object({
    name : joi.string().required(),

    age : joi.number().min(18).required(),

    email : joi.string().lowercase().trim().email().required(),

    password: joi.string().min(6).required(),

    mobileNumber: joi.string().pattern(/^[0-9]{10}$/).required(),

    role: joi.string().default("customer").valid("customer","worker","admin","operator").required(),

    savedAddresses: joi.object({
    city:joi.string().required(),
    street: joi.string().required(),
    colony:joi.string().required(),
    houseNo:joi.string().required(),
    landMark:joi.string().required(),
    label:joi.string()
    })
})

exports.login = joi.object({

    email : joi.string().lowercase().trim().email().required(),

    password: joi.string().min(6).required(),

})