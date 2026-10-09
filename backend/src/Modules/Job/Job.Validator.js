const Joi = require("joi")

exports.createjob = Joi.object({
    title:Joi.string().trim().max(100).required(),

    description:Joi.string().trim().required(),

    category:Joi.string().valid(
        "repair","new-installation","inspection","cleaning","emergency"
    ).required(),
    
    subCategory:Joi.string().valid(
        "Electrical","Plumbing","AC-repair","House-cleaning","Bathroom-cleaning","ApplianceRepair"
    ).required(),

    status:Joi.string().default("Created"),

    address:Joi.object({
        city:Joi.string().required(),
        street:Joi.string().required(),
        houseNo:Joi.string().required(),
        newMobile:Joi.string().pattern(/^[0-9]{10}$/).required(),
            
        colony:Joi.string().allow(""),
        landMark:Joi.string().allow("")
    }).required(),

    budget:Joi.number().positive().required()
    .messages({
        "number.base":"Budget must be numeric",
        "any.required":"Budget is required"
    }),
    
    beforeMedia: Joi.array()
    .items(
        Joi.string().pattern(/^[a-fA-F0-9]{24}$/)
    )
    .required(),

})